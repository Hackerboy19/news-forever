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
}

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
      return await geminiTranslate(text, key);
    } catch {
      /* fall through to gtx */
    }
  }
  return gtxTranslate(text);
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

  // Translate in small parallel batches to stay polite to the endpoint
  const BATCH = 12;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const slice = jobs.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map((j) => translateText(j.text).catch(() => j.text))
    );
    results.forEach((r, k) => {
      tokens[slice[k].index] = r;
    });
  }
  return tokens.join('');
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

  try {
    const [title, description, meta_title, meta_description, meta_keyword] = await Promise.all([
      translateText(article.title),
      translateHtml(article.content || ''),
      translateText(article.meta_title || article.title),
      translateText(article.meta_description || ''),
      translateText(article.meta_keyword || ''),
    ]);
    const out: TranslatedArticle = { translated: true, title, description, meta_title, meta_description, meta_keyword };
    cache.set(cacheKey, out);
    return out;
  } catch (err) {
    console.warn('translateArticle failed:', (err as Error)?.message);
    return { translated: false };
  }
}
