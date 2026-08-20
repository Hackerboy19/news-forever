import React, { useState, useRef } from 'react';
import { CICategory } from '../../types';
import { Palette, Layout, Save, RotateCcw, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

export interface SiteConfigValues {
  headerColor?: string;
  footerColor?: string;
  navExtra?: number[];
  logoUrl?: string;
}

interface AdminSiteSettingsProps {
  config: SiteConfigValues;
  categories: CICategory[];
  onSave: (config: SiteConfigValues) => Promise<boolean>;
  onUploadImage?: (file: File) => Promise<string | null>;
}

const DEFAULT_HEADER = '#132639';
const DEFAULT_FOOTER = '#FAFAFA';

/**
 * Site appearance & navigation settings — header/footer colours and extra
 * category tabs pinned into the public navbar. Persists to the database so
 * every visitor sees the change.
 */
export const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({ config, categories, onSave, onUploadImage }) => {
  const [headerColor, setHeaderColor] = useState(config.headerColor || DEFAULT_HEADER);
  const [footerColor, setFooterColor] = useState(config.footerColor || DEFAULT_FOOTER);
  const [navExtra, setNavExtra] = useState<number[]>(config.navExtra || []);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!onUploadImage) { alert('Upload is only available on the live site.'); return; }
    if (file.size > 4 * 1024 * 1024) { alert('Logo is too large (max 4 MB). Please pick a smaller file.'); return; }
    setUploadingLogo(true);
    try {
      const path = await onUploadImage(file);
      if (path) setLogoUrl(path);
    } finally {
      setUploadingLogo(false);
    }
  };

  const topCats = categories.filter((c) => !c.parent_id && (c.article_count ?? 0) > 0);

  const toggleNav = (id: number) =>
    setNavExtra((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 6)));

  const save = async () => {
    setSaving(true);
    setMsg('');
    const ok = await onSave({ headerColor, footerColor, navExtra, logoUrl: logoUrl.trim() || undefined });
    setSaving(false);
    setMsg(ok ? 'Saved — live for every visitor after refresh.' : 'Save failed.');
  };

  const colorRow = (labelText: string, value: string, set: (v: string) => void, def: string) => (
    <div className="flex items-center gap-3">
      <label className="w-40 text-xs font-bold uppercase tracking-widest text-zinc-400">{labelText}</label>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : def}
        onChange={(e) => set(e.target.value)}
        className="w-10 h-8 bg-transparent border border-zinc-700 rounded cursor-pointer"
      />
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-28 bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-orange-500"
      />
      <button onClick={() => set(def)} title="Reset to default" className="p-1.5 text-zinc-500 hover:text-white">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-[#111111] border border-[#222222] p-6">
        <h1 className="text-xl font-serif italic font-bold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-orange-400" /> Site Appearance
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Colours and navigation apply to the live public site for every visitor (saved in the database).
        </p>
      </div>

      <div className="bg-[#111111] border border-[#222222] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-orange-400" /> Site Logo
        </h2>
        <p className="text-xs text-zinc-400 -mt-2">
          The logo shown in the top-left of every page. Upload one from your computer, or leave empty to use the default NewsForever logo.
        </p>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Site logo preview" className="max-w-full max-h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
            ) : (
              <span className="text-[10px] text-zinc-500 text-center px-1">Default logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={handleLogoFile}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-wait text-xs font-bold text-white rounded-lg transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingLogo ? 'Uploading…' : 'Upload from computer'}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Use default
                </button>
              )}
            </div>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="…or paste an image link (URL)"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-orange-500 rounded"
            />
            <p className="text-[10px] text-zinc-500">Press <strong className="text-zinc-300">Save Settings</strong> below to apply. PNG or SVG works best. Max 4 MB.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Theme Colours</h2>
        {colorRow('Header colour', headerColor, setHeaderColor, DEFAULT_HEADER)}
        {colorRow('Footer colour', footerColor, setFooterColor, DEFAULT_FOOTER)}
        <div className="rounded overflow-hidden border border-zinc-800">
          <div style={{ backgroundColor: headerColor }} className="px-4 py-2 text-white text-xs font-bold">
            Header preview — NewsForever
          </div>
          <div className="px-4 py-3 bg-white text-stone-500 text-xs">Page content…</div>
          <div style={{ backgroundColor: footerColor }} className="px-4 py-2 text-xs text-stone-600 border-t border-zinc-200">
            Footer preview
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Layout className="w-4 h-4 text-orange-400" /> Extra Menu Tabs
        </h2>
        <p className="text-xs text-zinc-400">
          Tick a category to add it to the top menu of the site (up to 6). They appear after the usual sections; any
          new category you create shows up here automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {topCats.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 border text-xs cursor-pointer select-none transition ${
                navExtra.includes(c.id)
                  ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <input type="checkbox" checked={navExtra.includes(c.id)} onChange={() => toggleNav(c.id)} />
              {c.category_name}
              <span className="ml-auto font-mono text-[10px] text-zinc-500">{c.article_count} articles</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-widest"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {msg && <span className="text-xs font-mono text-emerald-400">{msg}</span>}
      </div>
    </div>
  );
};

export default AdminSiteSettings;
