import React, { useMemo, useState } from 'react';
import { CIBlog } from '../../types';
import { Search, ChevronDown, Save, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import SeoMetaFields from './SeoMetaFields';

interface AdminSeoPanelProps {
  blogs: CIBlog[];
  onQuickSave: (id: number, fields: Partial<CIBlog>) => Promise<boolean>;
  onUploadImage?: (file: File) => Promise<string | null>;
}

interface SeoCheck {
  score: number;
  issues: string[];
}

/** Per-article SEO health from the same rules as the audit report. */
function checkSeo(b: CIBlog): SeoCheck {
  const issues: string[] = [];
  if (!b.meta_title?.trim()) issues.push('Meta title missing');
  const dl = (b.meta_description || '').length;
  if (dl === 0) issues.push('Meta description missing');
  else if (dl < 120) issues.push(`Description short (${dl} chars, target 120–165)`);
  else if (dl > 165) issues.push(`Description long (${dl} chars, target 120–165)`);
  if (!b.meta_keyword?.trim()) issues.push('Keywords missing');
  else if (!/2026/.test(b.meta_keyword)) issues.push('No current-year (2026) keyword');
  if (!b.alt_tag?.trim()) issues.push('Image alt text missing');
  if (!b.og_title?.trim()) issues.push('OG title missing');
  const score = Math.max(0, 100 - issues.length * 18);
  return { score, issues };
}

const ScoreChip: React.FC<{ score: number }> = ({ score }) => {
  const cls =
    score >= 90
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : score >= 60
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  const Icon = score >= 90 ? CheckCircle2 : score >= 60 ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold font-mono ${cls}`}>
      <Icon className="w-3 h-3" /> {score}
    </span>
  );
};

/**
 * SEO workbench: every article's SEO health at a glance with inline editing
 * of the fields that matter for ranking — writes go straight to ci_blog.
 */
export const AdminSeoPanel: React.FC<AdminSeoPanelProps> = ({ blogs, onQuickSave, onUploadImage }) => {
  const [query, setQuery] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<CIBlog>>({});
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    return blogs
      .map((b) => ({ b, seo: checkSeo(b) }))
      .filter(({ b, seo }) => {
        if (onlyIssues && seo.issues.length === 0) return false;
        const q = query.toLowerCase().trim();
        return !q || b.title.toLowerCase().includes(q) || String(b.id).includes(q);
      })
      .sort((a, z) => a.seo.score - z.seo.score);
  }, [blogs, query, onlyIssues]);

  const openEditor = (b: CIBlog) => {
    setOpenId(b.id);
    setDraft({
      meta_title: b.meta_title,
      meta_description: b.meta_description,
      meta_keyword: b.meta_keyword,
      alt_tag: b.alt_tag,
      og_title: b.og_title,
      og_image: b.og_image,
      og_url: b.og_url,
    });
  };

  const save = async (id: number) => {
    setSaving(true);
    const ok = await onQuickSave(id, draft);
    setSaving(false);
    if (ok) setOpenId(null);
  };

  const descLen = (draft.meta_description || '').length;
  const totals = useMemo(() => {
    const all = blogs.map(checkSeo);
    return {
      healthy: all.filter((s) => s.score >= 90).length,
      warn: all.filter((s) => s.score >= 60 && s.score < 90).length,
      poor: all.filter((s) => s.score < 60).length,
    };
  }, [blogs]);

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-[#222222] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif italic font-bold text-white">
            SEO Workbench (<code className="text-orange-400 font-mono text-xs">ci_blog metadata</code>)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fix meta titles, descriptions, keywords and alt text article-by-article — saves write to the live database.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-emerald-400">{totals.healthy} healthy</span>
          <span className="text-amber-400">{totals.warn} needs work</span>
          <span className="text-red-400">{totals.poor} poor</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-[#111111] border border-[#222222] px-3 py-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or #id…"
            className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-400 bg-[#111111] border border-[#222222] px-3 py-2 cursor-pointer select-none">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
          Only articles with issues ({rows.length})
        </label>
      </div>

      <div className="space-y-2">
        {rows.slice(0, 100).map(({ b, seo }) => (
          <div key={b.id} className="bg-[#111111] border border-[#222222]">
            <button
              onClick={() => (openId === b.id ? setOpenId(null) : openEditor(b))}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <span className="text-[10px] font-mono text-zinc-500 w-12 shrink-0">#{b.id}</span>
              <ScoreChip score={seo.score} />
              <span className="flex-1 min-w-0 text-sm text-zinc-200 truncate">{b.title}</span>
              <span className="hidden md:block text-[10px] font-mono text-zinc-500 truncate max-w-[260px]">
                {seo.issues[0] || 'All checks pass'}
                {seo.issues.length > 1 ? ` +${seo.issues.length - 1}` : ''}
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${openId === b.id ? 'rotate-180' : ''}`} />
            </button>

            {openId === b.id && (
              <div className="border-t border-[#222222] p-4 space-y-3 bg-[#0A0A0A]">
                {seo.issues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {seo.issues.map((i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                        {i}
                      </span>
                    ))}
                  </div>
                )}

                <SeoMetaFields
                  values={draft}
                  onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
                  previewUrl={`https://newsforever.in/${b.url}`}
                  onUploadOgImage={onUploadImage}
                />

                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => setOpenId(null)} className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    onClick={() => save(b.id)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-widest"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save SEO Fields'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500 bg-[#111111] border border-[#222222]">
            No articles match — everything looks healthy. 🎯
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeoPanel;
