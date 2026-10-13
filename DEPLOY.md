# Deploying to newsforever.in (Plesk + Passenger)

Everything the server runs is in `nf-dist/`. Nothing else in this repo needs to
be uploaded — `src/`, `api/` and the config files are build inputs only.

## The files

Upload these four into your app's **`dist/` folder**, replacing what is there:

| Upload this                        | To this path on the server        |
| ---------------------------------- | --------------------------------- |
| `nf-dist/server.cjs`               | `<app-root>/dist/server.cjs`      |
| `nf-dist/index.html`               | `<app-root>/dist/index.html`      |
| `nf-dist/assets/index-fpN1RoRM.js` | `<app-root>/dist/assets/`         |
| `nf-dist/assets/index-CRDOQoNW.css`| `<app-root>/dist/assets/`         |

`nf-dist.zip` holds the same four files with that same layout, so unzipping it
into `dist/` does the whole job in one step.

`<app-root>` is the directory Plesk shows as the Node application root — the
one containing `dist/`, `node_modules/` and `.env`. The server resolves the
site from `process.cwd() + "/dist"`, so the files must sit under `dist/`, not
at the app root.

The asset filenames carry a content hash and change on every build. `index.html`
references the new pair, so old `assets/index-*.js` and `assets/index-*.css`
files are simply unused after this — safe to leave, tidier to delete.

## One setting in `.env`

```
LEGACY_MEDIA_ROOT=/home/<user>/public_html
```

Point it at the directory that **contains** the legacy `assets/` and `uploads/`
folders — usually `public_html`, not the app root. Without it, `express.static`
resolves those paths against the app's own working directory, finds nothing,
and every legacy image 404s even though the files are on the server.

This one is read at runtime, so it takes effect on restart with no rebuild.

## Restart — this step is not optional

Passenger keeps the old Node process alive across an upload. New files change
nothing until you restart:

```bash
touch <app-root>/tmp/restart.txt
```

or use **Restart App** in the Plesk Node.js panel.

## Confirming it worked

The boot log prints the media path it resolved:

```
[media] LEGACY_MEDIA_ROOT=/home/x/public_html -> /home/x/public_html/assets (found)
```

`(MISSING)` means the path is wrong — fix it and restart again.

Then check that the admin endpoints have closed:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://newsforever.in/api/subscribers
```

`401` is correct. `200` means the old process is still serving, so the restart
did not take.

Two more things worth checking:

```bash
# companion share-image tags now present
curl -s https://newsforever.in/<any-article-slug> | grep 'og:image:'

# public pages unaffected
curl -s -o /dev/null -w '%{http_code}\n' https://newsforever.in/api/blogs
```

## What changes for you after the restart

- The admin panel asks for a login before showing subscribers, users, the
  activity log and the image library. That is the fix working, not a fault.
- Editing **Meta Title** now updates the share-card headline even when
  **OG Title** is left blank.
- Article pages emit `og:image:width`, `height` and `type`, so Facebook and
  LinkedIn can build a preview card on first scrape.
- Site search now covers all 664 published articles instead of the newest 200.
  The palette loads a body-free index (~460 KB) the first time it is opened,
  so older stories are findable by title, slug, summary, category, keyword or
  author. The count beside **All** is the real archive total.

## Feeds and search (nothing to upload by hand)

`/news-sitemap.xml`, `/feed`, `/sitemap.xml` and `/robots.txt` are **generated
by `server.cjs` on request** — there is no file to create or upload for them.
Uploading `server.cjs` and restarting is the whole job. Check them with:

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://newsforever.in/news-sitemap.xml
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://newsforever.in/feed
```

In Search Console the sitemap is submitted by URL — Sitemaps → "Add a new
sitemap" → `news-sitemap.xml`.

Search covers the whole archive through a new endpoint, worth a glance after
the restart:

```bash
# should report 664 (every published article), not 200
curl -s https://newsforever.in/api/search-index | grep -o '"id":' | wc -l
```

## Mobile Core Web Vitals

Measured on a Pixel-5 profile with 4x CPU throttling and a Slow-4G link,
against the real 664-article dataset, before and after:

| Page      | CLS before | CLS after | What was moving                        |
| --------- | ---------- | --------- | -------------------------------------- |
| Home      | 0.068      | 0.000     | breaking-news ticker drawn, then pulled |
| Category  | 0.687      | 0.000     | unfiltered list redrawn as the category |
| Article   | 0.106      | 0.000     | hero image with no space reserved       |

LCP is not fixed by a single change; the critical path was shortened:

- the article list is 1.33 MB -> 0.33 MB (article bodies are no longer sent
  to pages that only show headlines)
- it now starts downloading while the HTML parses, not after the bundle runs
- the two tag-manager scripts load after first paint instead of competing
  with the app for a throttled CPU
- a listing renders 24 cards and adds more on scroll, instead of 411 at once
- the hero image is preloaded, eager and high priority on article pages

Re-run PageSpeed Insights for mobile after this is live; the field data in
Search Console updates over about 28 days.

## Activity Log

The log now shows real entries: legacy `ci_activity_log` codes are resolved
to their labels from `ci_activity_status` (they used to read "Activity code
7"), panel actions are recorded against the signed-in admin and the real
client IP rather than a placeholder name, logins and tag/category/settings
edits are recorded, and entries are stored in `ci_setting` so a restart no
longer wipes the history. The legacy table is never written to. Nothing from
before this build can be recovered — the trail starts at the restart.

## Hindi translation (HI button)

Articles and headlines are translated on the server when a reader switches
to HI. No API key is needed: four providers are tried in order, and whichever
answered last is tried first next time.

1. Gemini — only if `GEMINI_API_KEY` is set. Best quality, private quota.
2. `translate.googleapis.com` — keyless.
3. `clients5.google.com` — keyless, and a **separate quota** from the one
   above, which is what keeps the site going when that one answers 429.
4. MyMemory — keyless, short strings only.

**Every translation is kept on disk** in `<app-root>/.nf-cache/hi/`, outside
`dist/`, so nothing in it is reachable over the web. An article is therefore
translated once, ever: later readers — and the server after a restart or a
deploy — get it with no outbound call at all. A translation is dropped and
redone only when an editor changes the English, which a fingerprint catches.

Do not delete `.nf-cache`; it is the site's Hindi edition. The boot log
reports it:

```
[i18n] translation cache: disk at /…/.nf-cache/hi — 128 article(s), 940 headline(s)
```

`memory` instead of `disk` means the directory could not be written, and
translations will be lost on every restart — fix the permissions on the app
root if you see it.

`/api/translate?slug=…` says what happened: `{"translated":true,"provider":"chrome"}`,
or a `reason` naming each provider's error when they all refuse.

A Gemini key is still worth adding if you want better Hindi than a machine
endpoint gives — one line in `.env` and a restart:

```
GEMINI_API_KEY=<key from aistudio.google.com/apikey>
```

## One thing only you can close: `/server.cjs` is downloadable

nginx serves the app's `dist/` directory as the site root, so the server
bundle sitting inside it is reachable at `https://newsforever.in/server.cjs`.
It holds no passwords — those come from `.env` at runtime — but it is the
whole server source, and it should not be public. Two ways to close it:

- **Move the bundle out of `dist/`** (a build change here, plus one field in
  Plesk → Node.js → *Application Startup File*). Ask and I will do the build
  side.
- **Deny it in nginx**: Plesk → Domains → newsforever.in → Apache & nginx
  Settings → *Additional nginx directives*:

  ```nginx
  location ~* ^/(server\.cjs|.*\.map|.*\.zip)$ { deny all; }
  ```

## Still needed outside the code

- The current share image is 718 KB (2216×1353). WhatsApp caps thumbnails at
  roughly 300 KB and will keep refusing it whatever the tags say — replace it
  with a 1200×630 JPEG under 300 KB.
- Facebook and LinkedIn cache their first scrape. Re-scrape in the
  [Sharing Debugger](https://developers.facebook.com/tools/debug/) and Post
  Inspector once the new build is live.

## A note on keeping this

Uploading `nf-dist/` updates the running site but not the repository, so the
next deploy built from `main` will undo it. Merging PR #1 into `main` is what
makes these fixes stick.
