/**
 * Article Q&A: answers a reader's free-text question from the article's own
 * content. Uses Gemini when GEMINI_API_KEY is configured; otherwise falls
 * back to extractive answering (best-matching sentences from the article) —
 * deterministic, zero external dependencies, and never fabricates facts.
 */

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(
  'the a an is are was were be been to of in on at for with and or but who what when where why how does do did this that these those it its from by as'.split(' ')
);

function keywords(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\sऀ-ॿ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Extractive answer: pick the 2 sentences that best match the question. */
export function extractiveAnswer(question: string, articleText: string): string | null {
  const sentences = articleText.split(/(?<=[.!?।])\s+/).filter((s) => s.length > 25);
  const qWords = keywords(question);
  if (qWords.length === 0 || sentences.length === 0) return null;

  const scored = sentences
    .map((s, i) => {
      const lower = s.toLowerCase();
      const score = qWords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
      return { s, i, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i);

  if (scored.length === 0) return null;
  const top = scored.slice(0, 2).sort((a, b) => a.i - b.i);
  return top.map((x) => x.s.trim()).join(' ');
}

async function geminiAnswer(question: string, articleText: string, apiKey: string): Promise<string> {
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
                text: `You answer reader questions about a news article. Answer in 1-3 sentences using ONLY facts from the article below. If the article does not contain the answer, say so plainly. Match the language of the question (English or Hindi).\n\nARTICLE:\n${articleText.slice(0, 6000)}\n\nQUESTION: ${question}`,
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

export async function answerQuestion(
  question: string,
  articleHtml: string,
  fallbackSummary?: string
): Promise<{ answer: string; source: 'ai' | 'extractive' | 'summary' }> {
  const text = stripHtml(articleHtml);
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      return { answer: await geminiAnswer(question, text, key), source: 'ai' };
    } catch {
      /* fall through */
    }
  }
  const extracted = extractiveAnswer(question, text);
  if (extracted) return { answer: extracted, source: 'extractive' };
  if (fallbackSummary) return { answer: fallbackSummary, source: 'summary' };
  return {
    answer: 'The article does not directly address this — see the full story above or contact the editorial desk.',
    source: 'summary',
  };
}
