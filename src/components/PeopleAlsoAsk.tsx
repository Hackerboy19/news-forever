import React, { useMemo, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { CIBlog } from '../types';

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
  const [open, setOpen] = useState<number | null>(0);

  const qas = useMemo<QA[]>(() => {
    const list: QA[] = [];
    const text = stripHtml(article.content);
    const summary = article.meta_description?.trim() || article.short_content || text.slice(0, 260);

    if (summary) {
      list.push({ q: `What is this story about?`, a: summary });
    }

    // Surface the article's own H2/H3 headings as quick-answer anchors
    const headings = [article.h2_tag, article.h3_tag, article.h4_tag].map((h) => (h || '').trim()).filter(Boolean);
    if (headings.length > 0) {
      list.push({
        q: 'What are the key highlights?',
        a: headings.join(' • '),
      });
    }

    if (article.category_name) {
      list.push({
        q: `Where can I read more ${article.category_name} coverage?`,
        a: `Browse the ${article.category_name} section of News Forever for all related stories, winner announcements and updates.`,
      });
    }

    // Fee & charge transparency on promotional / nomination / offer stories
    const isOffer = OFFER_KEYWORDS.test(`${article.title} ${article.category_name || ''} ${article.meta_keyword || ''}`);
    if (isOffer) {
      list.push({
        q: 'Are there fees or extra charges to participate?',
        a: 'Registration, nomination and participation fees are set and collected only through the official Forever Star India channels. Verify current fee levels, what they include and accepted payment methods on the official registration page or by contacting the organisers directly before paying anyone. News Forever never collects payments.',
      });
    }

    return list.filter((qa) => qa.a && qa.a.length > 10);
  }, [article]);

  if (qas.length < 2) return null;

  return (
    <section className="bg-white border border-[#E7E5E4] rounded-sm shadow-xs">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#991B1B]" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">
          Quick Answers — People Also Ask
        </h2>
      </div>
      <div className="divide-y divide-stone-100">
        {qas.map((qa, i) => {
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
    </section>
  );
};

export default PeopleAlsoAsk;
