import React, { useState } from 'react';
import { CIAdvertisement } from '../../types';
import { BarChart2, Plus, Edit3, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface AdminAdsProps {
  ads: CIAdvertisement[];
  onSaveAd: (ad: Partial<CIAdvertisement> & { image_file?: { filename: string; data: string } }) => void;
  onDeleteAd?: (id: number) => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ ads, onSaveAd, onDeleteAd }) => {
  const [imageFile, setImageFile] = useState<{ filename: string; data: string; preview: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<CIAdvertisement>>({
    title: '',
    advertisement_image: 'assets/img/ads/banner-728x90.jpg',
    alt_tag: '',
    url: 'https://example.com',
    position: 'top_banner',
    status: 1,
  });

  const handleOpenAdd = () => {
    setEditingAd({
      title: '',
      advertisement_image: 'assets/img/ads/banner-728x90.jpg',
      alt_tag: '',
      url: 'https://example.com',
      position: 'top_banner',
      status: 1,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Image too large (max 8MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1] || '';
      setImageFile({ filename: file.name, data: base64, preview: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd.title) {
      alert('Ad Title is required');
      return;
    }
    onSaveAd(imageFile ? { ...editingAd, image_file: { filename: imageFile.filename, data: imageFile.data } } : editingAd);
    setImageFile(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#222222] p-6">
        <div>
          <h1 className="text-xl font-serif italic font-bold text-white flex items-center gap-2">
            Advertisement Zone Manager (<code className="text-orange-400 font-mono text-xs">ci_advertisement</code>)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure header banners, sticky sidebars, and in-article ad slots with asset & alt tag mapping.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Ad Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-[#111111] border border-[#222222] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400 font-mono tracking-widest">
                  Zone: {ad.position}
                </span>
                <h3 className="text-base font-serif italic font-bold text-white mt-0.5">{ad.title}</h3>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ad.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {ad.status === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Ad Banner Preview */}
            <div className="relative overflow-hidden bg-[#0A0A0A] border border-[#222222] h-28 flex items-center justify-center p-2">
              <img
                src={ad.advertisement_image}
                alt={ad.alt_tag}
                className="max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div className="space-y-1 text-xs font-mono text-zinc-400 bg-[#0A0A0A] p-3 border border-[#222222]">
              <div className="truncate">
                <span className="text-zinc-300">image:</span> {ad.advertisement_image}
              </div>
              <div className="truncate">
                <span className="text-zinc-300">alt_tag:</span> "{ad.alt_tag}"
              </div>
              <div className="truncate text-orange-400 flex items-center gap-1">
                <span>url:</span> {ad.url} <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-mono">
              <div className="text-zinc-400">
                Clicks: <strong className="text-white">{ad.click_count}</strong> | Impressions: <strong className="text-white">{ad.impressions}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingAd(ad);
                    setImageFile(null);
                    setShowModal(true);
                  }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[10px] uppercase font-bold tracking-widest"
                >
                  Edit Ad
                </button>
                {onDeleteAd && (
                  <button
                    onClick={() => onDeleteAd(ad.id)}
                    className="px-3 py-1 bg-red-900/40 hover:bg-red-800 text-red-300 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222222] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-serif italic font-bold text-white border-b border-[#222222] pb-3">
              {editingAd.id ? 'Edit Advertisement' : 'New Advertisement'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={editingAd.title || ''}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Ad Slot Position</label>
                <select
                  value={editingAd.position || 'top_banner'}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, position: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white text-sm focus:border-orange-500 outline-none"
                >
                  <option value="blog">Leaderboard / In-Article ("blog" zone)</option>
                  <option value="left">Sidebar Panel — left</option>
                  <option value="right">Sidebar Panel — right</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Upload Ad Image (<code className="text-orange-400 font-mono">advertisement_image</code>)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-zinc-300 file:mr-3 file:px-3 file:py-1.5 file:bg-orange-600 file:text-white file:border-0 file:text-xs file:font-bold file:uppercase file:cursor-pointer bg-[#0A0A0A] border border-zinc-700 p-1.5"
                />
                {imageFile && (
                  <div className="mt-2 p-2 bg-[#0A0A0A] border border-zinc-700 flex items-center gap-3">
                    <img src={imageFile.preview} alt="preview" className="h-12 object-contain" />
                    <span className="text-[10px] font-mono text-emerald-400 truncate">{imageFile.filename} — uploads to assets/img/advertisement/ on save</span>
                  </div>
                )}
                <p className="text-[10px] text-zinc-500 mt-1.5">…or paste an existing path / full URL below:</p>
                <input
                  type="text"
                  required={!imageFile}
                  value={editingAd.advertisement_image || ''}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, advertisement_image: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white font-mono text-xs focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Alt Tag (<code className="text-orange-400 font-mono">alt_tag</code>)
                </label>
                <input
                  type="text"
                  required
                  value={editingAd.alt_tag || ''}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, alt_tag: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Destination URL</label>
                <input
                  type="text"
                  required
                  value={editingAd.url || ''}
                  onChange={(e) => setEditingAd(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-zinc-700 text-white text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 text-white text-xs font-bold uppercase tracking-widest"
                >
                  Save Advertisement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAds;
