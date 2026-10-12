# IEMSS UTHM website — technical notes

For whoever looks after the code. To edit content, read **HANDOVER.md**. To deploy, read **SETUP.md**.

## Layout

    wrangler.jsonc          Cloudflare settings — the KV id goes here
    src/index.js            the Worker: routes three paths, hands the rest to the files
    src/api.js              everything the dashboard does
    src/shared.js           passwords, session tokens, storage helpers
    public/index.html       the public site, one file
    public/admin/           the site manager
    public/data/*.seed.json the content and photo list the site ships with
    public/assets/          logo and photos
    apps-script/            the Google Apps Script behind the contact form

This is a Worker with static assets, not a Pages project. `run_worker_first` is on, so the Worker sees every request and calls `env.ASSETS.fetch()` for anything it does not handle itself.

## Routing

| Path | Handled by |
|---|---|
| `/api/*` | `handleApi()` — sign in, load, save, upload, backups, password |
| `/data/content.json` | KV if saved, otherwise `content.seed.json` |
| `/assets/*` | KV if a photo was uploaded, otherwise the file in `public/` |
| anything else | the static file |

## Storage

One KV namespace, bound as `SITE`:

| Key | Holds |
|---|---|
| `auth` | PBKDF2-SHA256 hash of the password, 150k rounds, random salt |
| `secret` | HMAC key for session tokens, generated on first use |
| `content` | the live content |
| `backup:<timestamp>` | earlier versions, newest 30, expiring after 180 days |
| `photo:<path>` | an uploaded photo, as bytes |
| `photometa` | photo path → last-changed timestamp |
| `photosremoved` | photos deleted in the manager that still exist in `public/` |

No database, no build step. Pushing to GitHub redeploys the code; content changes never touch GitHub.

## Security

- PBKDF2-SHA256, 150,000 rounds, 16-byte random salt, constant-time comparison.
- Sessions are stateless HMAC-signed tokens, 12-hour expiry, sent as a bearer header, held in `sessionStorage`.
- Upload slots are whitelisted: a path can only resolve to `assets/hero.jpg`, `assets/committee.jpg`, or `assets/events/<name>-[123].jpg`. Traversal is rejected, not sanitised.
- Photos are re-encoded to JPEG in the browser, and the Worker checks the JPEG magic bytes before storing.
- A save is refused if any top-level section is missing, so a truncated request cannot blank the site.
- `/admin` is served `noindex, nofollow` and nothing links to it.

## Photos

Resizing happens in the browser — 1800px long edge, JPEG quality 82, EXIF rotation applied — because Workers have no image library. Cache-busting uses `?v=<rev>`, a timestamp written into the content on every save, so a replaced photo appears immediately despite the one-year cache header.

## Running it locally

    npx wrangler dev

Gives you site, dashboard and storage on localhost. Local KV is a file under `.wrangler/`, separate from production.

## Fonts

Chakra Petch from Google Fonts for titles and numbers. Cambria for body text, falling back to Palatino Linotype, Book Antiqua, then Georgia.
