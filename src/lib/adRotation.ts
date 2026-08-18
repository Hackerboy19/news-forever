/**
 * Ad rotation: shuffle the campaign pool once per page load so every visit
 * surfaces different creatives from ci_advertisement instead of always the
 * first row. Pure client-side presentation — no data changes.
 */
import { CIAdvertisement } from '../types';

export function shuffleAds<T extends CIAdvertisement>(ads: T[]): T[] {
  const arr = [...ads];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
