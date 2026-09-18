import React, { useEffect, useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { BookOpen, Save, ExternalLink, Plus, Trash2 } from 'lucide-react';

interface PageData {
  title?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
}
interface PageRef { slug: string; title: string; }

interface AdminPagesProps {
  onList: () => Promise<PageRef[]>;
  onLoad: (slug: string) => Promise<PageData>;
  onSave: (slug: string, data: PageData) => Promise<boolean>;
  onDelete: (slug: string) => Promise<boolean>;
  onUploadImage?: (file: File) => Promise<string | null>;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const LOCKED = new Set(['about-us', 'contact-us']); // defaults — editable, not deletable

/**
 * Manage all static pages. Admin can create ANY page (slug + heading + content
 * + SEO); it auto-opens at /slug. About Us / Contact Us always exist.
 */
export const AdminPages: React.FC<AdminPagesProps> = ({ onList, onLoad, onSave, onDelete, onUploadImage }) => {
  const [pages, setPages] = useState<PageRef[]>([]);
  const [slug, setSlug] = useState('about-us');
  const [data, setData] = useState<PageData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const refreshList = () => onList().then((l) => setPages(l || [])).catch(() => {});
  useEffect(() => { refreshList(); }, []);

  useEffect(() => {
    if (!slug) { setData({}); return; }
    let cancelled = false;
    setLoading(true); setMsg('');
    onLoad(slug).then((d) => { if (!cancelled) setData(d || {}); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const set = (patch: Partial<PageData>) => setData((prev) => ({ ...prev, ...patch }));

  const addPage = () => {
    const name = prompt('New page name (e.g. Privacy Policy):');
    if (!name) return;
    const s = slugify(name);
    if (!s) { alert('Invalid name.'); return; }
    if (pages.some((p) => p.slug === s)) { setSlug(s); return; }
    setPages((prev) => [...prev, { slug: s, title: name }]);
    setSlug(s);
    setData({ title: name });
  };

  const save = async () => {
    setSaving(true); setMsg('');
    const ok = await onSave(slug, data);
    setSaving(false);
    setMsg(ok ? 'Saved — live after refresh.' : 'Save failed.');
    if (ok) refreshList();
  };

  const remove = async () => {
    if (LOCKED.has(slug)) { alert('About Us / Contact Us cannot be deleted (edit instead).'); return; }
    if (!confirm(`Delete page "/${slug}"? This cannot be undone.`)) return;
    const ok = await onDelete(slug);
    if (ok) { await refreshList(); setSlug('about-us'); }
  };

  const input = 'w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded';
  const label = 'block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#222222] p-6">
        <div>
          <h1 className="text-xl font-serif italic font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" /> Pages
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Create &amp; edit any page (heading, content, SEO). Each opens at <code className="text-orange-300">/&lt;name&gt;</code>.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-zinc-800 text-zinc-200 text-sm rounded px-3 py-2 outline-none">
            {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title || p.slug}</option>)}
          </select>
          <button onClick={addPage} className="inline-flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded">
            <Plus className="w-3.5 h-3.5" /> New page
          </button>
          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-orange-400 hover:underline px-2">
            Open <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#222222] p-8 text-center text-zinc-500 text-sm">Loading…</div>
      ) : (
        <div className="bg-[#111111] border border-[#222222] p-6 space-y-5">
          <div className="text-[11px] font-mono text-zinc-500">Web address: <span className="text-orange-300">/{slug}</span></div>
          <div>
            <label className={label}>Page heading</label>
            <input value={data.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="Page title" className={input} />
          </div>
          <div>
            <label className={label}>Page content</label>
            <RichTextEditor value={data.content || ''} onChange={(html) => set({ content: html })} onUploadImage={onUploadImage} />
            <p className="text-[11px] text-zinc-500 mt-1">For About/Contact, leaving this blank uses built-in default content.</p>
          </div>
          <div className="pt-2 border-t border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Search / SEO</h2>
            <div>
              <label className={label}>Meta title</label>
              <input value={data.meta_title || ''} onChange={(e) => set({ meta_title: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Meta description</label>
              <textarea rows={2} value={data.meta_description || ''} onChange={(e) => set({ meta_description: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Keywords <span className="normal-case font-normal text-zinc-500">(comma separated)</span></label>
              <input value={data.meta_keyword || ''} onChange={(e) => set({ meta_keyword: e.target.value })} className={input} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white font-bold text-sm rounded">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save page'}
            </button>
            {!LOCKED.has(slug) && (
              <button onClick={remove} className="inline-flex items-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-red-600/80 text-zinc-300 hover:text-white text-sm rounded">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            {msg && <span className="text-xs text-zinc-400">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPages;
