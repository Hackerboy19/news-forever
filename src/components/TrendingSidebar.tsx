import React from 'react';
import { CIBlog } from '../types';
import { TrendingUp, Eye, Flame, ChevronRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface TrendingSidebarProps {
  blogs: CIBlog[];
  onSelectArticle: (urlSlug: string) => void;
  title?: string;
}

/**
 * TrendingNow Sidebar Component
 * Shows the 5 most recent published articles (ci_blog has no view counter).
 */
export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({
  blogs,
  onSelectArticle,
  title,
}) => {
  const { t, tt, registerTitles } = useI18n();
  const heading = title || t('trendingNow');
  const topTrendingArticles = blogs.filter((b) => b.status === 1).slice(0, 5);

  React.useEffect(() => {
    registerTitles(topTrendingArticles.map(b => b.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTrendingArticles.map(b => b.id).join(',')]);

  if (topTrendingArticles.length === 0) return null;

  return (
    <div className="bg-white border border-[#E7E5E4] p-5 space-y-4 shadow-xs">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#7A0C0C]" />
          {heading}
        </h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#7A0C0C]" /> {t('topViewed')}
        </span>
      </div>

      {/* Top 5 Article List */}
      <div className="divide-y divide-stone-100">
        {topTrendingArticles.map((article, index) => {
          const rank = index + 1;
          return (
            <div
              key={article.id}
              onClick={() => {
                onSelectArticle(article.url);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group cursor-pointer py-3.5 first:pt-1 last:pb-1 transition flex items-start gap-3.5"
            >
              {/* Rank Badge */}
              <div
                className={`w-7 h-7 shrink-0 font-serif font-black text-sm flex items-center justify-center border ${
                  rank === 1
                    ? 'bg-[#7A0C0C] text-white border-[#7A0C0C] shadow-xs'
                    : rank === 2
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                0{rank}
              </div>

              {/* Content Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#7A0C0C] font-bold uppercase tracking-wider">
                    {article.category_name || 'News'}
                  </span>
                  {article.views > 0 && (
                    <span className="text-stone-500 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-stone-400" />
                      {article.views.toLocaleString()} views
                    </span>
                  )}
                </div>

                <h4 className="font-serif italic font-bold text-stone-900 group-hover:text-[#7A0C0C] text-xs sm:text-sm leading-snug line-clamp-2 transition">
                  {tt(article.title)}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-0.5">
                  <span>{article.created_at ? article.created_at.split(' ')[0] : '2026'}</span>
                  <span className="text-stone-500 group-hover:text-[#7A0C0C] flex items-center gap-0.5 font-bold transition">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingSidebar;
