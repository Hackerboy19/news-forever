import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * The store reads its directory from the environment at import time, so each
 * case gets its own temp directory and its own fresh copy of the module.
 */
async function freshStore(dir: string) {
  process.env.TRANSLATION_CACHE_DIR = dir;
  // A unique query string defeats the module cache.
  return (await import(`../src/lib/translateStore.ts?v=${Math.random()}`)) as typeof import('../src/lib/translateStore');
}

function tmpDir(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `nf-${name}-`));
}

test('an article survives a restart', async () => {
  const dir = tmpDir('restart');
  const first = await freshStore(dir);
  first.saveArticle('my-article', { translated: true, title: 'शीर्षक', description: '<p>पाठ</p>' });

  // A new process, same directory.
  const second = await freshStore(dir);
  const got = second.loadArticle('my-article');
  assert.equal(got?.title, 'शीर्षक');
  assert.equal(got?.description, '<p>पाठ</p>');
  assert.ok(got?.at, 'the write is timestamped');
});

test('a failed translation is never cached', async () => {
  const dir = tmpDir('failed');
  const s = await freshStore(dir);
  s.saveArticle('nope', { translated: false, reason: 'gtx 429' });
  assert.equal(s.loadArticle('nope'), null);
  assert.equal(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length, 0);
});

test('a rewritten article is not served from the old translation', async () => {
  const dir = tmpDir('fp');
  const s = await freshStore(dir);
  const v1 = s.fingerprint('Headline', '<p>First version</p>');
  s.saveArticle('story', { translated: true, title: 'पहला', fp: v1 });
  assert.equal(s.loadArticle('story', v1)?.title, 'पहला', 'unchanged article still cached');

  const v2 = s.fingerprint('Headline', '<p>Second version, rewritten</p>');
  assert.equal(s.loadArticle('story', v2), null, 'changed English must miss the cache');
  assert.notEqual(v1, v2);
});

test('fingerprints are stable and differ on a small change', async () => {
  const s = await freshStore(tmpDir('fp2'));
  assert.equal(s.fingerprint('a', 'b'), s.fingerprint('a', 'b'));
  assert.notEqual(s.fingerprint('a', 'b'), s.fingerprint('a', 'B'));
  assert.notEqual(s.fingerprint('a', 'b'), s.fingerprint('ab', ''), 'field boundaries matter');
  assert.equal(s.fingerprint(undefined, ''), s.fingerprint('', undefined));
});

test('headlines are written, capped and reloaded', async () => {
  const dir = tmpDir('titles');
  const first = await freshStore(dir);
  first.saveTitles({ 'One headline': 'एक', 'Two headline': 'दो' });
  first.flushTitles();

  const second = await freshStore(dir);
  const back = second.loadTitles();
  assert.equal(back['One headline'], 'एक');
  assert.equal(back['Two headline'], 'दो');
});

test('a slug with path characters cannot escape the cache directory', async () => {
  const dir = tmpDir('escape');
  const s = await freshStore(dir);
  s.saveArticle('../../etc/passwd', { translated: true, title: 'x' });
  const files = fs.readdirSync(dir);
  assert.equal(files.length, 1, `one file inside the directory, got ${JSON.stringify(files)}`);
  assert.ok(!files[0].includes('/') && !files[0].includes('..'), files[0]);
  assert.equal(s.loadArticle('../../etc/passwd')?.title, 'x', 'and it still reads back');
});

test('an uncreatable directory degrades to memory instead of throwing', async () => {
  // A path *through* a regular file can never be a directory, for any user —
  // unlike a permission bit, which root ignores.
  const base = tmpDir('ro');
  const blocker = path.join(base, 'not-a-directory');
  fs.writeFileSync(blocker, 'x');
  const s = await freshStore(path.join(blocker, 'hi'));
  assert.equal(s.storeMode(), 'memory');
  s.saveArticle('still-works', { translated: true, title: 'मेमोरी' });
  assert.equal(s.loadArticle('still-works')?.title, 'मेमोरी', 'in-process cache keeps working');
  s.saveTitles({ Hello: 'नमस्ते' });
  s.flushTitles();
  assert.equal(s.loadTitles()['Hello'], 'नमस्ते', 'headlines still work for this process');
});

test('stats describe what is cached', async () => {
  const dir = tmpDir('stats');
  const s = await freshStore(dir);
  s.saveArticle('a', { translated: true, title: 'क' });
  s.saveArticle('b', { translated: true, title: 'ख' });
  s.saveTitles({ Hi: 'नमस्ते' });
  s.flushTitles();
  const stats = s.storeStats();
  assert.equal(stats.mode, 'disk');
  assert.equal(stats.articles, 2);
  assert.equal(stats.titles, 1);
  assert.equal(stats.dir, dir);
});
