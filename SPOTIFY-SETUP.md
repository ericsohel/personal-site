# Spotify "On Repeat" — one-time setup

The site's On Repeat section and the terminal's `nowplaying` command read from
`/api/now-playing`, a Vercel serverless function in this repo. It needs three
env vars. Secrets live only in Vercel — never in this repo.

## Steps (~5 minutes)

1. **Create a Spotify app** (you must be logged in to your Spotify account):
   https://developer.spotify.com/dashboard → Create app.
   - Redirect URI — add exactly: `http://127.0.0.1:8877/callback`
   - Which API: Web API. Copy the **Client ID** and **Client secret**.

2. **Mint your refresh token** (one time, locally):

   ```bash
   python3 scripts/spotify-refresh-token.py CLIENT_ID CLIENT_SECRET
   ```

   A browser tab opens → approve → the script prints `SPOTIFY_REFRESH_TOKEN`.
   Scopes are read-only: currently-playing + recently-played.

3. **Set env vars in Vercel**: Project → Settings → Environment Variables →
   add all three for Production (+ Preview if you like):
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`

4. **Redeploy** (Vercel → Deployments → Redeploy, or push any commit).

## Verify

- `https://ericsohel.com/api/now-playing` returns JSON with your track.
- The On Repeat section shows the card; the equalizer animates while playing.
- Terminal: `nowplaying`.

## Notes

- The function caches at the edge (60s) so Spotify sees ~1 request/minute max.
- The refresh token lasts until you revoke the app (Spotify → Account → Apps).
- Until env vars are set, the endpoint returns 503 and the site shows the
  graceful "not wired yet" state — nothing breaks.
