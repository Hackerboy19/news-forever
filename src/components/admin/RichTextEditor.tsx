import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Link2, Quote, Eraser, Code2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Non-technical visual editor for article body HTML. Word-style toolbar
 * (bold / heading / list / link) over a contentEditable surface, with an
 * optional raw-HTML toggle for advanced users. Emits the same HTML that
 * lands in ci_blog.description — no data shape change.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);

  // Load incoming HTML into the editable surface without clobbering the caret
  useEffect(() => {
    if (!htmlMode && ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value, htmlMode]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const addLink = () => {
    const url = prompt('Link URL (https://…)');
    if (url) exec('createLink', url);
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
        <Tool icon={Heading2} label="Heading" on={() => exec('formatBlock', 'h2')} />
        <Tool icon={Heading3} label="Sub-heading" on={() => exec('formatBlock', 'h3')} />
        <Tool icon={Quote} label="Quote" on={() => exec('formatBlock', 'blockquote')} />
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <Tool icon={List} label="Bullet list" on={() => exec('insertUnorderedList')} />
        <Tool icon={ListOrdered} label="Numbered list" on={() => exec('insertOrderedList')} />
        <Tool icon={Link2} label="Add link" on={addLink} />
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
        .nf-rte h2 { font-size: 1.4em; font-weight: 700; margin: .6em 0 .3em; font-family: Georgia, serif; }
        .nf-rte h3 { font-size: 1.2em; font-weight: 700; margin: .5em 0 .3em; font-family: Georgia, serif; }
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
