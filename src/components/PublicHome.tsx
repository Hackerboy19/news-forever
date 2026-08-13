import React from 'react';
import { CIBlog, CIAdvertisement, CICategory, CITag } from '../types';
import { resolveCategoryIds } from '../lib/taxonomy';

/** Editorial blocks below the hero — broad labels, legacy category groups */
const CATEGORY_BLOCKS = [
  { name: 'Fashion & Glamour', slug: 'fashion-glamour' },
  { name: 'Entertainment', slug: 'entertainment' },
];
import { TrendingUp, Eye, Clock, ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react';
import TrendingSidebar from './TrendingSidebar';
import SidebarAd from './SidebarAd';
import Skeleton from './ui/Skeleton';
import BlurImage from './ui/BlurImage';
import { useI18n } from '../lib/i18n';

export const PublicHomeSkeleton: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn">
      {/* HERO SECTION SKELETON */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Featured Banner Skeleton */}
          <div className="lg:col-span-3 bg-white border border-[#E7E5E4] overflow-hidden flex flex-col">
            <Skeleton className="h-80 sm:h-96 w-full rounded-none" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center justify-between pt-4 border-t border-[#E7E5E4]">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>

          {/* Trending Articles Column Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-3 w-32 pb-2" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white border border-[#E7E5E4] flex gap-4">
                  <Skeleton className="w-20 h-20 shrink-0 rounded-none" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT + SIDEBAR GRID SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#E7E5E4] overflow-hidden space-y-3 p-4">
                <Skeleton className="h-48 w-full rounded-none" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR SKELETON */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
};

interface PublicHomeProps {
  blogs: CIBlog[];
  ads: CIAdvertisement[];
  categories: CICategory[];
  tags?: CITag[];
  activeCategory: number | string | 'all';
  dateFilter?: 'all' | 'today' | 'week' | 'month';
  isLoading?: boolean;
  onSelectArticle: (urlSlug: string) => void;
  onCategorySelect: (cat: number | string | 'all') => void;
}

/** Parse the legacy 'YYYY-MM-DD : HH:MM:SS' varchar into a Date (date part only). */
function articleDate(createdAt: string | undefined): Date | null {
  const m = (createdAt || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  blogs,
  ads,
  categories,
  activeCategory,
  dateFilter = 'all',
  isLoading = false,
  onSelectArticle,
  onCategorySelect,
}) => {
  const { t, tt, registerTitles } = useI18n();
  if (isLoading) {
    return <PublicHomeSkeleton />;
  }

  // Filter active published blogs
  let activeBlogs = blogs.filter(b => b.status === 1);

  // Date-based filter from the top utility bar
  if (dateFilter !== 'all') {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'week') cutoff.setDate(cutoff.getDate() - 7);
    if (dateFilter === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
    activeBlogs = activeBlogs.filter(b => {
      const d = articleDate(b.created_at);
      return d !== null && d >= cutoff;
    });
  }

  // Filter by category: numeric ci_category id, or public nav slug
  // (slugs resolve to real category id sets incl. year variants & children)
  let categoryFilteredBlogs = activeBlogs;
  if (activeCategory !== 'all') {
    const catLikes = categories.map(c => ({ id: c.id, parent_id: c.parent_id, slug: c.slug }));
    const matchedIds =
      typeof activeCategory === 'number'
        ? new Set([activeCategory, ...categories.filter(c => c.parent_id === activeCategory).map(c => c.id)])
        : resolveCategoryIds(activeCategory, catLikes);
    categoryFilteredBlogs = activeBlogs.filter(
      b => matchedIds.has(b.category_id) || (b.sub_category_id != null && matchedIds.has(b.sub_category_id))
    );
  }

  // Featured Hero Article
  const heroArticle = categoryFilteredBlogs.find(b => b.is_featured) || categoryFilteredBlogs[0];
  const trendingArticles = categoryFilteredBlogs.filter(b => b.is_trending && b.id !== heroArticle?.id).slice(0, 3);
  const remainingArticles = categoryFilteredBlogs.filter(b => b.id !== heroArticle?.id && !trendingArticles.some(t => t.id === b.id));

  // Batch-translate visible titles when Hindi is active (server-side, cached)
  React.useEffect(() => {
    registerTitles(categoryFilteredBlogs.slice(0, 60).map(b => b.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilteredBlogs.length, activeCategory]);

  // In-feed native ad from ci_advertisement ('blog' = article-page zone in legacy CMS)
  const nativeAd = ads.find(a => a.status === 1 && (a.position === 'in_content' || a.position === 'blog'));

  return (
    <div className="space-y-12">
      {/* HERO SECTION: Trending News & Featured Cover Story */}
      {heroArticle && activeCategory === 'all' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#991B1B] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('featuredCover')}
            </h2>
            <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-semibold">{t('liveDigest')}</span>
          </div>

          {/* Asymmetric magazine hero: 60% featured / 40% trending stack */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main Featured Banner */}
            <div
              onClick={() => onSelectArticle(heroArticle.url)}
              className="lg:col-span-3 group cursor-pointer bg-white border border-[#E7E5E4] overflow-hidden shadow-xs hover:border-[#991B1B]/50 transition flex flex-col"
            >
              <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-stone-100">
                {/* Asset Mapping: src={heroArticle.image}, alt={heroArticle.alt_tag} */}
                <BlurImage
                  src={heroArticle.image}
                  alt={heroArticle.alt_tag}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  fallbackSrc="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between gap-3">
                {/* Badges live in normal flow (no absolute overlay) so they never collide with text */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-row flex-wrap gap-2 items-center mt-2">
                    <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-[#991B1B] text-white rounded-sm shadow-xs">
                      {heroArticle.category_name || 'Featured'}
                    </span>
                    <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-stone-100 text-stone-700 border border-stone-200 rounded-sm">
                      {t('leadEditorial')}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-serif italic font-extrabold text-stone-900 group-hover:text-[#991B1B] transition leading-[1.15] border-l-4 border-[#991B1B] pl-4">
                    {tt(heroArticle.title)}
                  </h1>
                  <p className="text-sm font-serif text-stone-700 line-clamp-2 leading-relaxed">
                    {heroArticle.short_content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-4 border-t border-[#E7E5E4]">
                  <span className="text-stone-700 font-bold uppercase tracking-wider">By {heroArticle.author_name}</span>
                  <div className="flex items-center gap-4">
                    {heroArticle.views > 0 && (
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-[#991B1B]" /> {heroArticle.views.toLocaleString()}</span>
                    )}
                    <span>{heroArticle.created_at.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Articles Column */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 border-b border-[#E7E5E4] pb-2">
                {t('mostRead')}
              </h3>

              <div className="space-y-4">
                {trendingArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onSelectArticle(article.url)}
                    className="group cursor-pointer p-3 bg-white border border-[#E7E5E4] hover:border-[#991B1B]/40 flex gap-4 transition shadow-xs"
                  >
                    <BlurImage
                      src={article.image}
                      alt={article.alt_tag}
                      className="w-24 h-24 object-cover bg-stone-100 shrink-0 border border-stone-200 group-hover:scale-105 transition"
                      fallbackSrc="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80"
                    />
                    <div className="space-y-1 my-auto">
                      <span className="text-[9px] font-bold text-[#991B1B] uppercase font-mono tracking-widest">
                        {article.category_name}
                      </span>
                      <h4 className="text-xs font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] line-clamp-2 leading-snug">
                        {tt(article.title)}
                      </h4>
                      <span className="text-[9px] text-stone-500 font-mono block">
                        {article.created_at ? article.created_at.split(' ')[0] : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EDITORIAL CATEGORY BLOCKS — mobile carousels, desktop 4-col grids */}
      {activeCategory === 'all' &&
        CATEGORY_BLOCKS.map((block) => {
          const catLikes = categories.map(c => ({ id: c.id, parent_id: c.parent_id, slug: c.slug }));
          const ids = resolveCategoryIds(block.slug, catLikes);
          const blockArticles = activeBlogs
            .filter(b => ids.has(b.category_id) || (b.sub_category_id != null && ids.has(b.sub_category_id)))
            .slice(0, 8);
          if (blockArticles.length === 0) return null;

          return (
            <section key={block.slug} className="space-y-5">
              <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2.5">
                <h2 className="text-lg sm:text-xl font-serif font-black text-stone-900 tracking-tight">
                  {block.name}
                </h2>
                <button
                  onClick={() => onCategorySelect(block.slug)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] hover:text-stone-900 transition flex items-center gap-1"
                >
                  {t('viewAll')} <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex overflow-x-auto snap-rail gap-5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 hide-scrollbar">
                {blockArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onSelectArticle(article.url)}
                    className="group cursor-pointer bg-white border border-[#E7E5E4] hover:border-[#991B1B]/40 overflow-hidden shadow-xs transition flex flex-col shrink-0 w-64 lg:w-auto"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                      <BlurImage
                        src={article.image}
                        alt={article.alt_tag}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        fallbackSrc="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80"
                      />
                    </div>
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] transition leading-snug line-clamp-2">
                        {tt(article.title)}
                      </h3>
                      <div className="flex items-center justify-between text-[9px] text-stone-500 font-mono pt-2 border-t border-stone-100">
                        <span className="text-[#991B1B] font-bold uppercase tracking-wider line-clamp-1">
                          {article.category_name}
                        </span>
                        <span>{article.created_at ? article.created_at.split(' ')[0] : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      {/* CATEGORICAL SECTIONS & MASONRY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Articles Masonry / Grid Feed (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#991B1B]" />
              {activeCategory === 'all' ? t('latestNews') : t('categoryFeed')}
            </h2>
            <span className="text-[10px] text-stone-500 font-mono whitespace-nowrap shrink-0 pl-3">
              {t('showingArticles', { n: categoryFilteredBlogs.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryFilteredBlogs.map((article, idx) => (
              <React.Fragment key={article.id}>
                {/* Insert Native In-Content Ad after 2nd article */}
                {idx === 2 && nativeAd && (
                  <div className="md:col-span-2 p-4 bg-white border border-[#E7E5E4] text-center space-y-2 shadow-xs">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block font-semibold">
                      {t('sponsored').toUpperCase()}
                    </span>
                    <a
                      href={nativeAd.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block hover:opacity-95 transition"
                    >
                      <img
                        src={nativeAd.advertisement_image}
                        alt={nativeAd.alt_tag}
                        className="max-h-48 mx-auto object-contain border border-stone-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </a>
                  </div>
                )}

                <div
                  onClick={() => onSelectArticle(article.url)}
                  className="group cursor-pointer bg-white border border-[#E7E5E4] hover:border-[#991B1B]/40 overflow-hidden shadow-xs transition flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <BlurImage
                      src={article.image}
                      alt={article.alt_tag}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      fallbackSrc="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row flex-wrap gap-2 items-center">
                        <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-[#991B1B] border border-stone-200 rounded-sm">
                          {article.category_name}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] transition leading-snug line-clamp-2">
                        {tt(article.title)}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {article.short_content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-3 border-t border-[#E7E5E4]">
                      <span>{article.created_at.split(' ')[0]}</span>
                      <span className="text-[#991B1B] font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition">
                        {t('readStory')} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Sidebar (1 Column) */}
        <div className="space-y-8">
          {/* Trending Now Component */}
          <TrendingSidebar blogs={blogs} onSelectArticle={onSelectArticle} />

          {/* Sponsored Sidebar Panels — ci_advertisement left/right zones */}
          <SidebarAd ads={ads} max={2} />

          {/* Quick Categories Navigation */}
          <div className="bg-white border border-[#E7E5E4] p-5 space-y-3 shadow-xs">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border-b border-[#E7E5E4] pb-2">
              {t('exploreTopics')}
            </h3>
            <div className="space-y-1">
              {categories.filter(c => !c.parent_id && (c.article_count ?? 0) > 0).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategorySelect(c.id)}
                  className="w-full flex items-center justify-between p-2 text-xs font-medium text-stone-700 hover:text-[#991B1B] hover:bg-stone-100/60 transition"
                >
                  <span>{c.category_name}</span>
                  <span className="px-2 py-0.5 bg-[#FAF8F5] border border-stone-200 font-mono text-[10px] text-stone-600 font-semibold">
                    {c.article_count || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
