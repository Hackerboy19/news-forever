import React from 'react';
import { CIAdvertisement } from '../types';
import { useI18n } from '../lib/i18n';
import { shuffleAds } from '../lib/adRotation';

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
  const { t } = useI18n();
  const panelAds = React.useMemo(
    () => shuffleAds(ads.filter((a) => a.status === 1 && SIDEBAR_POSITIONS.includes(a.position))).slice(0, max),
    [ads, max]
  );

  if (panelAds.length === 0) return null;

  return (
    <div className={`space-y-6 ${sticky ? 'lg:sticky lg:top-24' : ''}`}>
      {panelAds.map((ad) => (
        <a
          key={ad.id}
          data-ad-panel
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          title={ad.title}
          className="relative block rounded-md overflow-hidden border border-stone-200 hover:border-stone-300 bg-white shadow-xs transition"
        >
          <img
            src={ad.advertisement_image}
            alt={ad.alt_tag}
            className="w-full h-auto max-h-72 object-cover"
            loading="lazy"
            onError={(e) => {
              const panel = (e.target as HTMLImageElement).closest('[data-ad-panel]') as HTMLElement | null;
              if (panel) panel.style.display = 'none';
            }}
          />
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-stone-900/70 text-white text-[9px] font-bold tracking-widest rounded-sm uppercase">AD</span>
          <span className="block px-3 py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border-t border-stone-200 truncate">{ad.title}</span>
        </a>
      ))}
    </div>
  );
};

export default SidebarAd;
