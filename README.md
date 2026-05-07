# ericsohel.com

Personal site. Plain HTML, CSS, and ~20 lines of JS for the theme toggle. No build step.

## Stack rationale

I planned to use Astro + Tailwind, but for a single-page site that's pure
content, the build step is overhead with no payoff. ~5 KB of hand-written CSS
ages just as well as Tailwind, and skipping the bundler means the site loads
in well under 200 ms with zero JavaScript dependencies. If/when a blog gets
added later, swap in Astro at that point.

## Local development

Any static server works. Pick one:

```sh
# Python (no install needed on macOS)
python3 -m http.server 4321

# Node
npx serve .

# Or just open index.html in a browser
open index.html
```

Then visit http://localhost:4321.

## Files

```
index.html     # all the content
styles.css     # ~250 lines, CSS custom properties for theming
script.js      # theme toggle + footer year
favicon.svg    # "es" mark
vercel.json    # cache headers + security headers
```

## Deployment

### 1. Create the GitHub repo

```sh
cd ~/Projects/personal-site
git init
git add .
git commit -m "initial commit"
gh repo create ericsohel/personal-site --public --source=. --push
```

If you don't have `gh` (the GitHub CLI), do it manually: create
`personal-site` on github.com, then:

```sh
git remote add origin git@github.com:ericsohel/personal-site.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import `ericsohel/personal-site`
3. Framework preset: **Other** (it's a static site, no framework)
4. Build command: leave blank
5. Output directory: `.`
6. Click **Deploy**

The site will be live at `ericsohel.vercel.app` within ~30 seconds.

### 3. Custom domain (ericsohel.com)

If you've bought `ericsohel.com` on a registrar (Namecheap, Cloudflare,
Porkbun, etc.):

1. In the Vercel dashboard for this project: **Settings → Domains → Add**.
2. Enter `ericsohel.com` and `www.ericsohel.com`.
3. Vercel shows DNS records to add. Use one of:

   **Option A — apex via A record (simplest):**
   - At your registrar, add an `A` record for `@` pointing to `76.76.21.21`.
   - Add a `CNAME` for `www` pointing to `cname.vercel-dns.com`.

   **Option B — Cloudflare-style (if your registrar supports CNAME flattening):**
   - `CNAME @ → cname.vercel-dns.com`
   - `CNAME www → cname.vercel-dns.com`

4. DNS propagation usually takes 5–30 minutes. Vercel auto-issues a Let's
   Encrypt cert once it sees the records.
5. Set the canonical: in Vercel Settings → Domains, mark `ericsohel.com` as
   primary so `www` redirects to apex (or vice versa, your call).

### 4. Update flow

Edits push automatically:

```sh
# edit something
git add -A && git commit -m "tweak about copy"
git push
```

Vercel rebuilds on push to `main` and ships in ~10 seconds.
