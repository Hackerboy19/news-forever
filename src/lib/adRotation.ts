/**
 * Ad rotation.
 *
 * The ad form calls `priority` the "Show order (1 shows first, higher =
 * later)", and the server already sorts by it — but this used to shuffle the
 * whole pool, so the number an editor set had no effect at all and every
 * reload showed a different creative. Order is now honoured: the lowest
 * priority number wins a slot, and ads sharing a priority rotate between
 * themselves so a tie still gets a fair share of impressions.
 *
 * Pure client-side presentation — no data changes.
 */
import { CIAdvertisement } from '../types';

/** Fisher-Yates, on a copy. */
function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * The campaign pool in the order it should be shown: by priority ascending,
 * rotating only within each priority group.
 *
 * A row with no priority sorts last rather than first — an unset number is
 * not a claim to the top slot.
 */
export function shuffleAds<T extends CIAdvertisement>(ads: T[]): T[] {
  const groups = new Map<number, T[]>();
  for (const ad of ads) {
    const p = Number(ad.priority);
    const key = Number.isFinite(p) && p > 0 ? p : Number.MAX_SAFE_INTEGER;
    const group = groups.get(key);
    if (group) group.push(ad);
    else groups.set(key, [ad]);
  }
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .flatMap((key) => shuffled(groups.get(key)!));
}
