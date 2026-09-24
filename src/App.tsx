import React, { useState, useEffect, useRef } from 'react';
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
import StaticPage from './components/StaticPage';
import LegalPage, { LEGAL_SLUGS, type LegalSlug } from './components/LegalPage';
import SEOManager from './components/SEOManager';

import { I18nProvider } from './lib/i18n';
import { DEMO_ADS, isDemoAd } from './data/demoAds';
import { siteSetting } from './data/siteConfig';
import { resolveAssetUrl } from './lib/assets';

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
import AdminTags from './components/admin/AdminTags';
import AdminChangePassword from './components/admin/AdminChangePassword';
import AdminSeoPanel from './components/admin/AdminSeoPanel';
import AdminSiteSettings, { SiteConfigValues } from './components/admin/AdminSiteSettings';
import AdminPages from './components/admin/AdminPages';

/**
 * Map the browser path to an article slug so old/indexed URLs deep-link.
 * Legacy article URLs are a single top-level segment (e.g. /my-article-slug).
 * Reserved first segments are not articles.
 */
const RESERVED_PATHS = new Set(['', 'admin', 'category', 'tag', 'api', 'assets', 'uploads', 'report.html', 'favicon.ico', 'sitemap.xml', 'robots.txt', 'rss.xml', 'feed.rss',
  // Legacy landing path that renders the homepage latest feed (not an article).
  'latest-news']);

/** The single-segment path slug (about-us, privacy-policy, an article slug…), or null. */
function pathSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const p = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
  if (!p || p.includes('/')) return null;
  if (RESERVED_PATHS.has(p.toLowerCase())) return null;
  return p;
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
/** If the path is /category/<slug>, return the slug; else null. */
function categorySlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const p = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
  if (!p.toLowerCase().startsWith('category/')) return null;
  return p.slice('category/'.length).split('/')[0] || null;
}
/** If the path is /tag/<slug>, return the slug; else null. */
function tagSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const p = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
  if (!p.toLowerCase().startsWith('tag/')) return null;
  return p.slice('tag/'.length).split('/')[0] || null;
}

export function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>(() => (isAdminPath() ? 'admin' : 'public'));
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(() => slugFromPath());
  const [activeTag, setActiveTag] = useState<string | null>(() => tagSlugFromPath());
  // Articles for the active tag — fetched from the server so ALL tagged
  // articles show (not just those in the latest-200 list), covering duplicate
  // tag-slug rows too.
  const [tagBlogs, setTagBlogs] = useState<CIBlog[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  // Admin-created static pages (routing + which slug is currently open).
  const [staticPages, setStaticPages] = useState<{ slug: string; title: string }[]>([
    { slug: 'about-us', title: 'About Us' },
    { slug: 'contact-us', title: 'Contact Us' },
  ]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(() => pathSlug());
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
  const [subAdmins, setSubAdmins] = useState<CIUser[]>([]);
  const [subscribers, setSubscribers] = useState<CISubscriber[]>([]);
  const [images, setImages] = useState<CIImageLibrary[]>([]);
  // Start with the built-in default so the site renders instantly (no blank
  // screen); the real ci_setting row replaces it once the API responds.
  const [setting, setSetting] = useState<CISetting>(siteSetting);
  const [siteConfig, setSiteConfig] = useState<SiteConfigValues>({});

  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch initial data from REST API.
  //
  // Public only. The subscriber list, the ci_admin accounts, the activity log
  // and the image library used to be fetched here too — on every homepage
  // load, by every visitor, with no credentials. That made a newsletter list
  // and a roster of admin usernames readable by anyone who opened the network
  // tab. Those four now live in fetchAdminData below, behind the session.
  const fetchData = async () => {
    try {
      const [
        resBlogs,
        resCats,
        resTags,
        resAds,
        resSetting
      ] = await Promise.all([
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
      setSetting(resSetting && typeof resSetting === 'object' ? { ...siteSetting, ...resSetting } : siteSetting);
      fetch('/api/site-config').then(r => r.ok ? r.json() : {}).then(setSiteConfig).catch(() => {});
      fetch('/api/pages').then(r => r.ok ? r.json() : []).then((d) => { if (Array.isArray(d) && d.length) setStaticPages(d); }).catch(() => {}).finally(() => setPagesLoaded(true));
    } catch (err) {
      console.error('Failed to fetch REST API data', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin-only collections, sent with the session credentials.
   *
   * Called when a session starts and cleared when it ends, so a logged-out
   * browser never holds this data and never asks the server for it.
   */
  const fetchAdminData = async (creds: AdminCredentials | null) => {
    if (!creds) {
      setActivityLogs([]);
      setUsers([]);
      setSubscribers([]);
      setImages([]);
      setSubAdmins([]);
      return;
    }
    const headers = adminHeaders(creds);
    const get = (url: string) => fetch(url, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null);
    const [resLogs, resUsers, resSubs, resImgs, resSubAdmins] = await Promise.all([
      get('/api/activity-logs'),
      get('/api/users'),
      get('/api/subscribers'),
      get('/api/image-library'),
      get('/api/sub-admins'),
    ]);
    if (Array.isArray(resLogs)) setActivityLogs(resLogs);
    if (Array.isArray(resUsers)) setUsers(resUsers);
    if (Array.isArray(resSubs)) setSubscribers(resSubs);
    if (Array.isArray(resImgs)) setImages(resImgs);
    if (Array.isArray(resSubAdmins)) setSubAdmins(resSubAdmins);
  };

  useEffect(() => {
    fetchData();
    // Admin entry via /#admin or /admin — on load AND when typed/navigated.
    // Article deep-linking: keep the article in sync with the browser URL so
    // old/indexed links open the article and Back/Forward work.
    const syncFromUrl = () => {
      if (isAdminPath()) { setViewMode('admin'); return; }
      // (tag fetch handled by its own effect below)
      setViewMode('public');
      setCurrentSlug(pathSlug());
      const tg = tagSlugFromPath();
      if (tg) { setSelectedArticleUrl(null); setActiveCategory('all'); setActiveTag(tg); return; }
      setActiveTag(null);
      if (categorySlugFromPath()) { applyCategoryFromUrl(); return; }
      setActiveCategory('all');
      setSelectedArticleUrl(slugFromPath());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAuth]);

  // Fetch every article for the active tag from the server (covers old articles
  // + duplicate-slug tag ids). Runs whenever the active tag changes.
  useEffect(() => {
    if (!activeTag) { setTagBlogs([]); return; }
    let cancelled = false;
    setTagLoading(true);
    fetch(`/api/blogs?tag_slug=${encodeURIComponent(activeTag)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!cancelled) setTagBlogs(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setTagBlogs([]); })
      .finally(() => { if (!cancelled) setTagLoading(false); });
    return () => { cancelled = true; };
  }, [activeTag]);

  // Google Tag Manager: fire a virtual page_view on every SPA navigation so
  // GTM/GA4 records route changes (a plain SPA only fires once on load).
  useEffect(() => {
    const page_path = window.location.pathname + window.location.search;
    const page_location = window.location.href;
    const page_title = document.title;
    const dl = (window as any).dataLayer;
    if (dl) dl.push({ event: 'page_view', page_path, page_location, page_title });
    // Direct GA4 (gtag.js) too, in case GA4 is not configured inside the GTM container.
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', { page_path, page_location, page_title });
    }
  }, [selectedArticleUrl, activeCategory, activeTag, viewMode]);

  // Open an article and reflect it in the URL (shareable / refreshable / SEO).
  const openArticle = (urlSlug: string) => {
    setSelectedArticleUrl(urlSlug);
    setActiveTag(null);
    setCurrentSlug(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/' + urlSlug.replace(/^\/+/, ''));
      window.scrollTo(0, 0);
    }
  };
  // Open a tag page and reflect it in the URL: /tag/<slug>.
  const openTag = (slug: string) => {
    setSelectedArticleUrl(null);
    setActiveCategory('all');
    setActiveTag(slug);
    setCurrentSlug(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/tag/' + encodeURIComponent(slug));
      window.scrollTo(0, 0);
    }
  };
  // Build the URL slug for a category value (numeric ci_category id or nav slug).
  const categoryUrlSlug = (catId: number | string): string => {
    if (typeof catId === 'string') return catId;
    const c = categories.find((x) => x.id === catId);
    return (c?.slug || String(catId)).trim();
  };
  // Open a category page and reflect it in the URL: /category/<slug>.
  const openCategory = (catId: number | string) => {
    setSelectedArticleUrl(null);
    setActiveTag(null);
    setActiveCategory(catId);
    setCurrentSlug(null);
    if (typeof window !== 'undefined' && catId !== 'all') {
      window.history.pushState({}, '', '/category/' + encodeURIComponent(categoryUrlSlug(catId)));
      window.scrollTo(0, 0);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo(0, 0);
    }
  };
  // Return to the homepage and reset the URL to "/".
  const goHomeNav = () => {
    setSelectedArticleUrl(null);
    setActiveCategory('all');
    setActiveTag(null);
    setCurrentSlug(null); // leave any static (about/contact/custom) page
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo(0, 0);
    }
  };

  // Resolve /category/<slug> to an activeCategory once categories are loaded
  // (and on Back/Forward), so category URLs deep-link and refresh correctly.
  // categoriesRef keeps the resolver fresh inside the mount-time listener.
  const categoriesRef = useRef<CICategory[]>(categories);
  categoriesRef.current = categories;
  const applyCategoryFromUrl = () => {
    const slug = categorySlugFromPath();
    if (!slug) return;
    const match = categoriesRef.current.find((c) => (c.slug || '').toLowerCase() === slug.toLowerCase());
    setSelectedArticleUrl(null);
    setActiveCategory(match ? match.id : slug); // fall back to treating it as a public nav slug
  };
  useEffect(() => {
    if (categories.length) applyCategoryFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

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

  // --- Generic admin CRUD (tags, users, sub-admins, subscribers, images) ---
  const crudWrite = async (url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any): Promise<boolean> => {
    try {
      const res = await fetch(url, { method, headers: writeHeaders(), body: body ? JSON.stringify(body) : undefined });
      if (await handleWriteError(res)) return false;
      return true;
    } catch { alert('Network error. Try again.'); return false; }
  };
  const refetch = (url: string, setter: (d: any) => void) =>
    fetch(url, { headers: adminHeaders(adminAuth) }).then(r => r.ok ? r.json() : null).then(d => { if (d) setter(d); }).catch(() => {});

  // Tags
  const handleTagSave = async (t: { id?: number; tag_name: string; slug?: string; status?: number }) => {
    const ok = t.id ? await crudWrite(`/api/tags/${t.id}`, 'PUT', t) : await crudWrite('/api/tags', 'POST', t);
    if (ok) refetch('/api/tags', setTags);
    return ok;
  };
  const handleTagDelete = async (id: number) => { const ok = await crudWrite(`/api/tags/${id}`, 'DELETE'); if (ok) refetch('/api/tags', setTags); return ok; };

  // Admin users (ci_admin)
  const handleUserSave = async (u: any) => {
    const ok = u.id ? await crudWrite(`/api/users/${u.id}`, 'PUT', u) : await crudWrite('/api/users', 'POST', u);
    if (ok) refetch('/api/users', setUsers);
    return ok;
  };
  const handleUserDelete = async (id: number) => { const ok = await crudWrite(`/api/users/${id}`, 'DELETE'); if (ok) refetch('/api/users', setUsers); return ok; };

  // Sub-admins (ci_subadmin)
  const handleSubAdminSave = async (u: any) => {
    const ok = u.id ? await crudWrite(`/api/sub-admins/${u.id}`, 'PUT', u) : await crudWrite('/api/sub-admins', 'POST', u);
    if (ok) refetch('/api/sub-admins', setSubAdmins);
    return ok;
  };
  const handleSubAdminDelete = async (id: number) => { const ok = await crudWrite(`/api/sub-admins/${id}`, 'DELETE'); if (ok) refetch('/api/sub-admins', setSubAdmins); return ok; };

  // Subscribers + images (delete only)
  const handleSubscriberDelete = async (id: number) => { const ok = await crudWrite(`/api/subscribers/${id}`, 'DELETE'); if (ok) refetch('/api/subscribers', setSubscribers); return ok; };
  const handleSubscriberBulkDelete = async (ids: number[]) => { const ok = await crudWrite('/api/subscribers/bulk-delete', 'POST', { ids }); if (ok) refetch('/api/subscribers', setSubscribers); return ok; };
  const handleImageDelete = async (id: number) => { const ok = await crudWrite(`/api/image-library/${id}`, 'DELETE'); if (ok) refetch('/api/image-library', setImages); return ok; };

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
      const data = await res.json();
      if (Array.isArray(data)) setAds(data);
      else {
        const resAds = await fetch('/api/advertisements').then(r => r.json());
        setAds([...(Array.isArray(resAds) ? resAds : []), ...DEMO_ADS]);
      }
    } catch (err) {
      alert('Could not save the ad. Please try again.');
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm('Permanently delete this advertisement from the live ci_advertisement table?')) return;
    try {
      const res = await fetch(`/api/advertisements/${id}`, { method: 'DELETE', headers: writeHeaders() });
      if (await handleWriteError(res)) return;
      setAds(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Could not delete the ad. Please try again.');
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
  const handleSubscribe = async (email: string) => {
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // No re-fetch here: a reader subscribing must not pull down the whole
      // subscriber list. The admin panel loads it with credentials instead.
    } catch (err) {
      console.error(err);
    }
  };

  // No blocking loading screen — the site renders immediately and each
  // section shows its own lightweight skeleton while data arrives. The admin
  // login still needs the base data, so gate only the admin view.
  if ((loading || !setting) && viewMode === 'admin' && !adminAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
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
                  // Open the real public URL (plain slug, matches sitemap) in a new tab.
                  window.open('/' + encodeURIComponent(String(urlSlug).trim()), '_blank', 'noopener');
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
                onDelete={handleImageDelete}
              />
            )}

            {adminTab === 'Pages' && (
              <AdminPages
                onList={async () => {
                  const r = await fetch('/api/pages');
                  return r.ok ? r.json() : [];
                }}
                onLoad={async (slug) => {
                  const r = await fetch(`/api/pages/${slug}`);
                  return r.ok ? r.json() : {};
                }}
                onSave={async (slug, data) => {
                  try {
                    const r = await fetch(`/api/pages/${slug}`, {
                      method: 'PUT',
                      headers: writeHeaders(),
                      body: JSON.stringify(data),
                    });
                    if (await handleWriteError(r)) return false;
                    fetch('/api/pages').then(x => x.ok ? x.json() : []).then((d) => { if (Array.isArray(d) && d.length) setStaticPages(d); }).catch(() => {});
                    return true;
                  } catch { return false; }
                }}
                onDelete={async (slug) => {
                  try {
                    const r = await fetch(`/api/pages/${slug}`, { method: 'DELETE', headers: writeHeaders() });
                    if (await handleWriteError(r)) return false;
                    fetch('/api/pages').then(x => x.ok ? x.json() : []).then((d) => { if (Array.isArray(d) && d.length) setStaticPages(d); }).catch(() => {});
                    return true;
                  } catch { return false; }
                }}
                onUploadImage={handleImageUpload}
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
              <AdminSubscribers subscribers={subscribers} onDelete={handleSubscriberDelete} onBulkDelete={handleSubscriberBulkDelete} />
            )}

            {adminTab === 'Users' && (
              <AdminUsers users={users} kind="Admin" onSave={handleUserSave} onDelete={handleUserDelete} currentAdminId={adminAuth?.admin_id} />
            )}

            {adminTab === 'SEO' && (
              <AdminSeoPanel blogs={blogs} onQuickSave={handleSeoQuickSave} onUploadImage={handleImageUpload} />
            )}

            {adminTab === 'Profile' && (
              <AdminChangePassword adminAuth={adminAuth} onPasswordChanged={setAdminAuth} />
            )}

            {adminTab === 'Tag' && (
              <AdminTags tags={tags} blogs={blogs} onSave={handleTagSave} onDelete={handleTagDelete} />
            )}
            {adminTab === 'Sub Admin' && (
              <AdminUsers users={subAdmins} kind="Sub Admin" onSave={handleSubAdminSave} onDelete={handleSubAdminDelete} />
            )}
          </>
        )}
      </AdminLayout>
    );
  }

  // Public site shows the dummy brand campaigns (demo) in place of the
  // real ad slots; the admin panel keeps the full real+demo list.
  // Public site shows the REAL ads from the admin panel. Demo banners appear
  // only as a fallback when no real ads exist yet.
  const realAds = ads.filter((a) => !isDemoAd(a));
  // Public site shows ONLY real ads — no demo/sample fallback. No real ad = no ad.
  const publicAds = realAds;

  // RENDER PUBLIC FRONTEND VIEW
  return (
    <I18nProvider>
    <PublicLayout
      categories={categories}
      setting={setting}
      blogs={blogs}
      activeCategory={activeCategory}
      onCategorySelect={openCategory}
      onSelectArticle={openArticle}
      onGoHome={goHomeNav}
      onSwitchToAdmin={() => setViewMode('admin')}
      onSubscribe={handleSubscribe}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      siteConfig={siteConfig}
      ads={publicAds}
    >
      {!selectedArticleUrl && (
        <SEOManager
          siteName={setting?.site_title || "News Forever"}
          defaultTitle={siteConfig.siteTitle || setting?.meta_default_title || "News Forever | National & International News Portal"}
          meta_description={siteConfig.siteDescription || setting?.meta_default_description || "Latest breaking news, beauty pageant updates, Forever Star India Awards, products, astrology, and international editorial coverage."}
          meta_keyword={siteConfig.siteKeywords || setting?.meta_default_keywords}
          og_image={siteConfig.ogImage ? resolveAssetUrl(siteConfig.ogImage) : undefined}
        />
      )}
      {(() => {
        const pageMatch = currentSlug ? staticPages.find(p => p.slug.toLowerCase() === currentSlug.toLowerCase()) : null;
        if (pageMatch) {
          return <StaticPage page={pageMatch.slug} setting={setting} siteConfig={siteConfig} onGoHome={goHomeNav} />;
        }
        // Built-in copy for the three legal routes the footer links to, so
        // they are never dead. An admin-created page of the same slug wins
        // (handled above), which is how this gets replaced with real,
        // counsel-reviewed text without a deploy.
        if (currentSlug && (LEGAL_SLUGS as readonly string[]).includes(currentSlug.toLowerCase())) {
          return <LegalPage slug={currentSlug.toLowerCase() as LegalSlug} onGoHome={goHomeNav} />;
        }
        return selectedArticleUrl ? (
          <PublicArticlePage
            urlSlug={selectedArticleUrl}
            blogs={blogs}
            ads={publicAds}
            isLoading={loading || !pagesLoaded}
            onGoBack={goHomeNav}
            onSelectArticle={openArticle}
          />
        ) : (
        <PublicHome
          blogs={activeTag ? tagBlogs : blogs}
          ads={publicAds}
          categories={categories}
          tags={tags}
          activeCategory={activeTag ? 'all' : activeCategory}
          dateFilter={dateFilter}
          isLoading={activeTag ? tagLoading : loading}
          onSelectArticle={openArticle}
          onCategorySelect={openCategory}
          homeH1={activeTag ? undefined : (siteConfig as any).homeH1}
          homeIntro={activeTag ? undefined : (siteConfig as any).homeIntro}
        />
        );
      })()}
    </PublicLayout>
    </I18nProvider>
  );
}

export default App;
