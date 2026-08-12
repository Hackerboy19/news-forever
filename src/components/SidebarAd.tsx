import React from 'react';
import { CIAdvertisement } from '../types';

interface SidebarAdProps {
  ads: CIAdvertisement[];
  /** How many stacked panels to render (default 2). */
  max?: number;
  sticky?: boolean;
}

/** Positions that qualify for square sidebar panels. */
const SIDEBAR_POSITIONS = ['left', 'right', 'sidebar_sticky'];

/**
 * Square promotional panels for right-hand sidebars, bound to
 * ci_advertisement (advertisement_image / advertisement_url / alt_tag).
 * Ordered by the table's priority column; renders nothing when empty.
 */
export const SidebarAd: React.FC<SidebarAdProps> = ({ ads, max = 2, sticky = false }) => {
  const panelAds = ads
    .filter((a) => a.status === 1 && SIDEBAR_POSITIONS.includes(a.position))
    .slice(0, max);

  if (panelAds.length === 0) return null;

  return (
    <div className={`space-y-6 ${sticky ? 'sticky top-24' : ''}`}>
      {panelAds.map((ad) => (
        <div key={ad.id} className="bg-white border border-[#E7E5E4] shadow-xs">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-stone-100">
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-stone-400 font-semibold">
              Sponsored
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
          </div>
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={ad.title}
            className="block p-3 hover:opacity-95 transition"
          >
            <div className="aspect-square w-full bg-slate-50 border border-stone-100 overflow-hidden flex items-center justify-center">
              <img
                src={ad.advertisement_image}
                alt={ad.alt_tag}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  const panel = (e.target as HTMLImageElement).closest('div.bg-white') as HTMLElement | null;
                  if (panel) panel.style.display = 'none';
                }}
              />
            </div>
            <p className="pt-2.5 text-[11px] font-semibold text-stone-700 text-center leading-snug line-clamp-1">
              {ad.title}
            </p>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SidebarAd;
