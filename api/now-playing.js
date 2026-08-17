/**
 * GET /api/now-playing — Vercel serverless function.
 *
 * Powers the On Repeat section, the ticker tape, and the terminal's
 * `nowplaying` / `portfolio` / `quote` commands.
 *
 * Returns:
 *  - track/playing: what's in the headphones right now (or last played)
 *  - recent: last few distinct tracks for display
 *  - holdings: last-50 plays aggregated by artist — "recent flow", with
 *    play counts, share %, and a generated ticker symbol
 *  - topArtists: 6-month top artists ("core positions") — null until the
 *    refresh token carries the user-top-read scope
 *
 * All auth lives in env vars (see SPOTIFY-SETUP.md); nothing secret ever
 * reaches the client. Edge-cached 60s so Spotify sees ~1 req/min.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=50";
const TOP_URL = "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5";

function shape(item) {
  return {
    name: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    album: item.album && item.album.name,
    art:
      item.album &&
      item.album.images &&
      (item.album.images[2] || item.album.images[0] || {}).url,
    url: item.external_urls && item.external_urls.spotify,
  };
}

// "Frank Ocean" → FRNK — a fake ticker, honestly fake.
function ticker(name) {
  const letters = String(name).toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return "MUSC";
  if (letters.length <= 4) return letters;
  return (letters[0] + letters.slice(1).replace(/[AEIOU]/g, "")).slice(0, 4);
}

function holdingsFrom(items) {
  const counts = new Map();
  for (const i of items) {
    const a =
      (i.track && i.track.artists && i.track.artists[0] && i.track.artists[0].name) ||
      "unknown";
    counts.set(a, (counts.get(a) || 0) + 1);
  }
  const total = items.length || 1;
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5)
    .map(([artist, plays]) => ({
      artist,
      ticker: ticker(artist),
      plays,
      share: Math.round((plays / total) * 100),
    }));
}

module.exports = async (_req, res) => {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!id || !secret || !refresh) {
    res.status(503).json({ configured: false });
    return;
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh,
      }),
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error("token refresh failed");
    const H = { Authorization: `Bearer ${token.access_token}` };

    const payload = {
      configured: true,
      playing: false,
      track: null,
      recent: [],
      holdings: [],
      sampleSize: 0,
      topArtists: null,
    };

    const [nowRes, recentRes, topRes] = await Promise.all([
      fetch(NOW_URL, { headers: H }),
      fetch(RECENT_URL, { headers: H }),
      fetch(TOP_URL, { headers: H }),
    ]);

    if (nowRes.status === 200) {
      const d = await nowRes.json();
      if (d && d.item) {
        payload.playing = !!d.is_playing;
        payload.track = shape(d.item);
      }
    }

    if (recentRes.ok) {
      const d = await recentRes.json();
      const items = d.items || [];
      payload.sampleSize = items.length;
      payload.holdings = holdingsFrom(items);
      payload.recent = items
        .map((i) => ({ ...shape(i.track), playedAt: i.played_at }))
        .filter((t) => !payload.track || t.url !== payload.track.url)
        .filter((t, idx, arr) => arr.findIndex((x) => x.url === t.url) === idx)
        .slice(0, 4);
    }

    // 403 here just means the token predates the user-top-read scope —
    // the UI treats null as "core positions not unlocked yet".
    if (topRes.ok) {
      const d = await topRes.json();
      payload.topArtists = (d.items || []).map((a) => ({
        artist: a.name,
        ticker: ticker(a.name),
        url: a.external_urls && a.external_urls.spotify,
      }));
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=240");
    res.status(200).json(payload);
  } catch (_err) {
    res.status(502).json({ configured: true, error: "spotify unreachable" });
  }
};
