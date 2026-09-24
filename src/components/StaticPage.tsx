import React, { useEffect, useState } from 'react';
import { CISetting } from '../types';
import { SEOManager } from './SEOManager';
import { Mail, Facebook, Instagram, Youtube, Twitter, ArrowLeft } from 'lucide-react';

interface StaticPageProps {
  page: string;
  setting?: CISetting | null;
  siteConfig?: { siteTitle?: string };
  onGoHome: () => void;
}

/**
 * Simple editorial About Us / Contact Us pages so the legacy /about-us and
 * /contact-us URLs render real content (not the "article not found" screen).
 * Content is generic + pulls social links from the saved site settings.
 */
export const StaticPage: React.FC<StaticPageProps> = ({ page, setting, siteConfig, onGoHome }) => {
  const brand = siteConfig?.siteTitle?.split('|')[0]?.trim() || setting?.site_title || 'News Forever';
  const isAbout = page === 'about-us';

  // Admin-editable content + SEO from the DB (falls back to the built-in copy).
  const [data, setData] = useState<{ title?: string; content?: string; meta_title?: string; meta_description?: string; meta_keyword?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetch(`/api/pages/${page}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => { if (!cancelled) setData(d || {}); })
      .catch(() => { if (!cancelled) setData({}); });
    return () => { cancelled = true; };
  }, [page]);

  const customContent = (data?.content || '').trim();
  const heading = (data?.title || '').trim() || (isAbout ? 'About Us' : 'Contact Us');

  const socials = [
    { url: setting?.facebook_url, Icon: Facebook, label: 'Facebook' },
    { url: setting?.instagram_url, Icon: Instagram, label: 'Instagram' },
    { url: setting?.twitter_url, Icon: Twitter, label: 'Twitter / X' },
    { url: setting?.youtube_url, Icon: Youtube, label: 'YouTube' },
  ].filter((s) => s.url);

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4">
      <SEOManager
        defaultTitle={(data?.meta_title || data?.title || `${isAbout ? 'About Us' : 'Contact Us'} | ${brand}`)}
        meta_description={
          data?.meta_description ||
          (isAbout
            ? `About ${brand} — our editorial coverage of beauty pageants, awards, business, astrology and national news.`
            : `Contact ${brand} — reach our editorial desk for news, coverage, corrections and enquiries.`)
        }
        meta_keyword={data?.meta_keyword}
      />

      <button
        onClick={onGoHome}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#991B1B] hover:underline mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      <h1 className="text-3xl sm:text-4xl font-serif italic font-bold text-stone-900 mb-6">
        {heading}
      </h1>

      {customContent ? (
        <div
          className="nf-static-body space-y-4 text-stone-700 leading-relaxed text-[15px]"
          dangerouslySetInnerHTML={{ __html: customContent }}
        />
      ) : isAbout ? (
        <div className="space-y-4 text-stone-700 leading-relaxed text-[15px]">
          <p>
            <strong>{brand}</strong> is a digital news portal covering beauty pageants, the Forever Star India
            Awards, national achievers, business, lifestyle, products and astrology — bringing readers timely,
            accurate editorial coverage from across India and beyond.
          </p>
          <p>
            Our team reports on grand finales, city and state winners, award ceremonies, fashion showcases and
            the people making news in the glamour and achievement space. We are committed to authentic,
            well-sourced reporting and celebrating talent nationwide.
          </p>
          <p>
            For story tips, coverage requests or corrections, please reach us via the Contact page.
          </p>
        </div>
      ) : page === 'contact-us' ? (
        <div className="space-y-6 text-stone-700 leading-relaxed text-[15px]">
          <p>
            Have a story, a correction, or an enquiry? Our editorial desk would love to hear from you.
          </p>
          <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-200 rounded-lg">
            <Mail className="w-5 h-5 text-[#991B1B] shrink-0" />
            <a href="mailto:info@newsforever.in" className="text-[#991B1B] font-semibold hover:underline">
              info@newsforever.in
            </a>
          </div>
          {socials.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Follow us</p>
              <div className="flex flex-wrap gap-3">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-700 hover:border-[#991B1B] hover:text-[#991B1B] transition"
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-stone-500 text-[15px]">This page has no content yet.</p>
      )}
    </div>
  );
};

export default StaticPage;
