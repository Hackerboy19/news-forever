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
import SEOManager, { DEFAULT_TITLE, DEFAULT_DESCRIPTION } from './components/SEOManager';
import LegalPage, { LEGAL_SLUGS, type LegalSlug } from './components/LegalPage';

import { I18nProvider } from './lib/i18n';
import { DEMO_ADS, isDemoAd } from './data/demoAds';

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
import AdminSeoPanel from './components/admin/AdminSeoPanel';
import AdminSiteSettings, { SiteConfigValues } from './components/admin/AdminSiteSettings';

/**
 * Map the browser path to an article slug so old/indexed URLs deep-link.
 * Legacy article URLs are a single top-level segment (e.g. /my-article-slug).
 * Reserved first segments are not articles.
 */
const RESERVED_PATHS = new Set(['', 'admin', 'category', 'api', 'assets', 'uploads', 'report.html', 'favicon.ico', 'sitemap.xml', 'robots.txt', 'rss.xml', 'feed.rss', ...LEGAL_SLUGS]);
/**
 * The public category slug for the current path, if any.
 *
 * `/category/<slug>` URLs are already indexed and are linked from the header,
 * the footer and the category rails, but nothing parsed them: the path was
 * only ever treated as "not an article", so every one of them rendered the
 * unfiltered homepage. Reading the slug here makes those links resolve to the
 * section they name, and makes the filtered view shareable.
 */
function categoryFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const parts = decodeURIComponent(window.location.pathname)
    .replace(/^\/+|\/+$/g, '')
    .split('/');
  if (parts[0] !== 'category' || !parts[1]) return null;
  return parts[1].toLowerCase();
}

/** The static legal route for the current path, if any. */
function legalFromPath(): LegalSlug | null {
  if (typeof window === 'undefined') return null;
  const path = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
  return (LEGAL_SLUGS as string[]).includes(path) ? (path as LegalSlug) : null;
}
function slugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
  if (!path) return null;
  if (RESERVED_PATHS.has(path.split('/')[0])) return null;
  return path;
}
function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#admin' || window.location.pathname.replace(/\/+$/, '') === '/admin';
}

export function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>(() => (isAdminPath() ? 'admin' : 'public'));
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(() => slugFromPath());
  const [legalSlug, setLegalSlug] = useState<LegalSlug | null>(() => legalFromPath());
  // number = ci_category id, string = public nav slug (e.g. 'miss-india')
  const [activeCategory, setActiveCategory] = useState<number | string | 'all'>(
    () => categoryFromPath() ?? 'all'
  );
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
  /**
   * Ads for the admin manager: every row from ci_advertisement regardless of
   * status, and no demo placeholders. `ads` above is the public list — it is
   * filtered to status = 1 and has DEMO_ADS appended for the front-end, and
   * demo entries are deliberately not editable, so rendering the manager from
   * it meant a site with no active ads showed nothing but uneditable samples.
   */
  const [adminAds, setAdminAds] = useState<CIAdvertisement[]>([]);
  const [activityLogs, setActivityLogs] = useState<CIActivityLog[]>([]);
  const [users, setUsers] = useState<CIUser[]>([]);
  const [subscribers, setSubscribers] = useState<CISubscriber[]>([]);
  const [images, setImages] = useState<CIImageLibrary[]>([]);
  const [setting, setSetting] = useState<CISetting | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfigValues>({});

  // Loading state
  const [loading, setLoading] = useState(true);

  /**
   * Public data only. The subscriber list, admin accounts, activity log and
   * image library are NOT fetched here — they are personal/staff data and the
   * API now rejects them without ci_admin credentials. Fetching them on the
   * public homepage would have leaked the mailing list to every visitor.
   */
  const fetchData = async () => {
    try {
      const [resBlogs, resCats, resTags, resAds, resSetting] = await Promise.all([
        fetch('/api/blogs').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/tags').then(r => r.json()),
        fetch('/api/advertisements').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);

      setBlogs(resBlogs);
      setCategories(resCats);
      setTags(resTags);
      setAds([...(Array.isArray(resAds) ? resAds : []), ...DEMO_ADS]);
      setSetting(resSetting);
      fetch('/api/site-config').then(r => r.ok ? r.json() : {}).then(setSiteConfig).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch REST API data', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin-only collections, loaded lazily once a ci_admin session exists and
   * always sent with credentials. A 401 simply leaves the list empty.
   */
  const fetchAdminData = async (creds: AdminCredentials | null = adminAuth) => {
    if (!creds) {
      setActivityLogs([]);
      setUsers([]);
      setSubscribers([]);
      setImages([]);
      return;
    }
    const headers = adminHeaders(creds);
    const load = async (path: string) => {
      try {
        const res = await fetch(path, { headers });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      } catch {
        return [];
      }
    };
    const [logs, users, subs, imgs, allAds] = await Promise.all([
      load('/api/activity-logs'),
      load('/api/users'),
      load('/api/subscribers'),
      load('/api/image-library'),
      load('/api/advertisements?status=all'),
    ]);
    setActivityLogs(logs);
    setUsers(users);
    setSubscribers(subs);
    setImages(imgs);
    setAdminAds(allAds);
  };

  useEffect(() => {
    fetchData();
    // Admin entry via /#admin or /admin — on load AND when typed/navigated.
    // Article deep-linking: keep the article in sync with the browser URL so
    // old/indexed links open the article and Back/Forward work.
    const syncFromUrl = () => {
      if (isAdminPath()) { setViewMode('admin'); return; }
      setViewMode('public');
      setSelectedArticleUrl(slugFromPath());
      setLegalSlug(legalFromPath());
      setActiveCategory(categoryFromPath() ?? 'all');
    };
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  // Admin collections follow the session: loaded on login, cleared on logout.
  useEffect(() => {
    fetchAdminData(adminAuth);
  }, [adminAuth]);

  // Open an article and reflect it in the URL (shareable / refreshable / SEO).
  const openArticle = (urlSlug: string) => {
    setLegalSlug(null);
    setSelectedArticleUrl(urlSlug);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/' + urlSlug.replace(/^\/+/, ''));
      window.scrollTo(0, 0);
    }
  };
  // Return to the homepage and reset the URL to "/".
  const goHomeNav = () => {
    setSelectedArticleUrl(null);
    setLegalSlug(null);
    setActiveCategory('all');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo(0, 0);
    }
  };

  // Open a static legal page (/privacy-policy, /terms-of-service, /disclaimer).
  const openLegal = (slug: LegalSlug) => {
    setSelectedArticleUrl(null);
    setLegalSlug(slug);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/' + slug);
      window.scrollTo(0, 0);
    }
  };

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
      alert(body.error || 'Something went wrong. Please check your internet and try again — your work is not lost.');
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

      const resLogs = await fetch('/api/activity-logs', { headers: adminHeaders(adminAuth) })
        .then(r => (r.ok ? r.json() : []));
      setActivityLogs(Array.isArray(resLogs) ? resLogs : []);

      setIsBlogFormOpen(false);
      setEditingBlog(null);
      setAdminTab('Blog');
    } catch (err) {
      alert('Could not save the article. Please try again — your text is still on screen.');
      console.error(err);
    } finally {
      setIsSavingBlog(false);
    }
  };

  /** Save site appearance/navigation config (DB-persisted). */
  const handleSaveSiteConfig = async (cfg: SiteConfigValues): Promise<boolean> => {
    try {
      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: writeHeaders(),
        body: JSON.stringify(cfg),
      });
      if (await handleWriteError(res)) return false;
      setSiteConfig(await res.json());
      return true;
    } catch {
      return false;
    }
  };

  /** Upload an image via the bridge; returns the stored assets path. */
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: writeHeaders(),
        body: JSON.stringify({ folder: 'blog', filename: file.name, data: base64 }),
      });
      if (await handleWriteError(res)) return null;
      const { path } = await res.json();
      return path || null;
    } catch {
      alert('Could not upload that image. Use a JPG, PNG or WebP under 8 MB and try again.');
      return null;
    }
  };

  /** SEO workbench: PUT only the metadata fields, refresh the list in place. */
  const handleSeoQuickSave = async (id: number, fields: Partial<CIBlog>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: writeHeaders(),
        body: JSON.stringify(fields),
      });
      if (await handleWriteError(res)) return false;
      const updated = await res.json();
      setBlogs(prev => prev.map(b => (b.id === id ? { ...b, ...updated } : b)));
      return true;
    } catch {
      alert('Could not save the search / SEO details. Please try again.');
      return false;
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm(`Permanently delete article #${id} from the live ci_blog table?`)) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE', headers: writeHeaders() });
      if (await handleWriteError(res)) return;
      setBlogs(prev => prev.filter(b => b.id !== id));
      const resLogs = await fetch('/api/activity-logs', { headers: adminHeaders(adminAuth) })
        .then(r => (r.ok ? r.json() : []));
      setActivityLogs(Array.isArray(resLogs) ? resLogs : []);
    } catch (err) {
      alert('Could not delete the article. Please try again.');
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
      alert('Could not complete that action on the selected articles. Please try again.');
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

  // --- CATEGORY CRUD (real ci_category writes) ---
  const handleSaveCategory = async (cat: Partial<CICategory>) => {
    try {
      const res = cat.id
        ? await fetch(`/api/categories/${cat.id}`, { method: 'PUT', headers: writeHeaders(), body: JSON.stringify(cat) })
        : await fetch('/api/categories', { method: 'POST', headers: writeHeaders(), body: JSON.stringify(cat) });
      if (await handleWriteError(res)) return;
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
      else {
        const resCats = await fetch('/api/categories').then(r => r.json());
        setCategories(resCats);
      }
    } catch (err) {
      alert('Could not save the category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Permanently delete this category from the live ci_category table?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: writeHeaders() });
      if (await handleWriteError(res)) return;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Could not delete the category. Please try again.');
    }
  };

  // --- ADVERTISEMENT CRUD (real ci_advertisement writes + image upload) ---
  const handleSaveAd = async (ad: Partial<CIAdvertisement> & { image_file?: { filename: string; data: string } }) => {
    try {
      let payload: Partial<CIAdvertisement> = { ...ad };
      // Upload the image file first (stored on the live server via the bridge)
      if (ad.image_file) {
        const up = await fetch('/api/upload-image', {
          method: 'POST',
          headers: writeHeaders(),
          body: JSON.stringify({
            folder: 'advertisement',
            filename: ad.image_file.filename,
            data: ad.image_file.data,
            alt: ad.alt_tag,
          }),
        });
        if (await handleWriteError(up)) return;
        const { path } = await up.json();
        payload = { ...payload, advertisement_image: path };
      }
      delete (payload as any).image_file;

      const res = await fetch('/api/advertisements', {
        method: 'POST',
        headers: writeHeaders(),
        body: JSON.stringify(payload),
      });
      if (await handleWriteError(res)) return;
      await refreshAds();
    } catch (err) {
      alert('Could not save the ad. Please try again.');
    }
  };

  /**
   * Re-read both ad lists after a write.
   *
   * They are genuinely different queries — the public one is active-only with
   * the demo placeholders appended, the admin one is every row and no demos —
   * so refreshing only the public list left the manager showing stale rows
   * (and, for a newly deactivated ad, a row that had silently vanished).
   */
  const refreshAds = async (creds: AdminCredentials | null = adminAuth) => {
    try {
      const publicAdsRes = await fetch('/api/advertisements').then(r => (r.ok ? r.json() : []));
      setAds([...(Array.isArray(publicAdsRes) ? publicAdsRes : []), ...DEMO_ADS]);
    } catch {
      /* leave the current public list in place */
    }
    if (!creds) return;
    try {
      const res = await fetch('/api/advertisements?status=all', { headers: adminHeaders(creds) });
      if (!res.ok) return;
      const json = await res.json();
      setAdminAds(Array.isArray(json) ? json : []);
    } catch {
      /* leave the current admin list in place */
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm('Permanently delete this advertisement from the live ci_advertisement table?')) return;
    try {
      const res = await fetch(`/api/advertisements/${id}`, { method: 'DELETE', headers: writeHeaders() });
      if (await handleWriteError(res)) return;
      setAdminAds(prev => prev.filter(a => a.id !== id));
      await refreshAds();
    } catch (err) {
      alert('Could not delete the ad. Please try again.');
    }
  };

  // --- IMAGE UPLOAD ---
  const handleUploadImage = async (img: Partial<CIImageLibrary>) => {
    try {
      const res = await fetch('/api/image-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders(adminAuth) },
        body: JSON.stringify(img),
      });
      const created = await res.json();
      setImages(prev => [created, ...prev]);
    } catch (err) {
      alert('Could not upload the image. Please try again.');
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
      alert('Could not save the settings. Please try again.');
    }
  };

  // --- SUBSCRIBE ---
  // Public visitors POST their own address and get nothing back but a status.
  // The list is only re-read when an admin is signed in (see fetchAdminData);
  // a visitor must never be able to pull the mailing list down to the browser.
  const handleSubscribe = async (email: string) => {
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (adminAuth) await fetchAdminData(adminAuth);
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
            onUploadImage={handleImageUpload}
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
                ads={adminAds}
                onSaveAd={handleSaveAd}
                onDeleteAd={handleDeleteAd}
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
              <AdminSiteSettings
                config={siteConfig}
                categories={categories}
                onSave={handleSaveSiteConfig}
                onUploadImage={handleImageUpload}
              />
            )}

            {adminTab === 'Subscribe' && (
              <AdminSubscribers subscribers={subscribers} />
            )}

            {adminTab === 'Users' && (
              <AdminUsers users={users} />
            )}

            {adminTab === 'SEO' && (
              <AdminSeoPanel blogs={blogs} onQuickSave={handleSeoQuickSave} onUploadImage={handleImageUpload} />
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

  // Public site shows the dummy brand campaigns (demo) in place of the
  // real ad slots; the admin panel keeps the full real+demo list.
  const demoAds = ads.filter(isDemoAd);
  const publicAds = demoAds.length > 0 ? demoAds : ads;

  // RENDER PUBLIC FRONTEND VIEW
  return (
    <I18nProvider>
    <PublicLayout
      categories={categories}
      setting={setting}
      blogs={blogs}
      activeCategory={activeCategory}
      onCategorySelect={(catId) => {
        setActiveCategory(catId);
        setSelectedArticleUrl(null);
        setLegalSlug(null);
        if (typeof window === 'undefined') return;
        // Keep the address bar in step with the filter so the view is
        // shareable. Public nav slugs are strings and map to a real
        // /category/<slug> URL; a bare ci_category id has no public slug, so
        // those fall back to "/" as before.
        const next = typeof catId === 'string' && catId !== 'all' ? `/category/${catId}` : '/';
        if (window.location.pathname !== next) window.history.pushState({}, '', next);
      }}
      onSelectArticle={openArticle}
      onGoHome={goHomeNav}
      onSwitchToAdmin={() => setViewMode('admin')}
      onOpenLegal={openLegal}
      onSubscribe={handleSubscribe}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      siteConfig={siteConfig}
      ads={publicAds}
    >
      {!selectedArticleUrl && !legalSlug && (
        <SEOManager
          siteName={setting?.site_title || "News Forever"}
          defaultTitle={DEFAULT_TITLE}
          defaultDescription={setting?.site_description || DEFAULT_DESCRIPTION}
        />
      )}
      {legalSlug ? (
        <LegalPage slug={legalSlug} onGoHome={goHomeNav} />
      ) : selectedArticleUrl ? (
        <PublicArticlePage
          urlSlug={selectedArticleUrl}
          blogs={blogs}
          ads={publicAds}
          isLoading={loading}
          onGoBack={goHomeNav}
          onSelectArticle={openArticle}
        />
      ) : (
        <PublicHome
          blogs={blogs}
          ads={publicAds}
          categories={categories}
          tags={tags}
          activeCategory={activeCategory}
          dateFilter={dateFilter}
          isLoading={loading}
          onSelectArticle={openArticle}
          onCategorySelect={(catId) => setActiveCategory(catId)}
        />
      )}
    </PublicLayout>
    </I18nProvider>
  );
}

export default App;
