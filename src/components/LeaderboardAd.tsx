import React from 'react';
import { CIAdvertisement } from '../types';

interface LeaderboardAdProps {
  ads: CIAdvertisement[];
}

/** Positions that qualify for the horizontal leaderboard strip. */
const LEADERBOARD_POSITIONS = ['blog', 'top_banner', 'in_content'];

/**
 * Slim horizontal leaderboard ad strip (728x90-style) shown between the
 * header and the hero section. Binds directly to ci_advertisement rows:
 * advertisement_image / advertisement_url (backlink) / alt_tag.
 * Renders nothing when no matching active ad exists.
 */
export const LeaderboardAd: React.FC<LeaderboardAdProps> = ({ ads }) => {
  const ad = ads.find((a) => a.status === 1 && LEADERBOARD_POSITIONS.includes(a.position));
  if (!ad) return null;

  return (
    <div className="bg-white border-b border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="text-center mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-stone-400 font-semibold">
            Advertisement
          </span>
        </div>
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          title={ad.title}
          className="block mx-auto max-w-3xl border border-stone-200 hover:border-stone-300 bg-[#FAFAFA] overflow-hidden transition shadow-xs hover:shadow-editorial"
        >
          <img
            src={ad.advertisement_image}
            alt={ad.alt_tag}
            className="w-full h-auto max-h-24 object-contain mx-auto"
            loading="lazy"
            onError={(e) => {
              // Broken asset: collapse the whole strip instead of showing a broken image
              const strip = (e.target as HTMLImageElement).closest('div.bg-white') as HTMLElement | null;
              if (strip) strip.style.display = 'none';
            }}
          />
        </a>
      </div>
    </div>
  );
};

export default LeaderboardAd;
