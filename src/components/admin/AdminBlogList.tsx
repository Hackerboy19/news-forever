import React, { useState } from 'react';
import { CIBlog, CICategory } from '../../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3, 
  CheckSquare, 
  Square, 
  Check, 
  X, 
  ArrowUpDown, 
  FileText,
  Filter,
  ExternalLink
} from 'lucide-react';

interface AdminBlogListProps {
  blogs: CIBlog[];
  categories: CICategory[];
  onNewBlog: () => void;
  onEditBlog: (blog: CIBlog) => void;
  onViewArticleOnFrontend: (urlSlug: string) => void;
  onDeleteBlog: (id: number) => void;
  onBulkAction: (ids: number[], action: 'activate' | 'deactivate' | 'delete') => void;
  onToggleStatus: (id: number, currentStatus: number) => void;
}

export const AdminBlogList: React.FC<AdminBlogListProps> = ({
  blogs,
  categories,
  onNewBlog,
  onEditBlog,
  onViewArticleOnFrontend,
  onDeleteBlog,
  onBulkAction,
  onToggleStatus,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<'id' | 'title' | 'views' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter & Search Logic
  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.meta_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || b.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort Logic
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    return sortDirection === 'asc' 
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedBlogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedBlogs.map(b => b.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field: 'id' | 'title' | 'views' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Articles
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            All your news articles. Create new ones, edit, publish or hide, and select several to act on at once.
          </p>
        </div>

        <button
          onClick={onNewBlog}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Title, URL slug, or Meta title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Statuses</option>
              <option value={1}>Active (1)</option>
              <option value={0}>Draft (0)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar (When selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <span className="text-xs font-semibold text-rose-300">
              {selectedIds.length} article(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onBulkAction(selectedIds, 'activate');
                  setSelectedIds([]);
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition"
              >
                Bulk Activate
              </button>
              <button
                onClick={() => {
                  onBulkAction(selectedIds, 'deactivate');
                  setSelectedIds([]);
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded transition"
              >
                Bulk Deactivate
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.length} articles permanently?`)) {
                    onBulkAction(selectedIds, 'delete');
                    setSelectedIds([]);
                  }
                }}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded transition"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.length === sortedBlogs.length && sortedBlogs.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">
                    Article Title & Asset <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Category</th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('views')}>
                  <div className="flex items-center gap-1">
                    Views <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Status Toggle</th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedBlogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No articles found matching query criteria.
                  </td>
                </tr>
              ) : (
                sortedBlogs.map((blog) => {
                  const isSelected = selectedIds.includes(blog.id);
                  return (
                    <tr
                      key={blog.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <button onClick={() => toggleSelectOne(blog.id)} className="text-slate-400 hover:text-white">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-rose-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">#{blog.id}</td>
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={blog.image}
                            alt={blog.alt_tag}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="truncate">
                            <p className="font-semibold text-white truncate text-sm" title={blog.title}>
                              {blog.title}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 truncate">
                              /article/{blog.url}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                          {blog.category_name || `Cat #${blog.category_id}`}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300">
                        {blog.views.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => onToggleStatus(blog.id, blog.status)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                            blog.status === 1
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${blog.status === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {blog.status === 1 ? 'Active' : 'Draft'}
                        </button>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {blog.created_at.split(' ')[0]}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewArticleOnFrontend(blog.url)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="View Live on Frontend"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditBlog(blog)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                            title="Edit Article (4-Tab Form)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteBlog(blog.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogList;
