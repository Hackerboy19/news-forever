import React, { useState } from 'react';
import { CIAdvertisement } from '../../types';
import { BarChart2, Plus, Edit3, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface AdminAdsProps {
  ads: CIAdvertisement[];
  onSaveAd: (ad: Partial<CIAdvertisement>) => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ ads, onSaveAd }) => {
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
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd.title) {
      alert('Ad Title is required');
      return;
    }
    onSaveAd(editingAd);
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
              <button
                onClick={() => {
                  setEditingAd(ad);
                  setShowModal(true);
                }}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[10px] uppercase font-bold tracking-widest"
              >
                Edit Ad
              </button>
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
                  <option value="top_banner">Top Leaderboard Banner (728x90)</option>
                  <option value="sidebar_sticky">Sidebar Sticky Rectangle (300x600)</option>
                  <option value="in_content">In-Article Native Banner (728x250)</option>
                  <option value="footer_banner">Footer Banner (970x90)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Ad Image Path (<code className="text-orange-400 font-mono">advertisement_image</code>)
                </label>
                <input
                  type="text"
                  required
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
