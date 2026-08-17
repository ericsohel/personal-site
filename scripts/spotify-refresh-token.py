#!/usr/bin/env python3
"""One-time Spotify refresh-token mint for the site's /api/now-playing.

Steps:
  1. Create an app at https://developer.spotify.com/dashboard
     and add this EXACT redirect URI:  http://127.0.0.1:8877/callback
  2. Run:  python3 scripts/spotify-refresh-token.py CLIENT_ID CLIENT_SECRET
  3. Approve access in the browser tab this opens.
  4. Copy the printed SPOTIFY_REFRESH_TOKEN, then set all three env vars in
     Vercel -> Project -> Settings -> Environment Variables and redeploy:
       SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN

The refresh token does not expire unless you revoke the app's access.
Scopes requested are read-only: currently-playing + recently-played.
"""

import base64
import http.server
import json
import secrets
import sys
import urllib.parse
import urllib.request
import webbrowser

REDIRECT = "http://127.0.0.1:8877/callback"
SCOPES = "user-read-currently-playing user-read-recently-played user-top-read"


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    cid, csec = sys.argv[1], sys.argv[2]

    state = secrets.token_urlsafe(16)
    auth_url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(
        {
            "client_id": cid,
            "response_type": "code",
            "redirect_uri": REDIRECT,
            "scope": SCOPES,
            "state": state,
        }
    )
    print("\nApprove access in the browser (opening now):\n\n  " + auth_url + "\n")
    webbrowser.open(auth_url)

    holder = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            ok = q.get("state", [""])[0] == state and "code" in q
            if ok:
                holder["code"] = q["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(
                b"<h3>done &mdash; head back to the terminal.</h3>"
                if ok
                else b"<h3>state mismatch &mdash; close this and rerun the script.</h3>"
            )

        def log_message(self, *args):
            pass

    with http.server.HTTPServer(("127.0.0.1", 8877), Handler) as srv:
        while "code" not in holder:
            srv.handle_request()

    req = urllib.request.Request(
        "https://accounts.spotify.com/api/token",
        data=urllib.parse.urlencode(
            {
                "grant_type": "authorization_code",
                "code": holder["code"],
                "redirect_uri": REDIRECT,
            }
        ).encode(),
        headers={
            "Authorization": "Basic "
            + base64.b64encode(f"{cid}:{csec}".encode()).decode(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    tok = json.load(urllib.request.urlopen(req))
    rt = tok.get("refresh_token")
    print("\nSPOTIFY_REFRESH_TOKEN:\n\n  " + (rt or "MISSING — rerun the script"))
    print(
        "\nSet the three env vars in Vercel and redeploy; /api/now-playing "
        "starts answering with real data."
    )


if __name__ == "__main__":
    main()
