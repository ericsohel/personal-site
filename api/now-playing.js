/**
 * GET /api/now-playing — Vercel serverless function.
 *
 * Returns what Eric is playing on Spotify right now (or what played last),
 * plus a few recent tracks. All auth lives in env vars (SPOTIFY_CLIENT_ID,
 * SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN — see SPOTIFY-SETUP.md);
 * nothing secret ever reaches the client.
 *
 * Cached at the edge for 60s so the Spotify API sees at most ~1 req/min.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=5";

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

    const payload = { configured: true, playing: false, track: null, recent: [] };

    const nowRes = await fetch(NOW_URL, { headers: H });
    if (nowRes.status === 200) {
      const d = await nowRes.json();
      if (d && d.item) {
        payload.playing = !!d.is_playing;
        payload.track = shape(d.item);
      }
    }

    const recentRes = await fetch(RECENT_URL, { headers: H });
    if (recentRes.ok) {
      const d = await recentRes.json();
      payload.recent = (d.items || [])
        .map((i) => ({ ...shape(i.track), playedAt: i.played_at }))
        .filter((t) => !payload.track || t.url !== payload.track.url)
        .slice(0, 4);
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=240");
    res.status(200).json(payload);
  } catch (_err) {
    res.status(502).json({ configured: true, error: "spotify unreachable" });
  }
};
