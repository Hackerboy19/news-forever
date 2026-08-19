import React, { useState } from 'react';
import { CIImageLibrary } from '../../types';
import { Image as ImageIcon, Plus, Edit3, Trash2, Check, Upload } from 'lucide-react';

interface AdminImageLibraryProps {
  images: CIImageLibrary[];
  onUploadImage: (img: Partial<CIImageLibrary>) => void;
}

export const AdminImageLibrary: React.FC<AdminImageLibraryProps> = ({ images, onUploadImage }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('assets/img/blog/2026/08/sample-upload.jpg');
  const [newAltTag, setNewAltTag] = useState('');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !newFilePath) {
      alert('Please fill in file name and path');
      return;
    }
    onUploadImage({
      file_name: newFileName,
      file_path: newFilePath,
      alt_tag: newAltTag || newFileName,
    });
    setShowUploadModal(false);
    setNewFileName('');
    setNewAltTag('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Image Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            All pictures uploaded to the site. Add new ones, and edit the short description of each image.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition"
        >
          <Upload className="w-4 h-4" />
          Upload New Image
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-2 p-3">
            <div className="relative h-40 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={img.file_path}
                alt={img.alt_tag}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white truncate" title={img.file_name}>{img.file_name}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{img.file_path}</p>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-rose-300 font-mono truncate">
                alt="{img.alt_tag}"
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Upload New Image Asset</h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. miss-world-crowning.jpg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Relative File Path</label>
                <input
                  type="text"
                  required
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="assets/img/blog/2026/08/miss-world-crowning.jpg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Describe the image <span className="text-slate-500 font-normal">(helps Google &amp; screen readers)</span></label>
                <input
                  type="text"
                  required
                  value={newAltTag}
                  onChange={(e) => setNewAltTag(e.target.value)}
                  placeholder="Descriptive image text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageLibrary;
