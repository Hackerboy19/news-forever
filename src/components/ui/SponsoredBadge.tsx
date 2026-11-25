import React from 'react';
import { Megaphone } from 'lucide-react';

/**
 * "Sponsored" disclosure badge.
 *
 * Paid or promotional placement has to be disclosed to the reader — it is both
 * an advertising-standards obligation and a Google policy requirement, and an
 * undisclosed advertorial is the kind of thing that costs a news domain its
 * standing. The badge is therefore deliberately high-contrast rather than a
 * subtle grey chip, and it carries a text label, not just an icon.
 *
 * Which articles get it is decided by `isSponsoredArticle` in
 * `src/lib/editorial.ts` — see the note there about replacing the heuristic
 * with an explicit editor-set flag.
 */
export interface SponsoredBadgeProps {
  /** `sm` for cards, `md` for the article header. */
  size?: 'sm' | 'md';
  /** Overrides the default "Sponsored" wording (e.g. "Paid Partnership"). */
  label?: string;
  className?: string;
}

export const SponsoredBadge: React.FC<SponsoredBadgeProps> = ({
  size = 'sm',
  label = 'Sponsored',
  className = '',
}) => {
  const sizing =
    size === 'md'
      ? 'text-[11px] px-3 py-1 gap-1.5'
      : 'text-[9px] px-2 py-0.5 gap-1';
  const icon = size === 'md' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-widest rounded-sm border border-amber-300 bg-amber-100 text-amber-900 shrink-0 ${sizing} ${className}`}
      /* Announced to screen readers as a disclosure, not decoration. */
      role="note"
      aria-label={`${label} content — this article is promotional`}
      title={`${label} — promotional content`}
    >
      <Megaphone className={icon} aria-hidden="true" />
      {label}
    </span>
  );
};

export default SponsoredBadge;
