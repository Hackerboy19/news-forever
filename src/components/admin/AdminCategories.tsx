import React, { useMemo, useState } from 'react';
import { CICategory } from '../../types';
import SeoMetaFields from './SeoMetaFields';
import { FolderTree, Plus, Edit3, Trash2, Globe, Save, X, Check, Search, AlertTriangle, CheckCircle2, CornerDownRight } from 'lucide-react';

interface AdminCategoriesProps {
  categories: CICategory[];
  onSaveCategory: (cat: Partial<CICategory>) => void;
  onDeleteCategory: (id: number) => void;
}

/**
 * What is wrong with a category's search metadata, in plain words.
 *
 * The common failure is invisible from the list: the Add form pre-fills Meta
 * Title with the category name, so a category saved without opening the
 * Search / SEO tab ends up titled "Trainers" with a matching one-word
 * description. That looks filled in, ranks for nothing, and leaves an empty
 * grey line under the result on Google. Naming it here is what makes it
 * fixable without opening all 78 one by one.
 */
function metaIssues(cat: CICategory): string[] {
  const out: string[] = [];
  const name = (cat.category_name || '').trim().toLowerCase();
  const title = (cat.meta_title || '').trim();
  const desc = (cat.meta_description || '').trim();
  if (!title) out.push('No meta title');
  else if (title.toLowerCase() === name) out.push('Title is just the name');
  if (!desc) out.push('No description');
  else if (desc.toLowerCase() === name) out.push('Description is just the name');
  else if (desc.length < 120) out.push(`Description short (${desc.length}, aim 120–165)`);
  else if (desc.length > 165) out.push(`Description long (${desc.length}, aim 120–165)`);
  return out;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'seo'>('general');
  const [query, setQuery] = useState('');
  const [onlyWeak, setOnlyWeak] = useState(false);

  /** id -> name, so a child row can show which section it sits under. */
  const nameById = useMemo(() => {
    const m = new Map<number, string>();
    categories.forEach((c) => m.set(c.id, c.category_name));
    return m;
  }, [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((c) => {
      if (onlyWeak && metaIssues(c).length === 0) return false;
      if (!q) return true;
      const parent = c.parent_id ? (nameById.get(c.parent_id) || '') : '';
      return (
        c.category_name.toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q) ||
        parent.toLowerCase().includes(q) ||
        String(c.id) === q
      );
    });
  }, [categories, query, onlyWeak, nameById]);

  const weakCount = useMemo(
    () => categories.filter((c) => metaIssues(c).length > 0).length,
    [categories]
  );

  const [editingCat, setEditingCat] = useState<Partial<CICategory>>({
    category_name: '',
    slug: '',
    status: 1,
    meta_title: '',
    meta_description: '',
  });

  /** Parents a category may be filed under: any other category, minus its own subtree. */
  const parentOptions = useMemo(() => {
    const banned = new Set<number>();
    if (editingCat.id) {
      banned.add(editingCat.id);
      let grew = true;
      while (grew) {
        grew = false;
        categories.forEach((c) => {
          if (c.parent_id && banned.has(c.parent_id) && !banned.has(c.id)) {
            banned.add(c.id);
            grew = true;
          }
        });
      }
    }
    return categories
      .filter((c) => !banned.has(c.id))
      .sort((a, z) => a.category_name.localeCompare(z.category_name));
  }, [categories, editingCat.id]);

  const handleOpenAdd = () => {
    setEditingCat({
      category_name: '',
      slug: '',
      parent_id: 0,
      status: 1,
      meta_title: '',
      meta_description: '',
    });
    setModalTab('general');
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CICategory) => {
    setEditingCat(cat);
    setModalTab('general');
    setShowModal(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const slug = val.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    setEditingCat(prev => ({
      ...prev,
      category_name: val,
      slug: prev.slug && editingCat.id ? prev.slug : slug,
      meta_title: prev.meta_title ? prev.meta_title : val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat.category_name) {
      alert('Category Name is required');
      return;
    }
    onSaveCategory(editingCat);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Categories
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            The sections of the site (like Pageants, City News). Add or edit them here.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, web address, parent section or #id…"
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white shrink-0" title="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOnlyWeak((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${
            onlyWeak
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Show only categories whose search metadata needs work"
        >
          <AlertTriangle className="w-4 h-4" />
          Needs SEO work ({weakCount})
        </button>
      </div>

      <p className="text-xs text-slate-500 -mt-3">
        Showing {visible.length} of {categories.length} categories.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Name</th>
              <th className="p-4">Sits under</th>
              <th className="p-4">Web address</th>
              <th className="p-4">Articles</th>
              <th className="p-4">Search text</th>
              <th className="p-4">Shown?</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                  No categories match that search.
                </td>
              </tr>
            )}
            {visible.map((cat) => {
              const issues = metaIssues(cat);
              const parentName = cat.parent_id ? nameById.get(cat.parent_id) : null;
              return (
              <tr key={cat.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono text-xs text-slate-400">#{cat.id}</td>
                <td className="p-4 font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    {parentName && <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    {cat.category_name}
                  </span>
                </td>
                <td className="p-4 text-xs text-slate-400">
                  {parentName || <span className="text-slate-600">Top level</span>}
                </td>
                <td className="p-4 font-mono text-xs text-slate-400">/category/{cat.slug}</td>
                <td className="p-4 font-mono text-xs text-slate-300">{cat.article_count || 0} articles</td>
                <td className="p-4">
                  {issues.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Good
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-amber-400 cursor-help"
                      title={issues.join('\n')}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> {issues[0]}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.status === 1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {cat.status === 1 ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                      title="Edit category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tabbed Edit/Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-rose-400" />
                {editingCat.id ? `Edit Category #${editingCat.id}` : 'Add New Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  modalTab === 'general' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400'
                }`}
              >
                Basics
              </button>
              <button
                type="button"
                onClick={() => setModalTab('seo')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  modalTab === 'seo' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400'
                }`}
              >
                Search / SEO
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalTab === 'general' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Category name
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCat.category_name || ''}
                      onChange={handleNameChange}
                      placeholder="e.g. Pageants"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Web address <span className="text-slate-500 normal-case font-normal">(auto-filled — ⚠ changing it breaks old links)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCat.slug || ''}
                      onChange={(e) => setEditingCat(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="pageants"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Shows as newsforever.in/category/<span className="text-slate-300">{editingCat.slug || 'pageants'}</span></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Sits under <span className="text-slate-500 normal-case font-normal">(leave as Top level for a main section)</span>
                    </label>
                    <select
                      value={editingCat.parent_id || 0}
                      onChange={(e) => setEditingCat(prev => ({ ...prev, parent_id: parseInt(e.target.value, 10) }))}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    >
                      <option value={0}>Top level — its own section</option>
                      {parentOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      A sub-category's articles also count towards its parent. The web address does not change.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Show on the site?
                    </label>
                    <select
                      value={editingCat.status || 1}
                      onChange={(e) => setEditingCat(prev => ({ ...prev, status: parseInt(e.target.value, 10) }))}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    >
                      <option value={1}>Yes — visible to visitors</option>
                      <option value={0}>No — hidden</option>
                    </select>
                  </div>
                </>
              ) : (
                <SeoMetaFields
                  values={{ meta_title: editingCat.meta_title, meta_description: editingCat.meta_description }}
                  onChange={(patch) => setEditingCat(prev => ({ ...prev, ...patch }))}
                  previewUrl={`https://newsforever.in/category/${(editingCat.slug || '').trim() || 'category-slug'}`}
                  withAltField={false}
                  withKeywords={false}
                  withOg={false}
                />
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
