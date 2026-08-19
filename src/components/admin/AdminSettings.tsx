import React, { useState } from 'react';
import { CISetting } from '../../types';
import { Settings, Save, Globe, Share2 } from 'lucide-react';

interface AdminSettingsProps {
  setting: CISetting;
  onSaveSetting: (setting: Partial<CISetting>) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ setting, onSaveSetting }) => {
  const [formData, setFormData] = useState<CISetting>(setting);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSetting(formData);
    alert('Settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Site Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            The site's name, logo, social links, and the default preview text used when pages are shared.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-400" />
            General Branding & Identity
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Site Title</label>
            <input
              type="text"
              value={formData.site_title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, site_title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Site Logo Path</label>
            <input
              type="text"
              value={formData.site_logo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, site_logo: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Favicon Path</label>
            <input
              type="text"
              value={formData.favicon || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, favicon: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-rose-400" />
            Global SEO Defaults
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fallback Meta Title</label>
            <input
              type="text"
              value={formData.meta_default_title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_default_title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fallback Meta Keywords</label>
            <input
              type="text"
              value={formData.meta_default_keywords || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_default_keywords: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fallback Meta Description</label>
            <textarea
              rows={3}
              value={formData.meta_default_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_default_description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
