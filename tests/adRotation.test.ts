import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleAds } from '../src/lib/adRotation';
import { CIAdvertisement } from '../src/types';

function ad(id: number, priority: number | undefined, position = 'right'): CIAdvertisement {
  return {
    id,
    title: `Ad ${id}`,
    advertisement_image: `https://newsforever.in/uploads/${id}.png`,
    alt_tag: `Ad ${id}`,
    url: 'https://example.com',
    position,
    priority: priority as number,
    status: 1,
    click_count: 0,
    impressions: 0,
    created_at: '',
  } as CIAdvertisement;
}

test('the lowest priority number is always first', () => {
  const pool = [ad(1, 3), ad(2, 1), ad(3, 2)];
  for (let i = 0; i < 50; i++) {
    assert.equal(shuffleAds(pool)[0].id, 2, 'priority 1 must win the slot every time');
  }
});

test('priority groups stay in order', () => {
  const pool = [ad(1, 2), ad(2, 1), ad(3, 2), ad(4, 1), ad(5, 3)];
  for (let i = 0; i < 50; i++) {
    const got = shuffleAds(pool).map((a) => Number(a.priority));
    assert.deepEqual(got, [1, 1, 2, 2, 3], `out of order: ${got.join(',')}`);
  }
});

test('ads sharing a priority rotate between themselves', () => {
  const pool = [ad(1, 1), ad(2, 1), ad(3, 1)];
  const firsts = new Set<number>();
  for (let i = 0; i < 200; i++) firsts.add(shuffleAds(pool)[0].id);
  assert.equal(firsts.size, 3, `all three should take the first slot sometimes, saw ${[...firsts]}`);
});

test('a single ad in a slot is shown every time, not sometimes', () => {
  const only = [ad(7, 2)];
  for (let i = 0; i < 20; i++) assert.equal(shuffleAds(only)[0].id, 7);
});

test('an ad with no priority sorts last rather than jumping the queue', () => {
  const pool = [ad(1, undefined), ad(2, 2)];
  assert.deepEqual(shuffleAds(pool).map((a) => a.id), [2, 1]);
  assert.deepEqual(shuffleAds([ad(1, 0), ad(2, 1)]).map((a) => a.id), [2, 1], 'zero is unset, not top');
});

test('nothing is lost or duplicated, and the input is left alone', () => {
  const pool = [ad(1, 2), ad(2, 1), ad(3, 2), ad(4, 4)];
  const before = pool.map((a) => a.id);
  const out = shuffleAds(pool);
  assert.equal(out.length, pool.length);
  assert.deepEqual([...out.map((a) => a.id)].sort(), [1, 2, 3, 4]);
  assert.deepEqual(pool.map((a) => a.id), before, 'the caller\'s array must not be reordered');
});

test('an empty pool is handled', () => {
  assert.deepEqual(shuffleAds([]), []);
});
