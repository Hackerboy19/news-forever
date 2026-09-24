import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, Quote, Eraser, Code2, ImagePlus, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { resolveAssetUrl } from '../../lib/assets';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
}

// Block-level tags. Anything NOT in here is inline and gets wrapped in a <p>
// so headings / alignment apply per-paragraph (where the caret is) instead of
// swallowing the whole editor — legacy articles often arrive as one big blob.
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'DIV', 'TABLE', 'FIGURE', 'PRE', 'HR']);

function normalizeToBlocks(html: string): string {
  if (typeof document === 'undefined' || !html) return html || '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const out = document.createElement('div');
  let buffer: Node[] = [];
  const flush = () => {
    if (!buffer.length) return;
    const hasContent = buffer.some((n) => {
      const el = n as HTMLElement;
      return (n.textContent || '').trim() !== '' || el.tagName === 'IMG' || el.tagName === 'BR';
    });
    if (hasContent) {
      const p = document.createElement('p');
      buffer.forEach((n) => p.appendChild(n));
      out.appendChild(p);
    }
    buffer = [];
  };
  Array.from(tmp.childNodes).forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.has((node as HTMLElement).tagName)) {
      flush();
      out.appendChild(node);
    } else {
      buffer.push(node);
    }
  });
  flush();
  return out.innerHTML;
}

/**
 * Non-technical visual editor for article body HTML. Word-style toolbar
 * (bold / heading / list / link) over a contentEditable surface, with an
 * optional raw-HTML toggle for advanced users. Emits the same HTML that
 * lands in ci_blog.description — no data shape change.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, onUploadImage }) => {
  const ref = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [insertingImg, setInsertingImg] = useState(false);
  // Current font/size of the text under the caret (shown in the dropdowns).
  const [curFont, setCurFont] = useState('');
  const [curSize, setCurSize] = useState('');

  const FONT_OPTIONS = [
    'Georgia, serif', "'Playfair Display', serif", "'Times New Roman', Times, serif", 'Garamond, serif',
    "'Merriweather', Georgia, serif", 'Arial, Helvetica, sans-serif', "'Plus Jakarta Sans', sans-serif",
    "'Helvetica Neue', Helvetica, sans-serif", 'Verdana, Geneva, sans-serif', 'Tahoma, Geneva, sans-serif',
    "'Trebuchet MS', sans-serif", "'Segoe UI', system-ui, sans-serif", 'Roboto, sans-serif',
    "'Courier New', Courier, monospace", "'JetBrains Mono', monospace",
  ];
  const SIZE_OPTIONS = ['12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','60px','72px'];
  const firstFamily = (s: string) => (s || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();

  // Reflect the caret's font/size into the toolbar dropdowns.
  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !ref.current) return;
      let node: Node | null = sel.anchorNode;
      if (!node || !ref.current.contains(node)) return;
      const el = (node.nodeType === 3 ? node.parentElement : node) as HTMLElement | null;
      if (!el) return;
      const cs = window.getComputedStyle(el);
      const fam = firstFamily(cs.fontFamily);
      const matchFont = FONT_OPTIONS.find((o) => firstFamily(o) === fam) || '';
      setCurFont(matchFont);
      const px = `${Math.round(parseFloat(cs.fontSize))}px`;
      setCurSize(SIZE_OPTIONS.includes(px) ? px : '');
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  // New paragraphs on Enter become <p> blocks so headings/alignment scope per
  // paragraph. Runs once; harmless if the browser ignores it.
  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* older browsers */ }
  }, []);

  // Load incoming HTML into the editable surface (paragraph-normalized) without
  // clobbering the caret while the user is typing.
  useEffect(() => {
    if (!htmlMode && ref.current) {
      const normalized = normalizeToBlocks(value);
      if (ref.current.innerHTML !== normalized) ref.current.innerHTML = normalized;
    }
  }, [value, htmlMode]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  // Apply an inline CSS style (font-family / font-size) to the current
  // selection, using execCommand styleWithCSS so it writes a <span style="…">.
  const applyStyle = (prop: 'fontName' | 'fontSize', value: string) => {
    ref.current?.focus();
    try { document.execCommand('styleWithCSS', false, 'true'); } catch { /* older browsers */ }
    if (prop === 'fontName') {
      document.execCommand('fontName', false, value);
    } else {
      // fontSize command only takes 1-7; wrap selection in a span with px size instead.
      const sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const span = document.createElement('span');
        span.style.fontSize = value;
        try { span.appendChild(sel.getRangeAt(0).extractContents()); sel.getRangeAt(0).insertNode(span); } catch { /* skip */ }
      }
    }
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const addLink = () => {
    const url = prompt('Link URL (https://…)');
    if (url) exec('createLink', url);
  };

  // Remember where the caret is before the file dialog steals focus.
  const rememberCaret = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0);
  };
  const pickImage = () => { rememberCaret(); imgInputRef.current?.click(); };
  const onImageChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
    if (!onUploadImage) { alert('Image upload is only available on the live site.'); return; }
    if (file.size > 8 * 1024 * 1024) { alert('Image is too large (max 8 MB).'); return; }
    setInsertingImg(true);
    try {
      const path = await onUploadImage(file);
      if (!path) return;
      const url = resolveAssetUrl(path);
      ref.current?.focus();
      // Restore the caret so the image lands where the user was typing.
      if (savedRange.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange.current);
      }
      document.execCommand('insertHTML', false, `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`);
      if (ref.current) onChange(ref.current.innerHTML);
    } finally {
      setInsertingImg(false);
    }
  };

  const btn = 'p-1.5 rounded hover:bg-zinc-700 text-zinc-300 hover:text-white transition';

  const Tool = ({ icon: Icon, label, on }: { icon: any; label: string; on: () => void }) => (
    <button type="button" title={label} aria-label={label} onClick={on} className={btn}>
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-zinc-900 border-b border-zinc-700">
        <Tool icon={Bold} label="Bold" on={() => exec('bold')} />
        <Tool icon={Italic} label="Italic" on={() => exec('italic')} />
        <Tool icon={Underline} label="Underline" on={() => exec('underline')} />
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        {/* Font family — applies to selected text */}
        <select
          title="Font" aria-label="Font" value={curFont}
          onChange={(e) => { if (e.target.value) { setCurFont(e.target.value); applyStyle('fontName', e.target.value); } }}
          className="bg-zinc-800 text-zinc-200 text-xs rounded px-1.5 py-1 outline-none hover:bg-zinc-700 cursor-pointer"
        >
          <option value="">Font</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'Times New Roman', Times, serif">Times New Roman</option>
          <option value="Garamond, serif">Garamond</option>
          <option value="'Merriweather', Georgia, serif">Merriweather</option>
          <option value="Arial, Helvetica, sans-serif">Arial</option>
          <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
          <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
          <option value="Verdana, Geneva, sans-serif">Verdana</option>
          <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="'Courier New', Courier, monospace">Courier New</option>
          <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
        </select>
        {/* Text size — applies to selected text */}
        <select
          title="Text size" aria-label="Text size" value={curSize}
          onChange={(e) => { if (e.target.value) { setCurSize(e.target.value); applyStyle('fontSize', e.target.value); } }}
          className="bg-zinc-800 text-zinc-200 text-xs rounded px-1.5 py-1 outline-none hover:bg-zinc-700 cursor-pointer"
        >
          <option value="">Size</option>
          {SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('px','')}</option>
          ))}
        </select>
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        {/* Separate heading buttons — H1 to H6 plus Normal paragraph */}
        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((h) => (
          <button
            key={h}
            type="button"
            title={`Heading ${h.slice(1)}`}
            aria-label={`Heading ${h.slice(1)}`}
            onClick={() => exec('formatBlock', h)}
            className={`${btn} text-[11px] font-bold uppercase min-w-[26px]`}
          >
            {h.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          title="Normal text (paragraph)"
          aria-label="Normal text"
          onClick={() => exec('formatBlock', 'p')}
          className={`${btn} text-[11px] font-bold`}
        >
          P
        </button>
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <Tool icon={Quote} label="Quote" on={() => exec('formatBlock', 'blockquote')} />
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        {/* Text alignment */}
        <Tool icon={AlignLeft} label="Align left" on={() => exec('justifyLeft')} />
        <Tool icon={AlignCenter} label="Align center" on={() => exec('justifyCenter')} />
        <Tool icon={AlignRight} label="Align right" on={() => exec('justifyRight')} />
        <Tool icon={AlignJustify} label="Justify" on={() => exec('justifyFull')} />
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <Tool icon={List} label="Bullet list" on={() => exec('insertUnorderedList')} />
        <Tool icon={ListOrdered} label="Numbered list" on={() => exec('insertOrderedList')} />
        <Tool icon={Link2} label="Add link" on={addLink} />
        {onUploadImage && (
          <button
            type="button"
            title="Insert image into the article"
            aria-label="Insert image"
            onClick={pickImage}
            disabled={insertingImg}
            className={`${btn} ${insertingImg ? 'opacity-60 cursor-wait' : ''} flex items-center gap-1`}
          >
            <ImagePlus className="w-4 h-4" />
            <span className="text-[10px] font-bold">{insertingImg ? '…' : 'Image'}</span>
          </button>
        )}
        <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onImageChosen} className="hidden" />
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <Tool icon={Eraser} label="Clear formatting" on={() => exec('removeFormat')} />
        <button
          type="button"
          onClick={() => setHtmlMode((m) => !m)}
          className={`ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
            htmlMode ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
          title="Toggle raw HTML (advanced)"
        >
          <Code2 className="w-3.5 h-3.5" /> HTML
        </button>
      </div>

      {/* Editable surface OR raw HTML */}
      {htmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="w-full p-4 bg-zinc-950 text-zinc-200 font-mono text-xs outline-none resize-y"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          className="nf-rte min-h-[320px] max-h-[520px] overflow-y-auto p-4 text-stone-800 text-[15px] leading-relaxed outline-none"
        />
      )}

      {/* Editable content styling so it reads like the published article */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nf-rte h1 { font-size: 1.7em; font-weight: 800; margin: .6em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h2 { font-size: 1.4em; font-weight: 700; margin: .6em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h3 { font-size: 1.2em; font-weight: 700; margin: .5em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h4 { font-size: 1.1em; font-weight: 700; margin: .5em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h5 { font-size: 1em; font-weight: 700; margin: .5em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h6 { font-size: .9em; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin: .5em 0 .3em; }
        .nf-rte p { margin: .5em 0; }
        .nf-rte ul { list-style: disc; padding-left: 1.4em; margin: .5em 0; }
        .nf-rte ol { list-style: decimal; padding-left: 1.4em; margin: .5em 0; }
        .nf-rte a { color: #991B1B; text-decoration: underline; }
        .nf-rte blockquote { border-left: 3px solid #991B1B; padding-left: 1em; color: #555; font-style: italic; margin: .6em 0; }
        .nf-rte img { max-width: 100%; height: auto; }
        .nf-rte:empty:before { content: 'Start writing the article…'; color: #aaa; }
      `}} />
    </div>
  );
};

export default RichTextEditor;
