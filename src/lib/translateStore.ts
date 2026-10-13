/**
 * Translations that outlive the process.
 *
 * Translation used to be cached in a Map, so every restart threw the whole
 * site's Hindi away and it had to be fetched again from a provider that
 * rate-limits this server's IP. Keeping it on disk means an article is
 * translated once, ever: the first reader pays for it and everyone after
 * that — including after a restart or a deploy — gets it instantly, with no
 * outbound call and nothing to rate-limit.
 *
 * The cache lives OUTSIDE dist/, which nginx serves as the site root, so
 * nothing here is reachable over the web. If the directory cannot be
 * written (read-only hosting), everything still works — just in memory, as
 * before.
 */
import fs from 'fs';
import path from 'path';

export interface StoredArticle {
  translated: boolean;
  title?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  provider?: string;
  reason?: string;
  /** When this was written, so a stale entry can be spotted by a human. */
  at?: string;
  /** Fingerprint of the English source this was translated from. */
  fp?: string;
}

/**
 * A cheap fingerprint of the English article.
 *
 * Cached Hindi belongs to the words it was made from. When an editor
 * rewrites a story the cache has to notice, or the site would keep serving
 * the translation of a paragraph that no longer exists.
 */
export function fingerprint(...parts: (string | undefined)[]): string {
  const text = parts.map((p) => p || '').join('\u0000');
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13);
  }
  return `${text.length.toString(36)}-${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

const DIR = process.env.TRANSLATION_CACHE_DIR || path.join(process.cwd(), '.nf-cache', 'hi');
const TITLES_FILE = path.join(DIR, '_titles.json');
/** Enough for every headline on the site several times over. */
const MAX_TITLES = 5000;

let mode: 'disk' | 'memory' | 'unknown' = 'unknown';
const memArticles = new Map<string, StoredArticle>();
let titles: Record<string, string> | null = null;
let titlesDirty = false;
let titlesTimer: NodeJS.Timeout | null = null;

function ensureDir(): boolean {
  if (mode === 'disk') return true;
  if (mode === 'memory') return false;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    // Prove it is writable rather than assuming it from mkdir.
    const probe = path.join(DIR, '.probe');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    mode = 'disk';
  } catch {
    mode = 'memory';
  }
  return mode === 'disk';
}

/** 'disk' once a writable cache directory has been confirmed. */
export function storeMode(): 'disk' | 'memory' | 'unknown' {
  ensureDir();
  return mode;
}

/** A slug is a URL path segment; keep it to one safe file name regardless. */
function fileFor(slug: string): string {
  const safe = slug
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // No run of dots: a name like ".." carries meaning in a path, and this
    // is a file name, not a path.
    .replace(/\.{2,}/g, '_')
    .replace(/^[._-]+/, '')
    .slice(0, 120) || 'untitled';
  return path.join(DIR, `${safe}.json`);
}

export function loadArticle(slug: string, fp?: string): StoredArticle | null {
  const fresh = (d: StoredArticle | undefined | null) =>
    d && d.translated && (!fp || !d.fp || d.fp === fp) ? d : null;

  const mem = fresh(memArticles.get(slug));
  if (mem) return mem;
  if (!ensureDir()) return null;
  try {
    const data = JSON.parse(fs.readFileSync(fileFor(slug), 'utf8')) as StoredArticle;
    const ok = fresh(data);
    if (ok) {
      memArticles.set(slug, ok);
      return ok;
    }
    // The English changed since this was written — drop it and retranslate.
    if (data?.translated) memArticles.delete(slug);
  } catch {
    /* not cached yet */
  }
  return null;
}

export function saveArticle(slug: string, data: StoredArticle): void {
  if (!data?.translated) return; // never cache a failure
  const withTime = { ...data, at: new Date().toISOString() };
  memArticles.set(slug, withTime);
  if (!ensureDir()) return;
  try {
    fs.writeFileSync(fileFor(slug), JSON.stringify(withTime), 'utf8');
  } catch {
    /* a full or read-only disk must not break the page */
  }
}

export function loadTitles(): Record<string, string> {
  if (titles) return titles;
  titles = {};
  if (ensureDir()) {
    try {
      const parsed = JSON.parse(fs.readFileSync(TITLES_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') titles = parsed;
    } catch {
      /* first run */
    }
  }
  return titles;
}

/**
 * Remember a batch of headlines. Written a second later rather than on every
 * call, since a page of cards arrives as one burst.
 */
export function saveTitles(pairs: Record<string, string>): void {
  const all = loadTitles();
  let changed = false;
  for (const [en, hi] of Object.entries(pairs)) {
    if (en && hi && all[en] !== hi) {
      all[en] = hi;
      changed = true;
    }
  }
  if (!changed) return;
  const keys = Object.keys(all);
  if (keys.length > MAX_TITLES) {
    // Oldest insertions first — JS objects keep insertion order for strings.
    for (const k of keys.slice(0, keys.length - MAX_TITLES)) delete all[k];
  }
  titlesDirty = true;
  if (titlesTimer || !ensureDir()) return;
  titlesTimer = setTimeout(() => {
    titlesTimer = null;
    flushTitles();
  }, 500);
  // Do not hold the process open for a cache write.
  if (typeof titlesTimer.unref === 'function') titlesTimer.unref();
}

/**
 * Write pending headlines out now.
 *
 * The batched write is 500ms behind, and a restart inside that window used
 * to lose the translations — which on a rate-limited provider means they
 * may not be obtainable again for hours. Called on shutdown as well.
 */
export function flushTitles(): void {
  if (!titlesDirty || !titles) return;
  if (!ensureDir()) return;
  titlesDirty = false;
  try {
    fs.writeFileSync(TITLES_FILE, JSON.stringify(titles), 'utf8');
  } catch {
    /* never fatal */
  }
}

let exitHooked = false;
function hookExit(): void {
  if (exitHooked) return;
  exitHooked = true;
  const bye = () => flushTitles();
  process.on('beforeExit', bye);
  process.on('exit', bye);
  // Passenger stops an app with SIGTERM; Ctrl-C in a shell sends SIGINT.
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, () => {
      flushTitles();
      process.exit(0);
    });
  }
}
hookExit();

/** How much is cached, for the boot log and diagnosis. */
export function storeStats(): { mode: string; dir: string; articles: number; titles: number } {
  let onDisk = 0;
  if (ensureDir()) {
    try {
      onDisk = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== '_titles.json').length;
    } catch {
      onDisk = 0;
    }
  }
  return {
    mode: storeMode(),
    dir: DIR,
    articles: Math.max(onDisk, memArticles.size),
    titles: Object.keys(loadTitles()).length,
  };
}
