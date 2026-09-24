import React, { useState, useRef } from 'react';
import { CICategory } from '../../types';
import { Palette, Layout, Save, RotateCcw, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { resolveAssetUrl } from '../../lib/assets';

export interface SiteConfigValues {
  headerColor?: string;
  footerColor?: string;
  navExtra?: number[];
  logoUrl?: string;
  // Site-wide search / social defaults (used on the homepage and when the
  // site URL itself is shared).
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords?: string;
  ogImage?: string;
  showTicker?: boolean;
  tickerText?: string;
  homeH1?: string;
  homeIntro?: string;
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
  // Site-wide SEO / social
  const [siteTitle, setSiteTitle] = useState(config.siteTitle || '');
  const [siteDescription, setSiteDescription] = useState(config.siteDescription || '');
  const [siteKeywords, setSiteKeywords] = useState(config.siteKeywords || '');
  const [ogImage, setOgImage] = useState(config.ogImage || '');
  // Breaking-news ticker
  const [showTicker, setShowTicker] = useState(config.showTicker !== false);
  const [tickerText, setTickerText] = useState(config.tickerText || '');
  const [homeH1, setHomeH1] = useState(config.homeH1 || '');
  const [homeIntro, setHomeIntro] = useState(config.homeIntro || '');
  const [uploadingOg, setUploadingOg] = useState(false);
  const ogInputRef = useRef<HTMLInputElement>(null);
  const handleOgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!onUploadImage) { alert('Upload is only available on the live site.'); return; }
    if (file.size > 4 * 1024 * 1024) { alert('Image too large (max 4 MB).'); return; }
    setUploadingOg(true);
    try { const path = await onUploadImage(file); if (path) setOgImage(resolveAssetUrl(path)); }
    finally { setUploadingOg(false); }
  };
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
      // Store the absolute URL so the public header renders it regardless of
      // which origin the app is served from (uploads live on the asset host).
      if (path) setLogoUrl(resolveAssetUrl(path));
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
    const ok = await onSave({
      headerColor, footerColor, navExtra,
      logoUrl: logoUrl.trim() || undefined,
      siteTitle: siteTitle.trim() || undefined,
      siteDescription: siteDescription.trim() || undefined,
      siteKeywords: siteKeywords.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
      showTicker,
      tickerText: tickerText.trim() || undefined,
      homeH1: homeH1.trim() || undefined,
      homeIntro: homeIntro.trim() || undefined,
    });
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
              <img src={resolveAssetUrl(logoUrl)} alt="Site logo preview" className="max-w-full max-h-full object-contain"
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

      {/* Site-wide Search / Social defaults (homepage + when the site link is shared) */}
      <div className="bg-[#111111] border border-[#222222] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Search &amp; Social (whole site)</h2>
        <p className="text-xs text-zinc-400 -mt-2">Used on the homepage and when someone shares <strong className="text-zinc-200">newsforever.in</strong> itself on Google / WhatsApp / Facebook. (Individual articles have their own — set those in the article editor.)</p>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Site title <span className="normal-case font-normal text-zinc-500">(shown in the browser tab &amp; Google)</span></label>
          <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="News Forever | National & International News Portal"
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Site description <span className="normal-case font-normal text-zinc-500">(grey text under the title on Google)</span></label>
          <textarea rows={2} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} placeholder="Latest breaking news, beauty pageant updates…"
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Keywords <span className="normal-case font-normal text-zinc-500">(comma separated)</span></label>
          <input value={siteKeywords} onChange={(e) => setSiteKeywords(e.target.value)} placeholder="news forever, beauty pageant, miss india…"
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Share image (OG) <span className="normal-case font-normal text-zinc-500">(shown on WhatsApp/FB when the site link is shared — 1200×630)</span></label>
          <div className="flex items-center gap-3">
            {ogImage ? (
              <img src={resolveAssetUrl(ogImage)} alt="Share preview" className="w-20 h-14 rounded object-cover border border-zinc-700 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
            ) : (
              <div className="w-20 h-14 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] text-zinc-500 shrink-0">None</div>
            )}
            <div className="flex-1 space-y-2">
              <input ref={ogInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleOgFile} className="hidden" />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={uploadingOg} onClick={() => ogInputRef.current?.click()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-xs font-bold text-white rounded">
                  {uploadingOg ? 'Uploading…' : 'Upload from computer'}
                </button>
                {ogImage && <button type="button" onClick={() => setOgImage('')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded">Remove</button>}
              </div>
              <input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="…or paste an image link (URL)"
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[11px] font-mono text-zinc-200 outline-none focus:border-orange-500 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Homepage heading (visible H1 + intro, for SEO) */}
      <div className="bg-[#111111] border border-[#222222] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Homepage heading (SEO)</h2>
        <p className="text-xs text-zinc-400 -mt-2">Shown at the top of the homepage as the main <strong className="text-zinc-200">H1</strong> + a short intro. Real, visible text that Google and AI read for ranking.</p>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Homepage H1 heading</label>
          <input value={homeH1} onChange={(e) => setHomeH1(e.target.value)} placeholder="News Forever — Beauty Pageants, Awards & National News"
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Intro paragraph <span className="normal-case font-normal text-zinc-500">(1–2 lines under the H1)</span></label>
          <textarea rows={2} value={homeIntro} onChange={(e) => setHomeIntro(e.target.value)} placeholder="Latest coverage of Miss/Mrs India, Forever Star India Awards, national achievers, business, astrology and more."
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
        </div>
        <p className="text-[11px] text-zinc-500">Leave blank to hide this block.</p>
      </div>

      {/* Breaking-news ticker */}
      <div className="bg-[#111111] border border-[#222222] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Breaking-news ticker</h2>
        <p className="text-xs text-zinc-400 -mt-2">The red “BREAKING” strip below the header. By default it scrolls your 5 latest articles.</p>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={showTicker} onChange={(e) => setShowTicker(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-zinc-200">Show the ticker on the site</span>
        </label>
        <div className={showTicker ? '' : 'opacity-40 pointer-events-none'}>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            Custom ticker text <span className="normal-case font-normal text-zinc-500">(one line per item; leave blank to use latest articles)</span>
          </label>
          <textarea rows={4} value={tickerText} onChange={(e) => setTickerText(e.target.value)}
            placeholder={"Registration open for Miss India 2026\nGrand finale on 24 September, Jaipur"}
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-orange-500 rounded" />
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
