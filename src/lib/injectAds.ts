/**
 * Splits an article's rich-text HTML (ci_blog.description) into segments at
 * paragraph boundaries so ad components can be injected between them without
 * breaking markup. Splitting only happens at top-level </p> closes.
 */
export function splitHtmlAtParagraphs(html: string, breakAfter: number[]): string[] {
  if (!html) return [''];

  const parts = html.split(/<\/p>/i);
  // Last element is trailing content after the final </p>
  const paragraphs = parts.slice(0, -1).map((p) => p + '</p>');
  const trailing = parts[parts.length - 1];

  if (paragraphs.length === 0) return [html];

  const sortedBreaks = [...breakAfter].sort((a, b) => a - b).filter((n) => n > 0 && n < paragraphs.length);
  const segments: string[] = [];
  let start = 0;
  for (const brk of sortedBreaks) {
    segments.push(paragraphs.slice(start, brk).join(''));
    start = brk;
  }
  segments.push(paragraphs.slice(start).join('') + trailing);

  return segments.filter((s, i) => s.trim() !== '' || i === 0);
}
