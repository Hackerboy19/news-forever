/**
 * Server-side Hindi translation layer for ci_blog content.
 *
 * Provider chain:
 *   1. GEMINI_API_KEY set  → Gemini flash translation (best quality)
 *   2. otherwise           → Google Translate public gtx endpoint (keyless)
 * Results are cached in-memory per lambda and edge-cached by the CDN, so a
 * translated article is computed once and then served instantly.
 * H2–H6 / paragraph structure of the description HTML is preserved by
 * translating text nodes only. Database rows are never modified.
 */

interface TranslatedArticle {
  translated: boolean;
  title?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  /** Why nothing (or only part) came back, for diagnosis from outside. */
  reason?: string;
  /** Which provider answered: 'gemini', 'gtx', or 'none'. */
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

async function geminiTranslate(text: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data: any = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error('gemini empty');
  return out.trim();
}

async function translateText(text: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const out = await geminiTranslate(text, key);
      lastProvider = 'gemini';
      return out;
    } catch (err: any) {
      lastFailure = `gemini: ${err?.message || err}`;
    }
  }
  try {
    const out = await gtxTranslate(text);
    lastProvider = 'gtx';
    return out;
  } catch (err: any) {
    // Shared hosting is often rate-limited or blocked outright on this
    // endpoint, which is exactly the case that used to disappear silently.
    lastFailure = `gtx: ${err?.message || err}`;
    throw err;
  }
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
  const BATCH = 12;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const slice = jobs.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map((j) => translateText(j.text).then((t) => { done++; return t; }).catch(() => j.text))
    );
    results.forEach((r, k) => {
      tokens[slice[k].index] = r;
    });
  }
  if (jobs.length > 0 && done === 0) throw new Error(lastFailure || 'no text could be translated');
  return tokens.join('');
}

const titleCache = new Map<string, string>();

/** Batch-translate blog titles (feed/ticker/cards). Cached per title. */
export async function translateTitles(titles: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const pending = [...new Set(titles)].filter((t) => t && t.length > 3).slice(0, 80);
  const todo = pending.filter((t) => !titleCache.has(t));

  lastFailure = '';
  const BATCH = 12;
  for (let i = 0; i < todo.length; i += BATCH) {
    const slice = todo.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((t) => translateText(t).catch(() => null)));
    // A title that could not be translated is not cached as itself — that
    // would pin the English version for the life of the process, long after
    // the provider recovered.
    results.forEach((r, k) => { if (r) titleCache.set(slice[k], r); });
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
  const cacheKey = `hi:${article.url}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

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
  return out;
}
