import React from 'react';
import Header from '../src/components/Header';
import { initialBlogs, initialCategories, initialAdvertisements, initialSetting } from '../src/data/mockData';
import { Sparkles, Calendar, TrendingUp, Award, ArrowRight, Eye, Tag } from 'lucide-react';

export default function NextHomepage() {
  const heroArticle = initialBlogs[0]; // Headline 1: Nidhi Netra
  const secondaryArticles = initialBlogs.slice(1, 4); // Headline 2 & Headline 3
  const beautyArticles = initialBlogs.filter((b) => b.category_id === 1);
  const awardArticles = initialBlogs.filter((b) => b.category_id === 2);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans antialiased">
      {/* Redesigned Glassmorphism Header */}
      <Header tagline="International Organic News 24x7" />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Ticker Section */}
        <div className="bg-white border border-[#E7E5E4] p-3 flex items-center gap-3 shadow-2xs rounded-lg">
          <span className="px-2.5 py-1 bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider font-mono rounded shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Trending News
          </span>
          <div className="overflow-hidden text-xs text-stone-700 font-medium truncate">
            <span className="text-[#2563EB] font-bold">LATEST: </span>
            {heroArticle?.title}
          </div>
        </div>

        {/* Hero Section (Figma Layout Structure) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Hero Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
            <a href={`/${heroArticle?.url}`} className="block group">
              <div className="relative aspect-16/9 overflow-hidden bg-stone-100">
                <img
                  src={heroArticle?.image}
                  alt={heroArticle?.alt_tag || heroArticle?.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#2563EB] text-white font-bold text-[10px] uppercase tracking-wider rounded shadow-md">
                    {heroArticle?.category_name}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> {heroArticle?.created_at}
                  </span>
                  <span>•</span>
                  <span>By {heroArticle?.author_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {heroArticle?.views} views
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 group-hover:text-[#2563EB] transition-colors leading-tight">
                  {heroArticle?.title}
                </h1>
                <p className="text-stone-600 text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {heroArticle?.short_content}
                </p>
                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-[#2563EB] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  Read Full Editorial <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>
          </div>

          {/* Secondary Headlines Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="bg-white border border-[#E7E5E4] p-5 rounded-xl shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#2563EB] font-mono border-b border-[#E7E5E4] pb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Top Headlines
              </h2>
              <div className="divide-y divide-[#E7E5E4] space-y-4">
                {secondaryArticles.map((article) => (
                  <a
                    key={article.id}
                    href={`/${article.url}`}
                    className="block pt-4 first:pt-0 group"
                  >
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider font-mono">
                      {article.category_name}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-stone-800 group-hover:text-[#2563EB] transition line-clamp-2 mt-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                      {article.short_content}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* Sidebar Ad Widget */}
            <div className="bg-[#FAF8F5] border border-[#E7E5E4] p-4 rounded-xl text-center space-y-2">
              <span className="text-[9px] font-mono uppercase text-stone-400">Advertisement Spotlight</span>
              <img
                src={initialAdvertisements[0]?.advertisement_image}
                alt={initialAdvertisements[0]?.alt_tag}
                className="w-full h-auto rounded border border-[#E7E5E4]"
              />
            </div>
          </div>
        </section>

        {/* Pageants & Awards Categories Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D97706]" /> Forever Star India Pageants & Honors
            </h2>
            <a href="/category/beauty-pageant" className="text-xs font-bold text-[#2563EB] hover:underline uppercase tracking-wider">
              View All Categories &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {beautyArticles.slice(0, 3).map((article) => (
              <a
                key={article.id}
                href={`/${article.url}`}
                className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition group flex flex-col"
              >
                <div className="aspect-16/10 overflow-hidden bg-stone-100 relative">
                  <img
                    src={article.image}
                    alt={article.alt_tag || article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase rounded">
                    {article.category_name}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-[#2563EB] transition line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {article.short_content}
                  </p>
                  <div className="pt-2 text-[10px] font-mono text-stone-400 border-t border-stone-100 flex items-center justify-between">
                    <span>{article.created_at}</span>
                    <span className="text-[#2563EB] font-bold">Read &rarr;</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] py-12 text-center text-xs text-stone-500 font-mono space-y-3">
        <p className="font-bold text-stone-800 font-serif text-lg">News Forever</p>
        <p>Official Media Portal for Forever Star India Awards & Pageantry 2026</p>
        <p>© {new Date().getFullYear()} News Forever. All rights reserved.</p>
      </footer>
    </div>
  );
}
