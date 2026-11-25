import test from 'node:test';
import assert from 'node:assert/strict';
import {
  imageMimeType,
  parseLegacyDate,
  rfc822,
  xmlEscape,
  selectFeedArticles,
  buildNewsSitemap,
  buildRssFeed,
  articleUrl,
  NEWS_WINDOW_HOURS,
} from '../src/lib/feeds';
import { CIBlog } from '../src/types';

const ORIGIN = 'https://newsforever.in';
/** Fixed "now" so the 48-hour window is deterministic. */
const NOW = new Date(2026, 9, 10, 12, 0, 0); // 10 Oct 2026, local, matching how rows are written

/** Legacy created_at string for an offset in hours before NOW. */
function hoursAgo(h: number): string {
  const d = new Date(NOW.getTime() - h * 3600_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} : ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function blog(over: Partial<CIBlog> = {}): CIBlog {
  return {
    id: 1, title: 'A headline', url: 'a-headline', short_content: 'A summary.', content: '<p>x</p>',
    category_id: 1, sub_category_id: 0, category_name: 'News', tag_ids: [], image: '', alt_tag: '',
    status: 1, is_featured: false, is_trending: false, author_id: 1, author_name: 'News Forever Bureau',
    views: 0, created_at: hoursAgo(1), updated_at: hoursAgo(1), meta_title: '', meta_description: '',
    meta_keyword: '', og_title: '', og_url: '', og_description: '', og_image: '',
    ...over,
  } as CIBlog;
}

test('parseLegacyDate reads the CodeIgniter varchar format', () => {
  const d = parseLegacyDate('2026-09-23 : 17:13:39');
  assert.ok(d);
  assert.equal(d!.getFullYear(), 2026);
  assert.equal(d!.getMonth(), 8);
  assert.equal(d!.getDate(), 23);
  assert.equal(d!.getHours(), 17);
  assert.equal(d!.getMinutes(), 13);
});

test('parseLegacyDate rejects what it cannot trust', () => {
  assert.equal(parseLegacyDate(''), null);
  assert.equal(parseLegacyDate(undefined), null);
  assert.equal(parseLegacyDate('not a date'), null);
  assert.equal(parseLegacyDate('0000-00-00 : 00:00:00'), null, 'MySQL zero date');
  assert.equal(parseLegacyDate('2026-02-31 : 10:00:00'), null, 'must not roll into March');
  assert.equal(parseLegacyDate('2026-13-01 : 10:00:00'), null, 'month 13');
});

test('parseLegacyDate accepts a date with no time', () => {
  const d = parseLegacyDate('2026-09-23');
  assert.ok(d);
  assert.equal(d!.getHours(), 0);
});

test('xmlEscape handles all five entities and strips illegal control bytes', () => {
  assert.equal(xmlEscape(`Tom & Jerry's <b>"show"</b>`), 'Tom &amp; Jerry&apos;s &lt;b&gt;&quot;show&quot;&lt;/b&gt;');
  assert.equal(xmlEscape('bad\u0000byte\u001F'), 'badbyte');
  assert.equal(xmlEscape(null), '');
  assert.equal(xmlEscape(undefined), '');
  // tab/newline/CR are legal in XML 1.0 and must survive
  assert.equal(xmlEscape('a\tb\nc'), 'a\tb\nc');
});

test('rfc822 formats in GMT as RSS requires', () => {
  assert.equal(rfc822(new Date(Date.UTC(2026, 8, 23, 17, 13, 39))), 'Wed, 23 Sep 2026 17:13:39 GMT');
});

test('the 48-hour window keeps recent articles and drops older ones', () => {
  const blogs = [
    blog({ id: 1, url: 'fresh-1', created_at: hoursAgo(1) }),
    blog({ id: 2, url: 'fresh-47', created_at: hoursAgo(47) }),
    blog({ id: 3, url: 'stale-49', created_at: hoursAgo(49) }),
    blog({ id: 4, url: 'ancient', created_at: '2024-01-01 : 00:00:00' }),
  ];
  const got = selectFeedArticles(blogs, { now: NOW, withinHours: NEWS_WINDOW_HOURS }).map((a) => a.slug);
  assert.deepEqual(got, ['fresh-1', 'fresh-47']);
});

test('feed selection excludes drafts, bad slugs, duplicates, undated and future rows', () => {
  const blogs = [
    blog({ id: 1, url: 'good', created_at: hoursAgo(2) }),
    blog({ id: 2, url: 'draft', status: 0, created_at: hoursAgo(2) }),
    blog({ id: 3, url: '', created_at: hoursAgo(2) }),
    blog({ id: 4, url: '-', created_at: hoursAgo(2) }),
    blog({ id: 5, url: 'has space in it', created_at: hoursAgo(2) }),
    blog({ id: 6, url: 'GOOD', created_at: hoursAgo(3) }),
    blog({ id: 7, url: 'undated', created_at: 'rubbish' }),
    blog({ id: 8, url: 'future', created_at: hoursAgo(-48) }),
    blog({ id: 9, url: 'untitled', title: '   ', created_at: hoursAgo(2) }),
  ];
  const got = selectFeedArticles(blogs, { now: NOW }).map((a) => a.slug);
  assert.deepEqual(got, ['good'], 'only the one clean, published, dated, uniquely-slugged row');
});

test('articles come out newest first', () => {
  const blogs = [
    blog({ id: 1, url: 'older', created_at: hoursAgo(10) }),
    blog({ id: 2, url: 'newest', created_at: hoursAgo(1) }),
    blog({ id: 3, url: 'middle', created_at: hoursAgo(5) }),
  ];
  assert.deepEqual(
    selectFeedArticles(blogs, { now: NOW }).map((a) => a.slug),
    ['newest', 'middle', 'older']
  );
});

test('news sitemap carries the Google namespace, publication and real values', () => {
  const xml = buildNewsSitemap([blog({ url: 'real-story', title: 'Real Story', created_at: hoursAgo(2) })], ORIGIN, NOW);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(xml, /<news:name>News Forever<\/news:name>/);
  assert.match(xml, /<news:language>en<\/news:language>/);
  assert.match(xml, /<news:title>Real Story<\/news:title>/);
  assert.match(xml, /<loc>https:\/\/newsforever\.in\/real-story<\/loc>/);
  assert.match(xml, /<news:publication_date>\d{4}-\d{2}-\d{2}T[\d:.]+Z<\/news:publication_date>/);
});

test('an empty news window still produces a valid, empty urlset', () => {
  const xml = buildNewsSitemap([blog({ created_at: '2024-01-01 : 00:00:00' })], ORIGIN, NOW);
  assert.match(xml, /<urlset[\s\S]*<\/urlset>/);
  assert.ok(!xml.includes('<url>'), 'no entries');
  assert.ok(!xml.includes('undefined') && !xml.includes('NaN') && !xml.includes('Invalid Date'));
});

test('news sitemap escapes a hostile title without breaking the document', () => {
  const xml = buildNewsSitemap(
    [blog({ url: 'x', title: 'Tom & Jerry <script>alert("hi")</script>', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW
  );
  assert.ok(!xml.includes('<script>'), 'raw markup must not survive');
  assert.match(xml, /Tom &amp; Jerry &lt;script&gt;/);
});

test('rss feed is a well-formed channel with real items', () => {
  const xml = buildRssFeed(
    [blog({ url: 'story-one', title: 'Story One', short_content: 'The summary.', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW
  );
  assert.match(xml, /<rss version="2\.0"/);
  assert.match(xml, /<atom:link href="https:\/\/newsforever\.in\/feed" rel="self"/);
  assert.match(xml, /<title>Story One<\/title>/);
  assert.match(xml, /<link>https:\/\/newsforever\.in\/story-one<\/link>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/newsforever\.in\/story-one<\/guid>/);
  assert.match(xml, /<description>The summary\.<\/description>/);
  assert.match(xml, /<pubDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/);
});

test('rss feed with no articles is still valid', () => {
  const xml = buildRssFeed([], ORIGIN, NOW);
  assert.match(xml, /<channel>[\s\S]*<\/channel>/);
  assert.ok(!xml.includes('<item>'));
  assert.ok(!xml.includes('Invalid Date'));
});

test('rss feed omits description when there is no summary, rather than emitting an empty one', () => {
  const xml = buildRssFeed([blog({ short_content: '', meta_description: '', created_at: hoursAgo(1) })], ORIGIN, NOW);
  assert.ok(!xml.includes('<description></description>'));
});

test('rss feed is unlike the news sitemap in that it is not time-limited', () => {
  const xml = buildRssFeed([blog({ url: 'old-but-listed', created_at: '2025-01-01 : 09:00:00' })], ORIGIN, NOW);
  assert.match(xml, /old-but-listed/);
});

test('articleUrl percent-encodes without mangling an ordinary slug', () => {
  assert.equal(articleUrl(ORIGIN, 'plain-slug'), 'https://newsforever.in/plain-slug');
  assert.equal(articleUrl(ORIGIN + '/', 'plain-slug'), 'https://newsforever.in/plain-slug');
  assert.equal(articleUrl(ORIGIN, '-leading-hyphen-'), 'https://newsforever.in/-leading-hyphen-');
  assert.equal(articleUrl(ORIGIN, 'Miss--Mrs-2023'), 'https://newsforever.in/Miss--Mrs-2023');
});

test('rss items carry the article image for readers that show one', () => {
  const xml = buildRssFeed(
    [blog({ url: 'with-pic', image: 'https://newsforever.in/assets/img/blog/1.jpg', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW
  );
  assert.match(xml, /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/);
  assert.match(
    xml,
    /<media:content url="https:\/\/newsforever\.in\/assets\/img\/blog\/1\.jpg" medium="image" type="image\/jpeg" \/>/
  );
  assert.ok(!xml.includes('<enclosure'), 'no enclosure without a measured byte length');
});

test('an enclosure appears only when the file size is known', () => {
  const xml = buildRssFeed(
    [blog({ url: 'with-pic', image: 'https://newsforever.in/assets/img/blog/1.png', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW,
    { imageBytes: () => 54321 }
  );
  assert.match(xml, /<enclosure url="[^"]+1\.png" type="image\/png" length="54321" \/>/);
});

test('an image of unknown type is left out rather than mislabelled', () => {
  const xml = buildRssFeed(
    [blog({ url: 'odd', image: 'https://newsforever.in/assets/img/blog/1.bmp', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW,
    { imageBytes: () => 100 }
  );
  assert.ok(!xml.includes('media:content'));
  assert.ok(!xml.includes('<enclosure'));
});

test('a relative image path is not advertised as a feed image', () => {
  const xml = buildRssFeed(
    [blog({ url: 'rel', image: 'assets/img/blog/1.jpg', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW,
    { imageBytes: () => 100 }
  );
  assert.ok(!xml.includes('media:content'), 'feed readers cannot resolve a relative path');
});

test('the channel image is the real logo, and absent when there is none', () => {
  const withLogo = buildRssFeed([blog({ created_at: hoursAgo(1) })], ORIGIN, NOW, {
    logo: 'https://newsforever.in/uploads/logo.png',
  });
  assert.match(withLogo, /<image>[\s\S]*<url>https:\/\/newsforever\.in\/uploads\/logo\.png<\/url>[\s\S]*<\/image>/);
  const without = buildRssFeed([blog({ created_at: hoursAgo(1) })], ORIGIN, NOW);
  assert.ok(!without.includes('<image>'));
});

test('a hostile image URL cannot break out of the attribute', () => {
  const xml = buildRssFeed(
    [blog({ url: 'x', image: 'https://newsforever.in/a".jpg?q="><script>alert(1)</script>', created_at: hoursAgo(1) })],
    ORIGIN,
    NOW,
    { imageBytes: () => 10 }
  );
  assert.ok(!xml.includes('<script>'), 'markup must not survive');
  const attr = (xml.match(/<media:content url="([^"]*)"/) || [])[1] || '';
  assert.ok(attr.length > 0, 'the image is still advertised');
  assert.ok(!attr.includes('"') && !attr.includes('<'), `raw character left in attribute: ${attr}`);
  assert.match(attr, /&quot;/, 'the quote is escaped, not dropped');
});

test('imageMimeType reads the extension and admits when it cannot tell', () => {
  assert.equal(imageMimeType('/a/b.JPG'), 'image/jpeg');
  assert.equal(imageMimeType('https://x/y.webp?v=2'), 'image/webp');
  assert.equal(imageMimeType('https://x/y.avif#a'), 'image/avif');
  assert.equal(imageMimeType('https://x/y'), null);
  assert.equal(imageMimeType('https://x/y.tiff'), null);
});
