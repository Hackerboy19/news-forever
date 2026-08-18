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
        <div key={ad.id} data-ad-panel className="bg-slate-50 border border-slate-200/80 rounded-sm shadow-xs">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-200/60">
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-slate-400 font-semibold">
              {t('sponsored')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          </div>
          <a
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={ad.title}
            className="block p-3 hover:opacity-95 transition"
          >
            <div className="w-full bg-white border border-slate-200/60 rounded-sm overflow-hidden flex items-center justify-center">
              <img
                src={ad.advertisement_image}
                alt={ad.alt_tag}
                className="w-full h-auto max-h-80 object-contain"
                loading="lazy"
                onError={(e) => {
                  const panel = (e.target as HTMLImageElement).closest('[data-ad-panel]') as HTMLElement | null;
                  if (panel) panel.style.display = 'none';
                }}
              />
            </div>
            <p className="pt-2.5 text-[11px] font-semibold text-slate-600 text-center leading-snug line-clamp-1">
              {ad.title}
            </p>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SidebarAd;
