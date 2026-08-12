/**
 * Presentation helpers for the Figma re-theme. Pure styling/derivation —
 * never mutates or rewrites database content.
 */

/** Rotating chip palette matching the Figma design (tan/blue/green/purple/rose). */
const CHIP_PALETTES = [
  'bg-amber-100 text-amber-900',
  'bg-blue-100 text-blue-900',
  'bg-emerald-100 text-emerald-900',
  'bg-purple-100 text-purple-900',
  'bg-rose-100 text-rose-900',
  'bg-cyan-100 text-cyan-900',
];

/** Deterministic chip color for a category (stable across renders). */
export function chipClass(key: string | number | undefined): string {
  const s = String(key ?? '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return CHIP_PALETTES[Math.abs(hash) % CHIP_PALETTES.length];
}

/** Approximate reading time from the raw description HTML (200 wpm). */
export function readMinutes(html: string | undefined): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Real FSIA registration CTAs for the sidebar "Register Now" stack. */
export const REGISTER_LINKS = [
  { label: 'Miss India 2026 — Register', href: 'https://www.fsia.in/forever-miss-india-new.php', color: 'bg-[#B91C1C] hover:bg-[#991B1B]' },
  { label: 'Mrs India 2026 — Register', href: 'https://www.fsia.in/forever-mrs-india-new.php', color: 'bg-purple-700 hover:bg-purple-800' },
  { label: 'Miss Teen India 2026 — Register', href: 'https://www.fsia.in/forever-miss-teen-india-new.php', color: 'bg-blue-700 hover:bg-blue-800' },
  { label: 'Super Woman Award 2026 — Register', href: 'https://www.fsia.in/super-woman-award.php', color: 'bg-emerald-700 hover:bg-emerald-800' },
];
