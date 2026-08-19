import { CIAdvertisement } from '../types';

/**
 * Demo advertising campaigns — FICTIONAL brands only, generated as inline
 * SVG creatives so stakeholders can see how third-party banners look in
 * every slot. Negative ids keep them clearly separate from real
 * ci_advertisement rows; the admin panel shows them with a DEMO badge and
 * they can never be written to the database.
 */

function svgBanner(w: number, h: number, from: string, to: string, brand: string, tagline: string, cta: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w - h * 0.35}" cy="${h * 0.5}" r="${h * 0.42}" fill="rgba(255,255,255,0.12)"/>
  <circle cx="${w - h * 0.6}" cy="${h * 0.3}" r="${h * 0.2}" fill="rgba(255,255,255,0.10)"/>
  <text x="${h * 0.28}" y="${h * 0.44}" font-family="Arial, sans-serif" font-size="${h * 0.3}" font-weight="800" fill="#ffffff">${brand}</text>
  <text x="${h * 0.28}" y="${h * 0.72}" font-family="Arial, sans-serif" font-size="${h * 0.15}" fill="rgba(255,255,255,0.85)">${tagline}</text>
  <rect x="${w - h * 1.9}" y="${h * 0.6}" rx="${h * 0.14}" width="${h * 1.5}" height="${h * 0.28}" fill="#ffffff"/>
  <text x="${w - h * 1.15}" y="${h * 0.79}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${h * 0.14}" font-weight="700" fill="${to}">${cta}</text>
</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const mk = (id: number, title: string, image: string, position: string): CIAdvertisement => ({
  id,
  title: `${title} (Demo)`,
  advertisement_image: image,
  alt_tag: `${title} demo banner`,
  url: '#demo-campaign',
  position,
  priority: 5,
  status: 1,
  click_count: 0,
  impressions: 0,
  created_at: '',
});

export const DEMO_ADS: CIAdvertisement[] = [
  mk(-1, 'TechNova 5G Smartphones', svgBanner(728, 90, '#0F4C81', '#2E86DE', 'TechNova', 'Flagship 5G phones from ₹19,999', 'SHOP NOW'), 'blog'),
  mk(-2, 'SwiftPay UPI Cashback', svgBanner(728, 90, '#134E4A', '#10B981', 'SwiftPay', 'Flat 5% cashback on every UPI payment', 'GET APP'), 'blog'),
  mk(-3, 'AeroFly Monsoon Sale', svgBanner(600, 400, '#3B0764', '#8B5CF6', 'AeroFly', 'Flights from ₹1,499 · Monsoon Sale', 'BOOK NOW'), 'right'),
  mk(-4, 'GlowKart Beauty Fest', svgBanner(600, 400, '#831843', '#EC4899', 'GlowKart', 'Up to 60% off top beauty brands', 'EXPLORE'), 'left'),
];

export const isDemoAd = (ad: CIAdvertisement) => ad.id < 0;
