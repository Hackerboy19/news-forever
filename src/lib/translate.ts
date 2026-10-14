/**
 * Server-side Hindi translation layer for ci_blog content.
 *
 * Provider chain, tried in order until one answers:
 *   1. Gemini, when GEMINI_API_KEY is set — best quality, no shared quota
 *   2. translate.googleapis.com (gtx), keyless
 *   3. clients5.google.com (dict-chrome-ex), keyless and a separate quota
 *      from gtx, so a rate-limited IP usually still gets through here
 *   4. MyMemory, keyless, for short strings
 *
 * No key is required: 2-4 are free endpoints, and the chain exists because
 * any one of them will rate-limit a single server's IP. Whichever answered
 * last is tried first next time, so a dead provider is not re-tried for
 * every string.
 *
 * Results are stored on disk (see translateStore), so an article is
 * translated once and stays translated across restarts and deploys.
 * H2–H6 / paragraph structure of the description HTML is preserved by
 * translating text nodes only. Database rows are never modified.
 */

import { loadArticle, saveArticle, loadTitles, saveTitles, storeStats, fingerprint } from './translateStore';

export { storeStats as translationStoreStats };

interface TranslatedArticle {
  translated: boolean;
  title?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  /** Why nothing (or only part) came back, for diagnosis from outside. */
  reason?: string;
  /** Which provider answered: 'gemini', 'gtx', 'chrome', 'mymemory', 'cache' or 'none'. */
  provider?: string;
}

/**
 * The last provider failure, so an endpoint can say why a page is still in
 * English instead of silently serving it and leaving no trace.
 */
let lastFailure = '';
export function lastTranslationError(): string {
  return lastFailure;
}
let lastProvider = 'none';

const cache = new Map<string, TranslatedArticle>();

/**
 * The same Google service behind a different front door. It is a separate
 * quota from translate.googleapis.com, which matters when that one has
 * started answering 429 to this server.
 */
async function chromeTranslate(text: string, target = 'hi'): Promise<string> {
  const url =
    'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=' +
    target +
    '&q=' +
    encodeURIComponent(text);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`chrome ${res.status}`);
  const data: any = await res.json();
  // Either ["translated"] or [["translated","original"]] depending on length.
  const first = Array.isArray(data) ? data[0] : null;
  const out = typeof first === 'string' ? first : Array.isArray(first) ? String(first[0] ?? '') : '';
  if (!out) throw new Error('chrome empty');
  return out;
}

/**
 * MyMemory, a free translation memory. Its anonymous limit is per-day and
 * per-IP, and it rejects long queries, so it is the last resort and only
 * for short strings — headlines, meta descriptions, single paragraphs.
 */
const MYMEMORY_MAX = 480;
async function myMemoryTranslate(text: string, target = 'hi'): Promise<string> {
  if (text.length > MYMEMORY_MAX) throw new Error('mymemory too long');
  const url =
    'https://api.mymemory.translated.net/get?langpair=en%7C' +
    target +
    '&q=' +
    encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data: any = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(String(out))) {
    throw new Error(`mymemory ${data?.responseStatus || 'rejected'}`);
  }
  return String(out);
}

async function gtxTranslate(text: string, target = 'hi'): Promise<string> {
  if (!text.trim()) return text;
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
    target +
    '&dt=t&q=' +
    encodeURIComponent(text);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data: any = await res.json();
  return (data[0] || []).map((seg: any) => seg[0]).join('');
}

/**
 * Which Gemini model to ask. Google retires model names — the one this was
 * written against (gemini-2.0-flash) is no longer listed — so it is settable
 * from the environment without a rebuild, and a dead name simply fails over
 * to the keyless providers rather than taking Hindi down with it.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function geminiTranslate(text: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate the following news text to natural Hindi. Return ONLY the translation, no commentary:\n\n${text}`,
              },
            ],
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`gemini ${GEMINI_MODEL} ${res.status}`);
  const data: any = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error('gemini empty');
  return out.trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * How many translate calls to have in flight at once.
 *
 * The keyless endpoint answers 429 to a burst from one IP, which is what
 * made every card headline stay English while the article page (fewer, more
 * spread-out calls) came through. Small batches with a pause between them
 * get a page of headlines translated instead of none.
 */
const BATCH = 4;
const BATCH_PAUSE_MS = 150;

/** One retry on a rate-limited or failed call, then give up on that string. */
async function translateOnce(text: string): Promise<string> {
  try {
    return await translateText(text);
  } catch (err: any) {
    if (!/429|rate|timeout|ECONN|socket/i.test(String(err?.message || err))) throw err;
    await sleep(600);
    return translateText(text);
  }
}

/** Whichever provider last worked — tried first, so a dead one is not
 *  re-tried for every single string on the page. */
let preferred = '';

const DEVANAGARI = /[\u0900-\u097F]/;
const COUNT_DEVANAGARI = /[\u0900-\u097F]/g;
const COUNT_LATIN = /[A-Za-z]/g;

/**
 * Did this provider actually translate, or hand back the English?
 *
 * Two of the free endpoints do that. One returns the input verbatim when it
 * cannot help; MyMemory answers from a translation memory and will return a
 * half-match — a headline came back as "सौंदर्य प्रतियोगिता क्या है?
 * Complete Guide for you", Hindi for the first sentence and English for the
 * rest. Accepting that put broken text on the page and, worse, cached it.
 *
 * The test is deliberately loose: short strings, names and numbers are let
 * through, because "FSIA 2026" translates to itself and that is correct.
 */
export function looksTranslated(source: string, out: string): boolean {
  const text = (out || '').trim();
  if (!text) return false;
  if (text === source.trim()) return false; // verbatim echo
  const words = [...new Set((source.toLowerCase().match(/[a-z]{3,}/g) || []))];
  if (words.length < 4) return true; // too short to judge
  if (!DEVANAGARI.test(text)) return false; // nothing was translated at all

  // How much of the English came back untouched. A few proper nouns staying
  // in Latin is normal and expected; half the sentence is a partial match
  // dressed up as a translation.
  const lower = text.toLowerCase();
  const survived = words.filter((w) => lower.includes(w)).length;
  if (survived / words.length >= 0.4) return false;

  const dev = (text.match(COUNT_DEVANAGARI) || []).length;
  const lat = (text.match(COUNT_LATIN) || []).length;
  return dev >= lat * 0.6;
}

async function translateText(text: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const chain: { name: string; run: () => Promise<string> }[] = [];
  if (key) chain.push({ name: 'gemini', run: () => geminiTranslate(text, key) });
  chain.push({ name: 'gtx', run: () => gtxTranslate(text) });
  chain.push({ name: 'chrome', run: () => chromeTranslate(text) });
  chain.push({ name: 'mymemory', run: () => myMemoryTranslate(text) });

  const ordered = preferred
    ? [...chain.filter((c) => c.name === preferred), ...chain.filter((c) => c.name !== preferred)]
    : chain;

  const errors: string[] = [];
  for (const provider of ordered) {
    try {
      const out = await provider.run();
      if (looksTranslated(text, out)) {
        lastProvider = provider.name;
        preferred = provider.name;
        return out;
      }
      errors.push(`${provider.name}: ${out && out.trim() ? 'not translated' : 'empty'}`);
      // Do not stay on a provider that is handing back English.
      if (preferred === provider.name) preferred = '';
    } catch (err: any) {
      errors.push(`${provider.name}: ${err?.message || err}`);
    }
  }
  // Every free endpoint refused. Forget the preference so the next attempt
  // starts from the top of the chain rather than the one that just failed.
  preferred = '';
  lastFailure = errors.join('; ');
  throw new Error(lastFailure);
}

/** Translate HTML while preserving tags: only text nodes are translated. */
async function translateHtml(html: string): Promise<string> {
  const tokens = html.split(/(<[^>]+>)/g);
  const jobs: { index: number; text: string }[] = [];
  tokens.forEach((tok, index) => {
    if (!tok.startsWith('<') && tok.replace(/&nbsp;|\s/g, '').length > 1) {
      jobs.push({ index, text: tok });
    }
  });

  // Translate in small parallel batches to stay polite to the endpoint.
  // A token that fails keeps its English text, which is the right answer for
  // one stubborn sentence — but if not a single token came back translated
  // the provider is down, and returning the English body as though it were
  // Hindi is worse than admitting the failure.
  let done = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    if (i > 0) await sleep(BATCH_PAUSE_MS);
    const slice = jobs.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map((j) => translateOnce(j.text).then((t) => { done++; return t; }).catch(() => j.text))
    );
    results.forEach((r, k) => {
      tokens[slice[k].index] = r;
    });
  }
  if (jobs.length > 0 && done === 0) throw new Error(lastFailure || 'no text could be translated');
  return tokens.join('');
}

const titleCache = new Map<string, string>();
let titlesSeeded = false;
function seedTitles(): void {
  if (titlesSeeded) return;
  titlesSeeded = true;
  for (const [en, hi] of Object.entries(loadTitles())) titleCache.set(en, hi);
}

/** Batch-translate blog titles (feed/ticker/cards). Cached per title. */
export async function translateTitles(titles: string[]): Promise<Record<string, string>> {
  seedTitles();
  const out: Record<string, string> = {};
  const pending = [...new Set(titles)].filter((t) => t && t.length > 3).slice(0, 80);
  const todo = pending.filter((t) => !titleCache.has(t));

  lastFailure = '';
  for (let i = 0; i < todo.length; i += BATCH) {
    if (i > 0) await sleep(BATCH_PAUSE_MS);
    const slice = todo.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((t) => translateOnce(t).catch(() => null)));
    // A title that could not be translated is not cached as itself — that
    // would pin the English version for the life of the process, long after
    // the provider recovered.
    const fresh: Record<string, string> = {};
    results.forEach((r, k) => {
      if (r) {
        titleCache.set(slice[k], r);
        fresh[slice[k]] = r;
      }
    });
    saveTitles(fresh);
  }
  for (const t of pending) out[t] = titleCache.get(t) || t;
  return out;
}

export async function translateArticle(article: {
  url: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
}): Promise<TranslatedArticle> {
  const fp = fingerprint(article.title, article.content, article.meta_description);
  const cacheKey = `hi:${article.url}:${fp}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  // Translated on an earlier visit, possibly before the last restart.
  const stored = loadArticle(article.url, fp);
  if (stored?.translated) {
    cache.set(cacheKey, stored as TranslatedArticle);
    return { ...stored, provider: stored.provider || 'cache' } as TranslatedArticle;
  }

  // Each field is translated on its own. This used to be one Promise.all
  // with no per-field catch, so a single failed call — a rate-limited
  // keyword line, say — threw the whole article away and the reader got
  // English with the rest of the page in Hindi and no explanation.
  lastFailure = '';
  const field = async (text: string, html = false): Promise<string | null> => {
    if (!text || !text.trim()) return text || '';
    try {
      return html ? await translateHtml(text) : await translateText(text);
    } catch {
      return null;
    }
  };

  const [title, description, meta_title, meta_description, meta_keyword] = await Promise.all([
    field(article.title),
    field(article.content || '', true),
    field(article.meta_title || article.title),
    field(article.meta_description || ''),
    field(article.meta_keyword || ''),
  ]);

  // The headline and the body are what "translated" means to a reader.
  const gotAnything = title !== null || description !== null;
  if (!gotAnything) {
    console.warn('translateArticle: no field could be translated —', lastFailure || 'unknown');
    return { translated: false, reason: lastFailure || 'provider unavailable', provider: 'none' };
  }

  const out: TranslatedArticle = {
    translated: true,
    title: title ?? article.title,
    description: description ?? article.content,
    meta_title: meta_title ?? article.meta_title,
    meta_description: meta_description ?? article.meta_description,
    meta_keyword: meta_keyword ?? article.meta_keyword,
    provider: lastProvider,
    ...(lastFailure ? { reason: `partial: ${lastFailure}` } : {}),
  };
  cache.set(cacheKey, out);
  // Kept on disk so this article never needs a provider again — until an
  // editor changes the English, which the fingerprint catches.
  saveArticle(article.url, { ...out, fp });
  return out;
}
