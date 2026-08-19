import React from 'react';
import { Upload } from 'lucide-react';

export interface SeoValues {
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  og_image?: string;
  og_url?: string;
  alt_tag?: string;
}

interface SeoMetaFieldsProps {
  values: SeoValues;
  onChange: (patch: Partial<SeoValues>) => void;
  /** URL shown in the Google preview card. */
  previewUrl: string;
  /** Show the image-alt field (articles yes, categories no). */
  withAltField?: boolean;
  withKeywords?: boolean;
  withOg?: boolean;
  /** Called with a File to upload for the OG image; returns stored path. */
  onUploadOgImage?: (file: File) => Promise<string | null>;
}

const Counter: React.FC<{ len: number; max: number; ideal?: [number, number] }> = ({ len, max, ideal }) => {
  const ok = ideal ? len >= ideal[0] && len <= ideal[1] : len > 0 && len <= max;
  return (
    <span className={`text-[11px] font-mono ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
      {len}/{max}
    </span>
  );
};

/**
 * Rich SEO editor — meta title/description with live counters, keywords,
 * social share (OG) image with upload, canonical URL and a live Google
 * result preview. Light card styling for legibility inside the dark admin.
 */
export const SeoMetaFields: React.FC<SeoMetaFieldsProps> = ({
  values,
  onChange,
  previewUrl,
  withAltField = true,
  withKeywords = true,
  withOg = true,
  onUploadOgImage,
}) => {
  const [uploading, setUploading] = React.useState(false);
  const titleLen = (values.meta_title || '').length;
  const descLen = (values.meta_description || '').length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadOgImage) return;
    setUploading(true);
    const path = await onUploadOgImage(file);
    setUploading(false);
    if (path) onChange({ og_image: path });
  };

  const field = 'w-full bg-white border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600/30';
  const label = 'block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1';

  return (
    <div className="bg-[#FDF7F9] border border-pink-100 rounded-xl p-5 space-y-4 text-stone-800">
      <div>
        <label className={label}>Meta Title</label>
        <input
          value={values.meta_title || ''}
          maxLength={120}
          onChange={(e) => onChange({ meta_title: e.target.value })}
          placeholder="Page title as it appears on Google…"
          className={field}
        />
        <Counter len={titleLen} max={60} ideal={[20, 60]} />
      </div>

      <div>
        <label className={label}>Meta Description</label>
        <textarea
          rows={3}
          value={values.meta_description || ''}
          onChange={(e) => onChange({ meta_description: e.target.value })}
          placeholder="Short summary shown under the title in search results…"
          className={field}
        />
        <Counter len={descLen} max={160} ideal={[120, 160]} />
      </div>

      {withKeywords && (
      <div>
        <label className={label}>Keywords (comma-separated)</label>
        <input
          value={values.meta_keyword || ''}
          onChange={(e) => onChange({ meta_keyword: e.target.value })}
          placeholder="miss india 2026, beauty pageant, …"
          className={field}
        />
      </div>
      )}

      {withAltField && (
        <div>
          <label className={label}>Image Alt Text</label>
          <input
            value={values.alt_tag || ''}
            onChange={(e) => onChange({ alt_tag: e.target.value })}
            placeholder="Descriptive alt text for the cover image…"
            className={field}
          />
        </div>
      )}

      {withOg && (
      <div>
        <label className={label}>Social Share Image (OG, 1200×630)</label>
        <div className="flex items-start gap-3">
          <div className="w-24 h-16 bg-white border border-stone-200 rounded-md flex items-center justify-center overflow-hidden shrink-0">
            {values.og_image ? (
              <img src={values.og_image} alt="OG preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-pink-300">No image</span>
            )}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {onUploadOgImage && (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-full cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            )}
            <input
              value={values.og_image || ''}
              onChange={(e) => onChange({ og_image: e.target.value })}
              placeholder="…or paste an image URL"
              className={field}
            />
          </div>
        </div>
      </div>
      )}

      {withOg && (
      <div>
        <label className={label}>Canonical URL (optional)</label>
        <input
          value={values.og_url || ''}
          onChange={(e) => onChange({ og_url: e.target.value })}
          placeholder={previewUrl}
          className={field}
        />
      </div>
      )}

      <div>
        <label className={label}>Google Preview</label>
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-0.5">
          <div className="text-[12px] text-stone-500 truncate">{values.og_url || previewUrl}</div>
          <div className="text-[17px] text-[#1a0dab] leading-snug font-medium truncate">
            {values.meta_title || 'Meta title preview'}
          </div>
          <div className="text-[13px] text-stone-600 line-clamp-2">
            {values.meta_description || 'Meta description preview appears here exactly as searchers will see it.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoMetaFields;
