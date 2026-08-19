import React from 'react';
import { CIAdvertisement } from '../types';
import { useI18n } from '../lib/i18n';
import { shuffleAds } from '../lib/adRotation';

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
  const { t } = useI18n();
  const ad = React.useMemo(
    () => shuffleAds(ads.filter((a) => a.status === 1 && LEADERBOARD_POSITIONS.includes(a.position)))[0],
    [ads]
  );
  if (!ad) return null;

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          title={ad.title}
          className="relative block mx-auto max-w-4xl rounded-md overflow-hidden border border-stone-200 hover:border-stone-300 transition shadow-xs"
        >
          <img
            src={ad.advertisement_image}
            alt={ad.alt_tag}
            className="w-full h-auto max-h-28 object-cover"
            loading="lazy"
            onError={(e) => {
              const strip = (e.target as HTMLImageElement).closest('div.border-b') as HTMLElement | null;
              if (strip) strip.style.display = 'none';
            }}
          />
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-stone-900/70 text-white text-[9px] font-bold tracking-widest rounded-sm uppercase">
            {t('advertisement').slice(0, 2) === 'वि' ? 'विज्ञापन' : 'AD'}
          </span>
        </a>
      </div>
    </div>
  );
};

export default LeaderboardAd;
