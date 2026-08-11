import React from 'react';
import { CIBlog, CIAdvertisement, CICategory } from '../types';
import { resolveCategoryIds } from '../lib/taxonomy';
import { TrendingUp, Eye, Clock, ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react';
import TrendingSidebar from './TrendingSidebar';
import Skeleton from './ui/Skeleton';

export const PublicHomeSkeleton: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn">
      {/* HERO SECTION SKELETON */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured Banner Skeleton */}
          <div className="lg:col-span-2 bg-white border border-[#E7E5E4] overflow-hidden flex flex-col">
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
          <div className="space-y-4">
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
  activeCategory: number | string | 'all';
  isLoading?: boolean;
  onSelectArticle: (urlSlug: string) => void;
  onCategorySelect: (cat: number | string | 'all') => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  blogs,
  ads,
  categories,
  activeCategory,
  isLoading = false,
  onSelectArticle,
  onCategorySelect,
}) => {
  if (isLoading) {
    return <PublicHomeSkeleton />;
  }

  // Filter active published blogs
  const activeBlogs = blogs.filter(b => b.status === 1);

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

  // Find Sticky Sidebar Ad from ci_advertisement
  const sidebarAd = ads.find(a => a.position === 'sidebar_sticky' && a.status === 1);
  const nativeAd = ads.find(a => a.position === 'in_content' && a.status === 1);

  return (
    <div className="space-y-12">
      {/* HERO SECTION: Trending News & Featured Cover Story */}
      {heroArticle && activeCategory === 'all' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#991B1B] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Featured Cover Story
            </h2>
            <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-semibold">Live News Digest</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Featured Banner */}
            <div 
              onClick={() => onSelectArticle(heroArticle.url)}
              className="lg:col-span-2 group cursor-pointer bg-white border border-[#E7E5E4] overflow-hidden shadow-xs hover:border-[#991B1B]/50 transition flex flex-col"
            >
              <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-stone-100">
                {/* Asset Mapping: src={heroArticle.image}, alt={heroArticle.alt_tag} */}
                <img
                  src={heroArticle.image}
                  alt={heroArticle.alt_tag}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-[#991B1B] text-white font-bold text-[10px] uppercase tracking-widest shadow-md">
                    {heroArticle.category_name || 'Featured'}
                  </span>
                  <span className="px-3 py-1 bg-white/90 backdrop-blur text-stone-900 font-bold text-[10px] uppercase tracking-widest border border-stone-200">
                    Lead Editorial
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-4xl font-serif italic font-extrabold text-stone-900 group-hover:text-[#991B1B] transition leading-tight">
                    {heroArticle.title}
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
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 border-b border-[#E7E5E4] pb-2">
                Most Read Headlines
              </h3>

              <div className="space-y-4">
                {trendingArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onSelectArticle(article.url)}
                    className="group cursor-pointer p-3 bg-white border border-[#E7E5E4] hover:border-[#991B1B]/40 flex gap-4 transition shadow-xs"
                  >
                    <img
                      src={article.image}
                      alt={article.alt_tag}
                      className="w-20 h-20 object-cover bg-stone-100 shrink-0 border border-stone-200 group-hover:scale-105 transition"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="space-y-1 my-auto">
                      <span className="text-[9px] font-bold text-[#991B1B] uppercase font-mono tracking-widest">
                        {article.category_name}
                      </span>
                      <h4 className="text-xs font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] line-clamp-2 leading-snug">
                        {article.title}
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

      {/* CATEGORICAL SECTIONS & MASONRY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Articles Masonry / Grid Feed (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#991B1B]" />
              {activeCategory === 'all' ? 'Latest News & Pageant Highlights' : 'Category Feed'}
            </h2>
            <span className="text-[10px] text-stone-500 font-mono">
              Showing {categoryFilteredBlogs.length} articles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryFilteredBlogs.map((article, idx) => (
              <React.Fragment key={article.id}>
                {/* Insert Native In-Content Ad after 2nd article */}
                {idx === 2 && nativeAd && (
                  <div className="md:col-span-2 p-4 bg-white border border-[#E7E5E4] text-center space-y-2 shadow-xs">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block font-semibold">
                      SPONSORED ANNOUNCEMENT
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
                    <img
                      src={article.image}
                      alt={article.alt_tag}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur text-[#991B1B] text-[9px] font-bold uppercase tracking-widest border border-stone-200 shadow-xs">
                      {article.category_name}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] transition leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {article.short_content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-3 border-t border-[#E7E5E4]">
                      <span>{article.created_at.split(' ')[0]}</span>
                      <span className="text-[#991B1B] font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition">
                        Read Story <ChevronRight className="w-3.5 h-3.5" />
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

          {/* Sticky Sidebar Ad Zone */}
          {sidebarAd && (
            <div className="sticky top-20 bg-white border border-[#E7E5E4] p-4 text-center space-y-3 shadow-xs">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block font-semibold">
                ADVERTISEMENT | 300x600 STICKY ZONE
              </span>
              <a
                href={sidebarAd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-95 transition"
              >
                <img
                  src={sidebarAd.advertisement_image}
                  alt={sidebarAd.alt_tag}
                  className="w-full object-contain mx-auto border border-stone-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </a>
            </div>
          )}

          {/* Quick Categories Navigation */}
          <div className="bg-white border border-[#E7E5E4] p-5 space-y-3 shadow-xs">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border-b border-[#E7E5E4] pb-2">
              Explore Topics
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
