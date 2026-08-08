import React from 'react';
import { initialBlogs, initialSetting } from '../../src/data/mockData';

interface ArticlePageProps {
  params: Promise<{ url: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { url } = await params;
  const article = initialBlogs.find((b) => b.url === url);

  if (!article) {
    return {
      title: 'Article Not Found | News Forever',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.short_content,
    keywords: article.meta_keyword,
    openGraph: {
      title: article.og_title || article.title,
      description: article.og_description || article.short_content,
      url: article.og_url || `https://newsforever.in/${article.url}`,
      siteName: 'News Forever',
      images: [
        {
          url: article.og_image || article.image,
          alt: article.alt_tag || article.title,
        },
      ],
      type: 'article',
      publishedTime: article.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.og_title || article.title,
      description: article.og_description || article.short_content,
      images: [article.og_image || article.image],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { url } = await params;
  const article = initialBlogs.find((b) => b.url === url);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-8">
        <div className="bg-white border border-[#E2E8F0] p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-serif font-bold text-[#1E293B]">404 - Article Not Found</h1>
          <p className="text-sm text-[#64748B]">No record found matching dynamic URL: /{url}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider rounded"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // JSON-LD NewsArticle Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.meta_description || article.short_content,
    image: [article.image],
    datePublished: article.created_at,
    author: {
      '@type': 'Person',
      name: article.author_name || 'News Forever Desk',
    },
    publisher: {
      '@type': 'Organization',
      name: initialSetting.site_title,
      logo: {
        '@type': 'ImageObject',
        url: initialSetting.site_logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://newsforever.in/${article.url}`,
    },
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4 border-b border-[#E2E8F0] pb-6">
          <span className="inline-block px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs uppercase tracking-wider rounded">
            {article.category_name}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1E293B] leading-tight">
            {article.title}
          </h1>
          <div className="text-xs text-[#64748B] font-mono flex items-center justify-between">
            <span>By {article.author_name}</span>
            <span>{article.created_at}</span>
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <img
            src={article.image}
            alt={article.alt_tag || article.title}
            className="w-full h-auto max-h-[500px] object-cover border border-[#E2E8F0]"
          />
        </div>

        {/* Content */}
        <div
          className="prose max-w-none text-[#334155] font-serif text-lg leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </main>
  );
}
