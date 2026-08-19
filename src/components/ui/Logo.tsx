import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * News Forever brand mark — folded-newspaper "N" monogram in the brand
 * maroon, with a breaking-news pulse dot. Inline SVG, crisp at any size.
 */
export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-label="News Forever logo">
    <defs>
      <linearGradient id="nfg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#B91C1C" />
        <stop offset="1" stopColor="#7A0C0C" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="46" height="46" rx="10" fill="url(#nfg)" />
    {/* folded paper */}
    <path d="M11 34V14a2 2 0 0 1 2-2h14l8 8v14a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2Z" fill="#FDF6EC" />
    <path d="M27 12l8 8h-6a2 2 0 0 1-2-2v-6Z" fill="#E8D9C3" />
    {/* headline + text lines */}
    <rect x="15" y="20" width="10" height="3" rx="1" fill="#991B1B" />
    <rect x="15" y="26" width="18" height="2" rx="1" fill="#B9AA92" />
    <rect x="15" y="30" width="14" height="2" rx="1" fill="#B9AA92" />
    {/* live pulse dot */}
    <circle cx="38" cy="38" r="5.5" fill="#FDF6EC" />
    <circle cx="38" cy="38" r="3" fill="#DC2626" />
  </svg>
);

export default Logo;
