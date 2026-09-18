import React from 'react';
import { CIBlog } from '../types';
import { Zap } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface NewsTickerProps {
  blogs: CIBlog[];
  onSelectArticle: (urlSlug: string) => void;
  /** Custom headlines set in admin. When non-empty, shown instead of latest articles (non-clickable). */
  customItems?: string[];
}

/**
 * Breaking-news ticker tape below the header — cycles the 5 most recent
 * ci_blog titles in an infinite marquee (pauses on hover).
 */
export const NewsTicker: React.FC<NewsTickerProps> = ({ blogs, onSelectArticle, customItems }) => {
  const { t, tt, registerTitles } = useI18n();
  const custom = (customItems || []).filter((s) => s.trim() !== '');
  const useCustom = custom.length > 0;
  const latest = blogs.filter((b) => b.status === 1).slice(0, 5);
  // Rendered rows: custom lines (no link) OR latest articles (clickable).
  const items = useCustom
    ? custom.map((text, i) => ({ id: `c${i}`, url: '', title: text }))
    : latest.map((b) => ({ id: String(b.id), url: b.url, title: b.title }));

  React.useEffect(() => {
    if (!useCustom) registerTitles(latest.map(b => b.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest.map(b => b.id).join(','), useCustom]);

  // Early return AFTER hooks so hook order stays stable across renders.
  if (items.length === 0) return null;

  // Duplicate the list so the -50% translate loops seamlessly
  const loop = [...items, ...items];

  return (
    <div className="bg-stone-950 text-white border-b border-stone-800 overflow-hidden">
      <div className="max-w-none flex items-stretch">
        <div className="shrink-0 flex items-center gap-1.5 bg-[#991B1B] px-4 py-2 z-10">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{t('breaking')}</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex items-center whitespace-nowrap py-2 w-max">
            {loop.map((article, i) => (
              <button
                key={`${article.id}-${i}`}
                onClick={() => {
                  if (!article.url) return; // custom text row — not a link
                  onSelectArticle(article.url);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-2 px-6 text-xs font-medium text-stone-200 transition-colors ${article.url ? 'hover:text-amber-300' : 'cursor-default'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] shrink-0" />
                {tt(article.title)}
              </button>
            ))}
          </div>
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-stone-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-stone-950 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
