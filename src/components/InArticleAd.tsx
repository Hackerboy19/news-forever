import React from 'react';
import { CIAdvertisement } from '../types';

interface InArticleAdProps {
  ad?: CIAdvertisement;
}

/**
 * Native ad unit injected between article paragraphs. Muted "Advertisement"
 * label, soft slate background separating it from editorial content.
 * Renders nothing when no ad is available.
 */
export const InArticleAd: React.FC<InArticleAdProps> = ({ ad }) => {
  if (!ad) return null;

  return (
    <aside className="my-8 bg-slate-50 border border-slate-200/80 rounded-sm">
      <div className="text-center pt-3 pb-2">
        <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-slate-400 font-semibold">
          Advertisement
        </span>
      </div>
      <a
        href={ad.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        title={ad.title}
        className="block px-4 pb-4 hover:opacity-95 transition"
      >
        <img
          src={ad.advertisement_image}
          alt={ad.alt_tag}
          className="max-h-48 w-auto mx-auto object-contain border border-slate-200 bg-white"
          loading="lazy"
          onError={(e) => {
            const panel = (e.target as HTMLImageElement).closest('aside');
            if (panel) (panel as HTMLElement).style.display = 'none';
          }}
        />
        <p className="pt-2 text-[11px] font-semibold text-slate-500 text-center line-clamp-1">{ad.title}</p>
      </a>
    </aside>
  );
};

export default InArticleAd;
