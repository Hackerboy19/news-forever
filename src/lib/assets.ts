/**
 * Resolve an asset path to an absolute URL for the browser.
 *
 * Uploaded images (logo, banners, covers) come back from the API as paths
 * relative to the asset host, e.g. "assets/img/blog/123.png". The physical
 * files live on the legacy asset host (newsforever.in), NOT on the app's own
 * origin — so a bare relative path 404s when the app is served from Vercel or
 * a staging domain. This prefixes relative paths with the public asset base;
 * absolute URLs and data URIs pass through untouched.
 */
/**
 * Where the legacy `assets/img/...` files are physically served from.
 *
 * IMPORTANT: this must NOT point at the origin running this app. It used to be
 * hardcoded to https://newsforever.in/, which was correct only while that
 * domain still served the old CodeIgniter site. Now that the same domain
 * fronts this app, an image URL resolves back to this origin, misses every
 * static file, falls through the SPA rewrite and returns index.html — so
 * `/assets/img/blog/…/x.jpg` answers 200 with a full HTML page instead of the
 * image. That breaks og:image for every share and every <img> on the site.
 *
 * Point VITE_ASSET_BASE_URL at the host that actually holds the uploads (the
 * legacy cPanel origin, a CDN, or a media subdomain). The default is kept only
 * so existing builds behave as before.
 */
const ENV_BASE = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  ?.VITE_ASSET_BASE_URL;

const PUBLIC_ASSET_BASE = (ENV_BASE || 'https://newsforever.in/').replace(/\/*$/, '/');

export function resolveAssetUrl(path?: string | null): string {
  const p = (path || '').trim();
  if (!p) return '';
  if (/^(https?:)?\/\//i.test(p) || /^data:/i.test(p)) return p; // already absolute / data URI
  return PUBLIC_ASSET_BASE + p.replace(/^\/+/, '');
}
