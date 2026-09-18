import React, { useState } from 'react';
import { CITag, CIBlog } from '../../types';
import { Tag as TagIcon, Search, Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface AdminTagsProps {
  tags: CITag[];
  blogs: CIBlog[];
  onSave?: (t: { id?: number; tag_name: string; slug?: string }) => Promise<boolean>;
  onDelete?: (id: number) => Promise<boolean>;
}

const slugify = (s: string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

/** Tag manager — list with article counts, plus add / rename / delete. */
export const AdminTags: React.FC<AdminTagsProps> = ({ tags, blogs, onSave, onDelete }) => {
  const [q, setQ] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const counts = new Map<number, number>();
  blogs.forEach((b) => (b.status === 1 ? (b.tag_ids || []) : []).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1)));

  const filtered = tags
    .filter((t) => t.tag_name.toLowerCase().includes(q.toLowerCase()) || (t.slug || '').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));

  const startEdit = (t: CITag) => { setEditId(t.id); setEditName(t.tag_name); setEditSlug(t.slug || ''); };
  const saveEdit = async () => {
    if (!onSave || !editId || !editName.trim()) return;
    setBusy(true);
    const ok = await onSave({ id: editId, tag_name: editName.trim(), slug: (editSlug.trim() || slugify(editName)) });
    setBusy(false);
    if (ok) setEditId(null);
  };
  const addTag = async () => {
    if (!onSave || !newName.trim()) return;
    setBusy(true);
    const ok = await onSave({ tag_name: newName.trim(), slug: slugify(newName) });
    setBusy(false);
    if (ok) setNewName('');
  };
  const del = async (t: CITag) => {
    if (!onDelete) return;
    if (!confirm(`Delete tag "${t.tag_name}"? Articles keep their text; only the tag page goes.`)) return;
    await onDelete(t.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#222222] p-6">
        <div>
          <h1 className="text-xl font-serif italic font-bold text-white flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-orange-400" /> Tags
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Keywords with their own page at <code className="text-orange-300">/tag/&lt;name&gt;</code>. Add, rename or delete here.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tags…"
            className="pl-9 pr-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white text-sm rounded focus:outline-none focus:border-orange-500 w-full sm:w-64" />
        </div>
      </div>

      {onSave && (
        <div className="bg-[#111111] border border-[#222222] p-4 flex items-center gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New tag name…"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            className="flex-1 bg-[#0A0A0A] border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-orange-500" />
          <span className="text-[11px] font-mono text-zinc-500">/{slugify(newName) || 'slug'}</span>
          <button onClick={addTag} disabled={busy || !newName.trim()} className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-bold rounded">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}

      <div className="bg-[#111111] border border-[#222222] overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#0A0A0A] border-b border-[#222222] text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <tr><th className="p-4">#</th><th className="p-4">Tag name</th><th className="p-4">Web address</th><th className="p-4">Articles</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/40 transition">
                <td className="p-4 text-xs text-zinc-500">#{t.id}</td>
                {editId === t.id ? (
                  <>
                    <td className="p-4"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[#0A0A0A] border border-zinc-700 text-white text-sm rounded px-2 py-1 w-full" /></td>
                    <td className="p-4"><input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} placeholder={slugify(editName)} className="bg-[#0A0A0A] border border-zinc-700 text-white text-xs font-mono rounded px-2 py-1 w-full" /></td>
                    <td className="p-4 text-xs">{counts.get(t.id) || 0}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={saveEdit} disabled={busy} className="p-1.5 text-emerald-400 hover:bg-zinc-800 rounded" title="Save"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded" title="Cancel"><X className="w-4 h-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-bold text-white">{t.tag_name}</td>
                    <td className="p-4 text-xs text-zinc-400 font-mono">/tag/{t.slug}</td>
                    <td className="p-4 text-xs">{counts.get(t.id) || 0}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <a href={`/tag/${encodeURIComponent(t.slug)}`} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline text-xs mr-2">Open ↗</a>
                      {onSave && <button onClick={() => startEdit(t)} className="p-1.5 text-blue-400 hover:bg-zinc-800 rounded" title="Rename"><Pencil className="w-4 h-4" /></button>}
                      {onDelete && <button onClick={() => del(t)} className="p-1.5 text-rose-400 hover:bg-zinc-800 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">No tags found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTags;
