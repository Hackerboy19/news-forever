# Deploying to newsforever.in (Plesk + Passenger)

Everything the server runs is in `nf-dist/`. Nothing else in this repo needs to
be uploaded — `src/`, `api/` and the config files are build inputs only.

## The files

Upload these four into your app's **`dist/` folder**, replacing what is there:

| Upload this                        | To this path on the server        |
| ---------------------------------- | --------------------------------- |
| `nf-dist/server.cjs`               | `<app-root>/dist/server.cjs`      |
| `nf-dist/index.html`               | `<app-root>/dist/index.html`      |
| `nf-dist/assets/index-C-z665vl.js` | `<app-root>/dist/assets/`         |
| `nf-dist/assets/index-CfNQAuuR.css`| `<app-root>/dist/assets/`         |

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
