import React, { useState, useEffect } from 'react';
import { 
  CIBlog, 
  CICategory, 
  CITag, 
  CIAdvertisement, 
  CIActivityLog, 
  CIUser, 
  CISubscriber, 
  CIImageLibrary, 
  CISetting, 
  ViewMode 
} from './types';

// Public Components
import PublicLayout from './components/PublicLayout';
import PublicHome from './components/PublicHome';
import PublicArticlePage from './components/PublicArticlePage';
import SEOManager from './components/SEOManager';

import { I18nProvider } from './lib/i18n';

// Admin Components
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import {
  AdminCredentials,
  loadAdminSession,
  saveAdminSession,
  clearAdminSession,
  adminHeaders,
} from './lib/adminAuth';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminBlogList from './components/admin/AdminBlogList';
import AdminBlogForm from './components/admin/AdminBlogForm';
import AdminCategories from './components/admin/AdminCategories';
import AdminAds from './components/admin/AdminAds';
import AdminActivityLogs from './components/admin/AdminActivityLogs';
import AdminImageLibrary from './components/admin/AdminImageLibrary';
import AdminSettings from './components/admin/AdminSettings';
import AdminSubscribers from './components/admin/AdminSubscribers';
import AdminUsers from './components/admin/AdminUsers';
import AdminChangePassword from './components/admin/AdminChangePassword';

export function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('public');
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null);
  // number = ci_category id, string = public nav slug (e.g. 'miss-india')
  const [activeCategory, setActiveCategory] = useState<number | string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [adminTab, setAdminTab] = useState<string>('Dashboard');
  const [adminAuth, setAdminAuth] = useState<AdminCredentials | null>(() => loadAdminSession());

  // Editing state for Admin Blog Form
  const [editingBlog, setEditingBlog] = useState<CIBlog | null>(null);
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);

  // Data Stores
  const [blogs, setBlogs] = useState<CIBlog[]>([]);
  const [categories, setCategories] = useState<CICategory[]>([]);
  const [tags, setTags] = useState<CITag[]>([]);
  const [ads, setAds] = useState<CIAdvertisement[]>([]);
  const [activityLogs, setActivityLogs] = useState<CIActivityLog[]>([]);
  const [users, setUsers] = useState<CIUser[]>([]);
  const [subscribers, setSubscribers] = useState<CISubscriber[]>([]);
  const [images, setImages] = useState<CIImageLibrary[]>([]);
  const [setting, setSetting] = useState<CISetting | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch initial data from REST API
  const fetchData = async () => {
    try {
      const [
        resBlogs,
        resCats,
        resTags,
        resAds,
        resLogs,
        resUsers,
        resSubs,
        resImgs,
        resSetting
      ] = await Promise.all([
        fetch('/api/blogs').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/tags').then(r => r.json()),
        fetch('/api/advertisements').then(r => r.json()),
        fetch('/api/activity-logs').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/subscribers').then(r => r.json()),
        fetch('/api/image-library').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);

      setBlogs(resBlogs);
      setCategories(resCats);
      setTags(resTags);
      setAds(resAds);
      setActivityLogs(resLogs);
      setUsers(resUsers);
      setSubscribers(resSubs);
      setImages(resImgs);
      setSetting(resSetting);
    } catch (err) {
      console.error('Failed to fetch REST API data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Direct admin entry via https://<host>/#admin — on load AND when the
    // hash is typed into an already-open page
    const checkHash = () => {
      if (window.location.hash === '#admin') setViewMode('admin');
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // --- ADMIN SESSION ---
  const handleAdminLogin = (creds: AdminCredentials) => {
    saveAdminSession(creds);
    setAdminAuth(creds);
    refreshAdminBlogs(creds);
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setAdminAuth(null);
    setViewMode('public');
    fetchData(); // back to the published-only list
  };

  /** Admin blog list includes drafts (status=all, auth required). */
  const refreshAdminBlogs = async (creds: AdminCredentials | null = adminAuth) => {
    if (!creds) return;
    try {
      const res = await fetch('/api/blogs?status=all', { headers: adminHeaders(creds) });
      if (res.ok) setBlogs(await res.json());
    } catch (err) {
      console.error('Failed to refresh admin blog list', err);
    }
  };

  const writeHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...adminHeaders(adminAuth),
  });

  const handleWriteError = async (res: Response) => {
    if (res.status === 401) {
      alert('Session expired or unauthorized — please sign in again.');
      handleAdminLogout();
      return true;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Request failed');
      return true;
    }
    return false;
  };

  // --- BLOG CRUD OPERATIONS (real ci_blog writes) ---
  const handleSaveBlog = async (formData: Partial<CIBlog>) => {
    setIsSavingBlog(true);
    try {
      const res = formData.id
        ? await fetch(`/api/blogs/${formData.id}`, {
            method: 'PUT',
            headers: writeHeaders(),
            body: JSON.stringify(formData),
          })
        : await fetch('/api/blogs', {
            method: 'POST',
            headers: writeHeaders(),
            body: JSON.stringify(formData),
          });

      if (await handleWriteError(res)) return;
      await refreshAdminBlogs();

      const resLogs = await fetch('/api/activity-logs').then(r => r.json());
      setActivityLogs(resLogs);

      setIsBlogFormOpen(false);
      setEditingBlog(null);
      setAdminTab('Blog');
    } catch (err) {
      alert('Error saving blog article');
      console.error(err);
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm(`Permanently delete article #${id} from the live ci_blog table?`)) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE', headers: writeHeaders() });
      if (await handleWriteError(res)) return;
      setBlogs(prev => prev.filter(b => b.id !== id));
      const resLogs = await fetch('/api/activity-logs').then(r => r.json());
      setActivityLogs(resLogs);
    } catch (err) {
      alert('Error deleting blog article');
    }
  };

  const handleBulkAction = async (ids: number[], action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} articles from the live ci_blog table?`)) return;
    try {
      const res = await fetch('/api/blogs/bulk-action', {
        method: 'POST',
        headers: writeHeaders(),
        body: JSON.stringify({ ids, action }),
      });
      if (await handleWriteError(res)) return;
      await refreshAdminBlogs();
    } catch (err) {
      alert('Bulk action failed');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: writeHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (await handleWriteError(res)) return;
      const updated = await res.json();
      setBlogs(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      console.error(err);
    }
  };

  // --- CATEGORY CRUD ---
  const handleSaveCategory = async (cat: Partial<CICategory>) => {
    try {
      if (cat.id) {
        const res = await fetch(`/api/categories/${cat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
        const updated = await res.json();
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
        const created = await res.json();
        setCategories(prev => [created, ...prev]);
      }
    } catch (err) {
      alert('Failed saving category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed deleting category');
    }
  };

  // --- ADVERTISEMENT CRUD ---
  const handleSaveAd = async (ad: Partial<CIAdvertisement>) => {
    try {
      const res = await fetch('/api/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad),
      });
      const created = await res.json();
      setAds(prev => [created, ...prev]);
    } catch (err) {
      alert('Failed saving ad');
    }
  };

  // --- IMAGE UPLOAD ---
  const handleUploadImage = async (img: Partial<CIImageLibrary>) => {
    try {
      const res = await fetch('/api/image-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(img),
      });
      const created = await res.json();
      setImages(prev => [created, ...prev]);
    } catch (err) {
      alert('Failed uploading image asset');
    }
  };

  // --- SETTINGS SAVE ---
  const handleSaveSetting = async (newSetting: Partial<CISetting>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      });
      const updated = await res.json();
      setSetting(updated);
    } catch (err) {
      alert('Failed saving settings');
    }
  };

  // --- SUBSCRIBE ---
  const handleSubscribe = async (email: string) => {
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resSubs = await fetch('/api/subscribers').then(r => r.json());
      setSubscribers(resSubs);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !setting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Loading Headless CodeIgniter REST Bridge...</p>
      </div>
    );
  }

  // RENDER ADMIN PANEL VIEW
  if (viewMode === 'admin') {
    if (!adminAuth) {
      return <AdminLogin onLogin={handleAdminLogin} onBackToSite={() => setViewMode('public')} />;
    }
    return (
      <AdminLayout
        currentTab={adminTab}
        onTabChange={(tab) => {
          setAdminTab(tab);
          setIsBlogFormOpen(false);
          setEditingBlog(null);
        }}
        onSwitchToPublic={() => {
          setViewMode('public');
          fetchData();
        }}
        adminName={adminAuth.name}
        onLogout={handleAdminLogout}
      >
        {isBlogFormOpen ? (
          <AdminBlogForm
            initialData={editingBlog}
            categories={categories}
            tags={tags}
            images={images}
            onSave={handleSaveBlog}
            onCancel={() => {
              setIsBlogFormOpen(false);
              setEditingBlog(null);
            }}
            isSaving={isSavingBlog}
          />
        ) : (
          <>
            {adminTab === 'Dashboard' && (
              <AdminDashboard
                blogs={blogs}
                categories={categories}
                ads={ads}
                activityLogs={activityLogs}
                onNavigate={(tab) => setAdminTab(tab)}
                onNewArticle={() => {
                  setEditingBlog(null);
                  setIsBlogFormOpen(true);
                }}
              />
            )}

            {adminTab === 'Blog' && (
              <AdminBlogList
                blogs={blogs}
                categories={categories}
                onNewBlog={() => {
                  setEditingBlog(null);
                  setIsBlogFormOpen(true);
                }}
                onEditBlog={(blog) => {
                  setEditingBlog(blog);
                  setIsBlogFormOpen(true);
                }}
                onViewArticleOnFrontend={(urlSlug) => {
                  setSelectedArticleUrl(urlSlug);
                  setViewMode('public');
                }}
                onDeleteBlog={handleDeleteBlog}
                onBulkAction={handleBulkAction}
                onToggleStatus={handleToggleStatus}
              />
            )}

            {adminTab === 'Category' && (
              <AdminCategories
                categories={categories}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {adminTab === 'Advertisement' && (
              <AdminAds
                ads={ads}
                onSaveAd={handleSaveAd}
              />
            )}

            {adminTab === 'Activity Log' && (
              <AdminActivityLogs activityLogs={activityLogs} />
            )}

            {adminTab === 'Image Library' && (
              <AdminImageLibrary
                images={images}
                onUploadImage={handleUploadImage}
              />
            )}

            {adminTab === 'Setting' && (
              <AdminSettings
                setting={setting}
                onSaveSetting={handleSaveSetting}
              />
            )}

            {adminTab === 'Subscribe' && (
              <AdminSubscribers subscribers={subscribers} />
            )}

            {adminTab === 'Users' && (
              <AdminUsers users={users} />
            )}

            {adminTab === 'Profile' && (
              <AdminChangePassword adminAuth={adminAuth} onPasswordChanged={setAdminAuth} />
            )}

            {(adminTab === 'Tag' || adminTab === 'Sub Admin') && (
              <div className="bg-white border border-[#E7E5E4] p-8 text-center space-y-3 shadow-xs">
                <h2 className="text-xl font-bold font-serif italic text-stone-900">{adminTab} Module</h2>
                <p className="text-xs text-stone-600 font-mono">
                  Module synchronized with CodeIgniter MySQL schema tables (<code className="text-[#991B1B]">ci_admin / ci_tags / ci_users</code>).
                </p>
              </div>
            )}
          </>
        )}
      </AdminLayout>
    );
  }

  // RENDER PUBLIC FRONTEND VIEW
  return (
    <I18nProvider>
    <PublicLayout
      categories={categories}
      ads={ads}
      setting={setting}
      blogs={blogs}
      activeCategory={activeCategory}
      onCategorySelect={(catId) => {
        setActiveCategory(catId);
        setSelectedArticleUrl(null);
      }}
      onSelectArticle={(urlSlug) => setSelectedArticleUrl(urlSlug)}
      onGoHome={() => {
        setSelectedArticleUrl(null);
        setActiveCategory('all');
      }}
      onSwitchToAdmin={() => setViewMode('admin')}
      onSubscribe={handleSubscribe}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
    >
      {!selectedArticleUrl && (
        <SEOManager
          siteName={setting?.site_title || "News Forever"}
          defaultTitle="News Forever | National & International News Portal"
          defaultDescription={setting?.site_description || "Latest breaking news, beauty pageant updates, Forever Star India Awards, products, astrology, and international editorial coverage."}
        />
      )}
      {selectedArticleUrl ? (
        <PublicArticlePage
          urlSlug={selectedArticleUrl}
          blogs={blogs}
          ads={ads}
          isLoading={loading}
          onGoBack={() => setSelectedArticleUrl(null)}
          onSelectArticle={(urlSlug) => setSelectedArticleUrl(urlSlug)}
        />
      ) : (
        <PublicHome
          blogs={blogs}
          ads={ads}
          categories={categories}
          tags={tags}
          activeCategory={activeCategory}
          dateFilter={dateFilter}
          isLoading={loading}
          onSelectArticle={(urlSlug) => setSelectedArticleUrl(urlSlug)}
          onCategorySelect={(catId) => setActiveCategory(catId)}
        />
      )}
    </PublicLayout>
    </I18nProvider>
  );
}

export default App;
