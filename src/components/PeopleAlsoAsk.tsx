import React, { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Send, Sparkles } from 'lucide-react';
import { CIBlog } from '../types';
import { useI18n } from '../lib/i18n';

interface PeopleAlsoAskProps {
  article: CIBlog;
}

interface QA {
  q: string;
  a: string;
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Article categories that get the fee/charges transparency question. */
const OFFER_KEYWORDS = /nominat|award|register|registration|franchise|contest|audition/i;

/**
 * "Quick Answers / People Also Ask" accordion. Answers derive strictly from
 * the article's own database fields (meta_description, description, h2–h6
 * headings) — nothing is fabricated. Renders nothing when too little data.
 */
export const PeopleAlsoAsk: React.FC<PeopleAlsoAskProps> = ({ article }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  // Interactive ask-a-question (answered server-side from article context)
  const [userQAs, setUserQAs] = useState<QA[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: article.url, question: q }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setUserQAs((prev) => [...prev, { q, a: data.answer }]);
        setQuestion('');
      }
    } catch {
      /* network error — keep the question in the box */
    } finally {
      setAsking(false);
    }
  };

  const qas = useMemo<QA[]>(() => {
    const list: QA[] = [];
    const text = stripHtml(article.content);
    const summary = article.meta_description?.trim() || article.short_content || text.slice(0, 260);

    if (summary) {
      list.push({ q: t('paqAbout'), a: summary });
    }

    // Surface the article's own H2/H3 headings as quick-answer anchors
    const headings = [article.h2_tag, article.h3_tag, article.h4_tag].map((h) => (h || '').trim()).filter(Boolean);
    if (headings.length > 0) {
      list.push({
        q: t('paqHighlights'),
        a: headings.join(' • '),
      });
    }

    if (article.category_name) {
      list.push({
        q: t('paqMore', { cat: article.category_name }),
        a: t('paqMoreAnswer', { cat: article.category_name }),
      });
    }

    // Fee & charge transparency on promotional / nomination / offer stories
    const isOffer = OFFER_KEYWORDS.test(`${article.title} ${article.category_name || ''} ${article.meta_keyword || ''}`);
    if (isOffer) {
      list.push({
        q: t('paqFees'),
        a: t('paqFeesAnswer'),
      });
    }

    return list.filter((qa) => qa.a && qa.a.length > 10);
  }, [article, t]);

  if (qas.length < 2) return null;

  return (
    <section className="bg-white border border-[#E7E5E4] rounded-sm shadow-xs">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#991B1B]" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">
          {t('quickAnswers')}
        </h2>
      </div>
      <div className="divide-y divide-stone-100">
        {[...qas, ...userQAs].map((qa, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left group"
                aria-expanded={isOpen}
              >
                <span className={`text-sm font-serif font-bold leading-snug transition ${isOpen ? 'text-[#991B1B]' : 'text-stone-900 group-hover:text-[#991B1B]'}`}>
                  {qa.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#991B1B]' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{qa.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ask your own question — answered from this article's content */}
      <form onSubmit={handleAsk} className="p-4 border-t border-stone-100 bg-slate-50/60 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#991B1B] shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          placeholder={t('askPlaceholder')}
          className="flex-1 min-w-0 bg-white border border-stone-300 rounded-sm px-3 py-2 text-base sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#991B1B]"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="shrink-0 px-3.5 py-2 bg-[#991B1B] hover:bg-[#7A0C0C] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          {asking ? '…' : t('askButton')}
        </button>
      </form>
    </section>
  );
};

export default PeopleAlsoAsk;
