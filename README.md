# ericsohel.com

Personal site — and a small systems project in its own right. Plain HTML, CSS,
and vanilla JS with no build step, but "plain" undersells it: the page ships an
interactive terminal, a live limit-order-book market, production API demos, and
a serverless Spotify feed, in ~3,600 lines total.

## What actually runs on the page

**A terminal** (`script.js`, ~1,100 lines). A 25-command interpreter with
history, aliases, and section routing — `help`, `whoami`, `demo`, `buy 5`,
`nowplaying`, `quote frank ocean`. Commands can drive the rest of the page:
`demo wire` animates the wire-transfer widget, `demo pysa` runs the taint-flow
trace, `buy`/`sell` hit the same order book the market widget uses.

**A real matching engine** (`orderbook/`). `engine.js` is a limit order book
with price-time priority, held to the same 12-case test list as the C++17 core
in [ericsohel/orderbook](https://github.com/ericsohel/orderbook). The browser
demo imports the engine unmodified — a market maker quotes around a drifting
fair value, a noise trader takes liquidity, and visitors trade against both.

**Live production data.** The DraftIQ widget and `demo` command fetch current
auction valuations from the deployed
[DraftIQ API](https://github.com/ericsohel/draftiq) (the page warms the
free-tier dyno on load so clicks never eat the cold start). The blotter
section and ticker tape pull real listening data through `api/now-playing.js`,
a Vercel serverless function that talks to the Spotify API with a refresh
token (setup in `SPOTIFY-SETUP.md`).

**The rest.** A subway-map life timeline with a rideable train, a bookshelf
with pull-a-spine notes, staged Capital One demos, dark/light theming with no
FOUC, and a ticker tape fed by everything above.

## Stack rationale

I planned Astro + Tailwind, but for a single-page site the build step is
overhead with no payoff. Hand-written CSS ages just as well, and skipping the
bundler means the site loads in well under 200 ms with zero JavaScript
dependencies. If/when a writing section grows past one page, that's the point
to revisit.

## Files

```
index.html          # all the content + structured data
styles.css          # ~1,300 lines, CSS custom properties for theming
script.js           # terminal, widgets, ticker, Spotify wiring
orderbook/          # engine.js (the book), bots.js, demo.js
api/now-playing.js  # Vercel serverless function → Spotify API
og.png              # social card (generated from an SVG of the terminal)
vercel.json         # cache + security headers
```

## Local development

Any static server works (the Spotify function needs `vercel dev` or prod):

```sh
python3 -m http.server 4321
```

## Deploying

Pushes to `main` deploy via Vercel in ~10 seconds:

```sh
git add -A && git commit -m "tweak about copy" && git push
```

Spotify env vars (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
`SPOTIFY_REFRESH_TOKEN`) live in the Vercel project settings — see
`SPOTIFY-SETUP.md` for the one-time token dance.
