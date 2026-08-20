import React, { useState, useEffect, useRef } from 'react';
import { CIBlog, CICategory, CITag, CIImageLibrary } from '../../types';
import RichTextEditor from './RichTextEditor';
import { 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Heading, 
  Save, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Globe, 
  Eye, 
  Tag as TagIcon,
  HelpCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

interface AdminBlogFormProps {
  initialData?: CIBlog | null;
  categories: CICategory[];
  tags: CITag[];
  images: CIImageLibrary[];
  onUploadImage?: (file: File) => Promise<string | null>;
  onSave: (formData: Partial<CIBlog>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const AdminBlogForm: React.FC<AdminBlogFormProps> = ({
  initialData,
  categories,
  tags,
  images,
  onUploadImage,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'seo' | 'headings'>('general');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!onUploadImage) {
      alert('Upload is only available on the live site.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large (max 8 MB). Please pick a smaller file.');
      return;
    }
    setUploading(true);
    try {
      const path = await onUploadImage(file);
      if (path) {
        handleInputChange('image', path);
        if (!formData.og_image) handleInputChange('og_image', path);
      }
    } finally {
      setUploading(false);
    }
  };

  // Form State initialized with database defaults
  const [formData, setFormData] = useState<Partial<CIBlog>>({
    title: '',
    url: '',
    short_content: '',
    content: '',
    category_id: categories.length ? categories[0].id : 1,
    tag_ids: [],
    image: 'assets/img/blog/2026/08/miss-universe-stage.jpg',
    alt_tag: '',
    status: 1,
    is_featured: false,
    is_trending: false,
    
    // SEO
    meta_title: '',
    meta_description: '',
    meta_keyword: '',
    og_title: '',
    og_url: '',
    og_description: '',
    og_image: '',

    // Headings
    h2_tag: '',
    h3_tag: '',
    h4_tag: '',
    h5_tag: '',
    h6_tag: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle URL slug auto-generation from Title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      title,
      // Auto fill URL & SEO titles if empty or pristine
      url: prev.url && initialData ? prev.url : autoSlug,
      meta_title: prev.meta_title ? prev.meta_title : title,
      og_title: prev.og_title ? prev.og_title : title,
      alt_tag: prev.alt_tag ? prev.alt_tag : title,
    }));
  };

  const handleInputChange = (field: keyof CIBlog, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagToggle = (tagId: number) => {
    const currentTags = formData.tag_ids || [];
    if (currentTags.includes(tagId)) {
      handleInputChange('tag_ids', currentTags.filter(id => id !== tagId));
    } else {
      handleInputChange('tag_ids', [...currentTags, tagId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setActiveTab('general');
      alert('Please enter an Article Title');
      return;
    }
    onSave(formData);
  };

  return (
    <div id="admin-blog-form-container" className="bg-[#111111] border border-[#222222] shadow-2xl text-[#E0E0E0] overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-[#222222] bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
            title="Back to Blog List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif italic">
              {initialData ? 'Edit Article' : 'Create New Article'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fill in the details below and press Save. Only the Title is required.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-500 transition shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Update Article'}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#222222] bg-[#0D0D0D] px-6 gap-1 pt-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-orange-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Article
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-orange-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Cover Image
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'seo'
              ? 'bg-orange-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Search / SEO
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('headings')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition whitespace-nowrap ${
            activeTab === 'headings'
              ? 'bg-orange-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Heading className="w-3.5 h-3.5" />
          Extra Headings
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* TAB 1: GENERAL INFO */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Title & URL Slug */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Article Title <span className="text-zinc-500 font-normal normal-case">(this is the big H1 heading on the page)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={handleTitleChange}
                    placeholder="e.g. The Evolution of Global Pageantry: A New Era Begins"
                    className="w-full bg-transparent border-b-2 border-zinc-700 py-3 text-2xl font-serif italic text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center justify-between">
                    <span>Web address <span className="font-normal normal-case tracking-normal text-zinc-500">— auto-filled from the title, edit only if needed</span></span>
                    <span className="text-amber-500/70 text-[10px] font-normal normal-case">⚠ changing this breaks old links</span>
                  </label>
                  <div className="flex bg-[#0A0A0A] border border-[#222222] p-3 text-xs font-mono text-zinc-300">
                    <span className="text-zinc-500 pr-2">/article/</span>
                    <input
                      type="text"
                      required
                      value={formData.url || ''}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="evolution-of-global-pageantry"
                      className="w-full bg-transparent text-orange-400 outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Short Content */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Short summary <span className="font-normal normal-case tracking-normal text-zinc-500">— 1–2 lines shown on cards &amp; previews</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.short_content || ''}
                    onChange={(e) => handleInputChange('short_content', e.target.value)}
                    placeholder="Brief 2-3 sentence article summary..."
                    className="w-full p-4 bg-[#0A0A0A] border border-[#222222] text-sm font-serif leading-relaxed text-zinc-300 outline-none focus:border-orange-500 transition"
                  />
                </div>

                {/* Full HTML Content */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Article Body
                    <span className="ml-2 font-normal normal-case tracking-normal text-zinc-500">— write like a document; use the toolbar to format</span>
                  </label>
                  <RichTextEditor
                    value={formData.content || ''}
                    onChange={(html) => handleInputChange('content', html)}
                  />
                </div>
              </div>

              {/* Sidebar Metadata & SEO Preview Sidebar */}
              <div className="space-y-6">
                {/* SEO Preview Box */}
                <div className="bg-zinc-950 text-white p-6 border border-[#222222]">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center text-zinc-300">
                    SEO Preview
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">Healthy</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Meta Title</p>
                      <p className="text-xs font-semibold text-zinc-200 mt-0.5">{formData.meta_title || formData.title || 'Untitled Article'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Meta Keywords</p>
                      <p className="text-xs italic underline decoration-zinc-700 underline-offset-4 text-orange-400 mt-0.5">{formData.meta_keyword || 'pageant, news, global'}</p>
                    </div>
                  </div>
                </div>

                {/* Ad Placement Zone Box */}
                <div className="bg-[#0A0A0A] border border-[#222222] p-6 relative overflow-hidden space-y-3">
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-2">Where ads appear</h3>
                  <div className="border-2 border-dashed border-zinc-800 rounded p-4 flex items-center justify-center min-h-[100px] text-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sidebar ad slot</span>
                  </div>
                </div>

                {/* Category & Status */}
                <div className="bg-[#0A0A0A] border border-[#222222] p-5 space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-2">
                    Category &amp; Publishing
                  </h3>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Category <span className="font-normal normal-case tracking-normal text-zinc-500">— which section this story belongs to</span></label>
                    <select
                      value={formData.category_id || 1}
                      onChange={(e) => {
                        handleInputChange('category_id', parseInt(e.target.value, 10));
                        handleInputChange('sub_category_id', 0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                    >
                      {categories.filter((c) => !c.parent_id).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category_name} (ID: {cat.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Sub-category <span className="font-normal normal-case tracking-normal text-zinc-500">— optional, more specific</span></label>
                    <select
                      value={formData.sub_category_id || 0}
                      onChange={(e) => handleInputChange('sub_category_id', parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                    >
                      <option value={0}>— None —</option>
                      {categories.filter((c) => c.parent_id === formData.category_id).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category_name} (ID: {cat.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">YouTube video link <span className="font-normal normal-case tracking-normal text-zinc-500">— optional</span></label>
                    <input
                      type="url"
                      value={(formData as any).youtube_video_link || ''}
                      onChange={(e) => handleInputChange('youtube_video_link' as keyof CIBlog, e.target.value)}
                      placeholder="https://youtube.com/watch?v=…"
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('status', 1)}
                        className={`p-2 text-xs font-bold uppercase tracking-wider transition ${
                          formData.status === 1 ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('status', 0)}
                        className={`p-2 text-xs font-bold uppercase tracking-wider transition ${
                          formData.status === 0 ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={!!formData.is_featured}
                        onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                        className="accent-orange-600"
                      />
                      <span>Featured Cover Story</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={!!formData.is_trending}
                        onChange={(e) => handleInputChange('is_trending', e.target.checked)}
                        className="accent-orange-600"
                      />
                      <span>Trending News Feed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA & ASSETS */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 p-6 border border-slate-800 rounded-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    Cover Image
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    The main picture shown on the article and on cards. Upload one from your computer, or pick from images already on the site.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Hidden native file picker driven by the button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePickFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-wait text-xs font-bold text-white rounded-lg transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading…' : 'Upload from computer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300 border border-slate-700 rounded-lg transition"
                  >
                    Choose existing
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Image location <span className="text-slate-500 normal-case font-normal">(auto-filled after upload)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.image || ''}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="Upload above, or paste an image link"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500 mb-4"
                  />

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Describe the image <span className="text-slate-500 normal-case font-normal">(helps Google &amp; screen readers)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alt_tag || ''}
                    onChange={(e) => handleInputChange('alt_tag', e.target.value)}
                    placeholder="e.g. Nidhi Netra holding the winner's trophy on stage"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    A short sentence saying what's in the picture. Shown if the image can't load, and read aloud to blind visitors.
                  </p>
                </div>

                {/* Image Live Preview Box */}
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/80 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 uppercase font-semibold mb-2">Preview</span>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt={formData.alt_tag || 'Preview'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback placeholder
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="text-slate-600 text-xs flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8 stroke-1" />
                        <span>No image yet — upload one above</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 font-mono truncate max-w-full">
                    alt="{formData.alt_tag || 'Empty Alt Tag'}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEO & META */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 p-6 border border-slate-800 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-rose-400" />
                  How this article looks on Google &amp; social media
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Optional. Leave blank and the site uses the title and summary automatically. Fill these in to control exactly what shows in search results and when the link is shared.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Standard Search Engine Meta */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-2">
                    Google search result
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Title on Google <span className="text-slate-500 font-normal">(blue clickable line)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title || ''}
                      onChange={(e) => handleInputChange('meta_title', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Keywords <span className="text-slate-500 font-normal">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.meta_keyword || ''}
                      onChange={(e) => handleInputChange('meta_keyword', e.target.value)}
                      placeholder="comma, separated, keywords"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description on Google <span className="text-slate-500 font-normal">(grey text under the title)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formData.meta_description || ''}
                      onChange={(e) => handleInputChange('meta_description', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Social OpenGraph Tags */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-2">
                    When shared on WhatsApp / Facebook
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Title when shared
                    </label>
                    <input
                      type="text"
                      value={formData.og_title || ''}
                      onChange={(e) => handleInputChange('og_title', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official link for this article <span className="text-slate-500 font-normal">(leave blank unless told)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.og_url || ''}
                      onChange={(e) => handleInputChange('og_url', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Picture when shared <span className="text-slate-500 font-normal">(auto-uses the cover image)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.og_image || ''}
                      onChange={(e) => handleInputChange('og_image', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description when shared
                    </label>
                    <textarea
                      rows={2}
                      value={formData.og_description || ''}
                      onChange={(e) => handleInputChange('og_description', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HEADING TAGS (H2 - H6) */}
        {activeTab === 'headings' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 p-6 border border-slate-800 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Heading className="w-4 h-4 text-rose-400" />
                  Extra Headings (optional)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Optional. The big main heading (H1) of the page is your <strong className="text-slate-200">Article Title</strong> — set it in the "Article" tab. Use the boxes below only if you also want extra sub-headings for search engines.
                </p>
              </div>

              {/* H1 = the article title, shown read-only so staff understand */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="w-28 px-3 py-1.5 bg-rose-950/60 text-rose-300 text-xs font-bold rounded-lg text-center border border-rose-800/50">
                  Main heading (H1)
                </span>
                <div className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm truncate">
                  {formData.title?.trim() ? formData.title : <span className="text-slate-500 italic">= your Article Title (set it in the Article tab)</span>}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'h2_tag', tag: 'H2', label: 'Sub-heading 1' },
                  { key: 'h3_tag', tag: 'H3', label: 'Sub-heading 2' },
                  { key: 'h4_tag', tag: 'H4', label: 'Sub-heading 3' },
                  { key: 'h5_tag', tag: 'H5', label: 'Sub-heading 4' },
                  { key: 'h6_tag', tag: 'H6', label: 'Sub-heading 5' },
                ].map(({ key, tag, label }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="w-40 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg text-center">
                      <span className="text-rose-300">{tag}</span> · {label}
                    </span>
                    <input
                      type="text"
                      value={(formData as any)[key] || ''}
                      onChange={(e) => handleInputChange(key as keyof CIBlog, e.target.value)}
                      placeholder="Leave blank if not needed"
                      className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Image Library Selector Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-400" />
                Select Image from Library
              </h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    handleInputChange('image', img.file_path);
                    handleInputChange('alt_tag', img.alt_tag);
                    handleInputChange('og_image', img.file_path);
                    setShowImagePicker(false);
                  }}
                  className="group relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 hover:border-rose-500 transition text-left"
                >
                  <img
                    src={img.file_path}
                    alt={img.alt_tag}
                    className="w-full h-24 object-cover group-hover:scale-105 transition"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="p-2 bg-slate-900/90 text-[10px] font-mono text-slate-300 truncate">
                    {img.file_name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogForm;
