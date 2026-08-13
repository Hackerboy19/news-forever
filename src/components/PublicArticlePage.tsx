import React, { useState } from 'react';
import { CIBlog, CIAdvertisement } from '../types';
import SEOManager from './SEOManager';
import SidebarAd from './SidebarAd';
import InArticleAd from './InArticleAd';
import PeopleAlsoAsk from './PeopleAlsoAsk';
import Skeleton from './ui/Skeleton';
import { splitHtmlAtParagraphs } from '../lib/injectAds';
import { useI18n } from '../lib/i18n';
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Share2, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Linkedin,
  MessageCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const PublicArticleSkeleton: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button & Breadcrumb skeleton */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7E5E4] bg-white text-xs font-semibold text-stone-700 hover:text-[#991B1B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
        
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Hero Image Skeleton */}
      <Skeleton className="h-96 w-full rounded-none" />

      {/* Paragraph Content Blocks Skeleton */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/10" />
      </div>

      {/* Related Articles Grid Skeleton */}
      <div className="pt-8 border-t border-[#E7E5E4] space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-3 bg-white border border-[#E7E5E4]">
              <Skeleton className="h-32 w-full rounded-none" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PublicArticlePageProps {
  urlSlug: string;
  blogs: CIBlog[];
  ads: CIAdvertisement[];
  isLoading?: boolean;
  onGoBack: () => void;
  onSelectArticle: (urlSlug: string) => void;
}

/**
 * Dynamic Article Page Component
 * Zero Data Loss & 100% SEO Preservation
 * Web Share API Social Sharing Integration & Light English Color Scheme
 */
export const PublicArticlePage: React.FC<PublicArticlePageProps> = ({
  urlSlug,
  blogs,
  ads,
  isLoading = false,
  onGoBack,
  onSelectArticle,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Find exact article matching url column in ci_blog table
  const article = blogs.find((b) => b.url === urlSlug);

  if (isLoading || (!article && blogs.length === 0)) {
    return <PublicArticleSkeleton onGoBack={onGoBack} />;
  }


  // In-content ads ('blog' = article-page zone in the legacy CMS) — injected
  // dynamically after the 3rd and 6th paragraphs of the description HTML
  const inContentAds = ads.filter((a) => a.status === 1 && (a.position === 'in_content' || a.position === 'blog'));

  // Related articles in same category
  const relatedArticles = article
    ? blogs.filter((b) => b.category_id === article.category_id && b.id !== article.id).slice(0, 3)
    : [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /**
   * Web Share API Integration
   * Invokes native share dialog on supported devices/browsers, fallback to copy link.
   */
  const handleWebShare = async () => {
    if (!article) return;
    const shareData = {
      title: article.title,
      text: article.short_content,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (!article) {
    return (
      <div className="py-20 text-center space-y-4 max-w-lg mx-auto bg-white p-8 border border-[#E7E5E4] shadow-xs">
        <SEOManager defaultTitle="Article Not Found | News Forever" />
        <h2 className="text-2xl font-serif italic font-bold text-stone-900">404 - Article Not Found</h2>
        <p className="text-sm text-stone-600">
          No legacy news record exists matching <code className="text-[#991B1B] font-mono">/article/{urlSlug}</code>.
        </p>
        <button
          onClick={onGoBack}
          className="px-5 py-2.5 bg-[#991B1B] text-white font-bold text-xs uppercase tracking-widest shadow-xs hover:bg-[#7F1D1D] transition"
        >
          Return to Portal Home
        </button>
      </div>
    );
  }

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article.title);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* PROGRAMMATIC SEO & OPENGRAPH HEAD INJECTION */}
      <SEOManager article={article} siteName="News Forever" />

      {/* Breadcrumbs & Native Web Share Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600 border-b border-[#E7E5E4] pb-4">
        <div className="flex items-center gap-2 font-mono min-w-0">
          <button onClick={onGoBack} className="hover:text-[#991B1B] transition flex items-center gap-1 font-semibold shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>
          <span className="shrink-0">/</span>
          <span className="text-stone-800 font-semibold whitespace-nowrap shrink-0">{article.category_name || 'News'}</span>
          <span className="shrink-0">/</span>
          <span className="text-stone-500 truncate min-w-0">{article.title}</span>
        </div>

        {/* Quick Share Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleWebShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-widest transition shadow-xs"
            title="Share via Native Web Share API"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareSuccess ? '✓' : t('webShare')}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E5E4] hover:border-stone-400 text-stone-700 hover:text-stone-900 text-xs font-mono transition"
            title="Copy URL to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '✓' : t('copyUrl')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Article Content (3 Columns) */}
        <article className="lg:col-span-3 space-y-8 bg-white border border-[#E7E5E4] p-6 sm:p-10 shadow-xs">
          {/* Title & Metadata Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#991B1B] text-white font-bold text-[10px] uppercase tracking-widest shadow-xs">
                {article.category_name}
              </span>
              {article.views > 0 && (
                <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
                  <Eye className="w-3.5 h-3.5 text-[#991B1B]" /> {article.views.toLocaleString()} Reads
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-5xl font-serif italic font-extrabold text-stone-900 leading-[1.2] sm:leading-[1.15] tracking-tight border-l-4 border-[#991B1B] pl-3 sm:pl-5">
              {article.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-stone-600 font-mono py-3 border-y border-[#E7E5E4]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#991B1B] flex items-center justify-center font-bold text-white text-xs">
                  {article.author_name ? article.author_name[0] : 'E'}
                </div>
                <span className="text-stone-800 font-bold uppercase tracking-wider">{article.author_name || 'Elena Rostova'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>{t('published')} {article.created_at}</span>
              </div>
            </div>
          </div>

          {/* ASSET MAPPING: Main Featured Image (src={article.image}, alt={article.alt_tag}) */}
          <div className="space-y-2">
            <div className="relative overflow-hidden bg-stone-100 border border-[#E7E5E4] max-h-[480px]">
              <img
                src={article.image}
                alt={article.alt_tag}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* Article Lead Abstract */}
          <div className="p-5 bg-[#FAF8F5] border-l-4 border-[#991B1B] italic text-stone-800 text-base sm:text-lg font-serif leading-relaxed">
            "{article.short_content}"
          </div>

          {/* Web Share API & Social Share Interactive Bar */}
          <div className="p-5 bg-[#FAF8F5] border border-[#E7E5E4] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E5E4] pb-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#991B1B]" />
                  {t('shareEditorial')}
                </h3>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Distribute this article directly via Web Share API or platform social feeds.
                </p>
              </div>

              {/* Native Web Share Button */}
              <button
                onClick={handleWebShare}
                className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareSuccess ? 'Article Shared!' : 'Web Share API'}
              </button>
            </div>

            {/* Social Platform Direct Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-[#E7E5E4] hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                <span>X / Twitter</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-[#E7E5E4] hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                <span>Facebook</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-[#E7E5E4] hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-[#E7E5E4] hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white border border-[#E7E5E4] hover:bg-stone-50 text-stone-800 text-xs font-mono flex items-center gap-1.5 transition ml-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* HTML Article Body — ads injected after the 3rd and 6th paragraphs */}
          {splitHtmlAtParagraphs(article.content, [3, 6]).map((segment, i) => (
            <React.Fragment key={i}>
              {i > 0 && <InArticleAd ad={inContentAds[i - 1]} />}
              <div
                className="prose max-w-none text-stone-800 font-serif leading-relaxed text-base sm:text-lg space-y-4"
                dangerouslySetInnerHTML={{ __html: segment }}
              />
            </React.Fragment>
          ))}

          {/* Quick Answers / People Also Ask — derived from the article's own fields */}
          <div className="mt-10">
            <PeopleAlsoAsk article={article} />
          </div>
        </article>

        {/* Sponsored Sidebar Panels & Related Articles */}
        <div className="space-y-8">
          <SidebarAd ads={ads} max={2} sticky />

          {/* Related Stories */}
          {relatedArticles.length > 0 && (
            <div className="bg-white border border-[#E7E5E4] p-5 space-y-4 shadow-xs">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border-b border-[#E7E5E4] pb-2">
                {t('relatedStories')} {article.category_name}
              </h3>
              <div className="space-y-3">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel.url)}
                    className="cursor-pointer group flex items-center gap-3 p-2 hover:bg-stone-100/60 transition"
                  >
                    <img
                      src={rel.image}
                      alt={rel.alt_tag}
                      className="w-14 h-14 object-cover bg-stone-100 shrink-0 border border-stone-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] truncate">
                        {rel.title}
                      </h4>
                      <p className="text-[10px] font-mono text-stone-500">
                        {rel.created_at.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED BOTTOM RELATED ARTICLES SECTION */}
      {article && (
        <section className="pt-8 border-t border-[#E7E5E4] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E5E4] pb-3">
            <div>
              <h2 className="text-xl font-serif italic font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#991B1B]" />
                Related Articles in {article.category_name || 'Category'}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Explore recommended editorial coverage and top stories from the {article.category_name} desk.
              </p>
            </div>
            <button
              onClick={onGoBack}
              className="text-xs font-bold uppercase tracking-widest text-[#991B1B] hover:text-[#7F1D1D] flex items-center gap-1 self-start sm:self-auto font-mono"
            >
              All Portal Stories <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(relatedArticles.length > 0 ? relatedArticles : blogs.filter((b) => b.id !== article.id).slice(0, 3)).map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onSelectArticle(rel.url);
                }}
                className="group cursor-pointer bg-white border border-[#E7E5E4] hover:border-[#991B1B]/40 overflow-hidden shadow-xs transition flex flex-col justify-between"
              >
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <img
                    src={rel.image}
                    alt={rel.alt_tag}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur text-[#991B1B] text-[9px] font-bold uppercase tracking-widest border border-stone-200 shadow-xs">
                    {rel.category_name || 'Related'}
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base font-serif italic font-bold text-stone-900 group-hover:text-[#991B1B] transition leading-snug line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {rel.short_content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-3 border-t border-[#E7E5E4]">
                    <span>{rel.created_at.split(' ')[0]}</span>
                    <span className="text-[#991B1B] font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition">
                      Read Story <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PublicArticlePage;
