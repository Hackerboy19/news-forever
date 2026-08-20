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
const PUBLIC_ASSET_BASE = 'https://newsforever.in/';

export function resolveAssetUrl(path?: string | null): string {
  const p = (path || '').trim();
  if (!p) return '';
  if (/^(https?:)?\/\//i.test(p) || /^data:/i.test(p)) return p; // already absolute / data URI
  return PUBLIC_ASSET_BASE + p.replace(/^\/+/, '');
}
