import React from 'react';

interface LogoProps {
  className?: string;
}

const RED = '#B01117';

/**
 * Official News Forever seal — circular red emblem with the boxed NF
 * serif monogram over the NEWS / FOREVER bars, recreated as crisp
 * inline SVG from the brand artwork.
 */
export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="News Forever logo">
    {/* White ground + double ring seal */}
    <circle cx="100" cy="100" r="98" fill="#FFFFFF" />
    <circle cx="100" cy="100" r="94" fill="none" stroke={RED} strokeWidth="6" />
    <circle cx="100" cy="100" r="86" fill="none" stroke={RED} strokeWidth="1.6" />

    {/* Boxed NF monogram */}
    <rect x="63" y="38" width="74" height="66" fill="#FFFFFF" stroke={RED} strokeWidth="2.4" />
    <text
      x="82"
      y="94"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="58"
      fontWeight="700"
      fill={RED}
      textAnchor="middle"
    >
      N
    </text>
    <text
      x="112"
      y="90"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="52"
      fontWeight="700"
      fill={RED}
      textAnchor="middle"
    >
      F
    </text>

    {/* NEWS bar */}
    <rect x="40" y="108" width="120" height="34" fill={RED} />
    <text
      x="100"
      y="133"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="10"
      fill="#FFFFFF"
      textAnchor="middle"
    >
      NEWS
    </text>

    {/* FOREVER bar */}
    <rect x="40" y="146" width="120" height="20" fill={RED} />
    <text
      x="100"
      y="161"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="13"
      fontWeight="600"
      letterSpacing="6"
      fill="#FFFFFF"
      textAnchor="middle"
    >
      FOREVER
    </text>
  </svg>
);

export default Logo;
