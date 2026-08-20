import React, { useState, useEffect, useRef } from 'react';
import { CICategory, CIAdvertisement, CISetting, CIBlog } from '../types';
import { 
  Search, 
  Menu, 
  X, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Sparkles,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Command,
  FileText,
  Clock,
  Tag,
  Newspaper,
  Globe
} from 'lucide-react';

interface PublicLayoutProps {
  categories: CICategory[];
  ads: CIAdvertisement[];
  setting: CISetting;
  blogs?: CIBlog[];
  activeCategory: number | string | 'all';
  onCategorySelect: (cat: number | string | 'all') => void;
  onSelectArticle: (urlSlug: string) => void;
  onGoHome: () => void;
  onSwitchToAdmin: () => void;
  onSubscribe: (email: string) => void;
  dateFilter?: DateFilter;
  onDateFilterChange?: (f: DateFilter) => void;
  siteConfig?: { headerColor?: string; footerColor?: string; navExtra?: number[]; logoUrl?: string };
  children: React.ReactNode;
}

import { NAV_UMBRELLAS } from '../lib/taxonomy';
import LeaderboardAd from './LeaderboardAd';
import Logo from './ui/Logo';
import NewsTicker from './NewsTicker';
import PromotionalModal from './PromotionalModal';
import { useI18n } from '../lib/i18n';

export type DateFilter = 'all' | 'today' | 'week' | 'month';

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  categories,
  ads,
  setting,
  blogs = [],
  activeCategory,
  onCategorySelect,
  onSelectArticle,
  onGoHome,
  onSwitchToAdmin,
  onSubscribe,
  dateFilter = 'all',
  onDateFilterChange,
  siteConfig = {} as NonNullable<PublicLayoutProps['siteConfig']>,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Bilingual chrome (EN | HI) — shared app-wide via I18nProvider
  const { lang, setLang, t } = useI18n();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Scroll-hide header: hides scrolling down (reading space), reappears on scroll-up
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHeaderHidden(y > 300 && y > lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [activeSubcatFilter, setActiveSubcatFilter] = useState<string | null>(null);

  // Command Palette Search State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut Listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus search input when Command Palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    } else {
      setPaletteQuery('');
      setSelectedCatFilter('all');
    }
  }, [commandPaletteOpen]);

  // Real-time filtering over blogs real data
  const selectedCat = categories.find((c) => c.category_name === selectedCatFilter);
  const filteredArticles = blogs.filter((article) => {
    const matchesCat =
      selectedCatFilter === 'all' ||
      (selectedCat
        ? article.category_id === selectedCat.id || article.sub_category_id === selectedCat.id
        : article.category_name === selectedCatFilter);
    if (!matchesCat) return false;

    const query = paletteQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      article.title.toLowerCase().includes(query) ||
      (article.short_content && article.short_content.toLowerCase().includes(query)) ||
      (article.category_name && article.category_name.toLowerCase().includes(query)) ||
      (article.meta_keyword && article.meta_keyword.toLowerCase().includes(query)) ||
      (article.author_name && article.author_name.toLowerCase().includes(query))
    );
  });

  // Top-level ci_category rows that actually have published articles
  const topCategories = categories.filter(c => !c.parent_id && (c.article_count ?? 0) > 0);

  // Broad umbrella navigation (no "Pageant"/"Awards" wording at top level)
  // covering the FULL live ci_category tree — every real category stays
  // reachable through the dropdowns, and legacy /category/ URLs are unchanged.
  interface DynNavItem {
    name: string;
    id?: number | string | 'all';
    href?: string;
    subs: { name: string; id: number }[];
  }
  const navItems: DynNavItem[] = [
    { name: 'Home', id: 'all', subs: [] },
    ...NAV_UMBRELLAS.map((umbrella) => {
      const covered = topCategories.filter((cat) =>
        umbrella.covers.some((slug) => cat.slug.toLowerCase() === slug || cat.slug.toLowerCase().startsWith(slug))
      );
      // Single covered category → expose its children; several → expose the
      // covered categories themselves (each expands to its children on click)
      const subs =
        covered.length === 1
          ? categories
              .filter((c) => c.parent_id === covered[0].id && (c.article_count ?? 0) > 0)
              .map((c) => ({ name: c.category_name, id: c.id }))
          : covered.map((c) => ({ name: c.category_name, id: c.id }));
      return { name: umbrella.name, id: umbrella.slug, subs, hasContent: covered.length > 0 };
    })
      .filter((item) => item.hasContent)
      .map(({ hasContent, ...item }) => item),
    ...(siteConfig.navExtra || [])
      .map((id) => topCategories.find((c) => c.id === id))
      .filter((c): c is CICategory => Boolean(c))
      .map((c) => ({
        name: c.category_name,
        id: c.id as number | string | 'all',
        subs: categories
          .filter((ch) => ch.parent_id === c.id && (ch.article_count ?? 0) > 0)
          .map((ch) => ({ name: ch.category_name, id: ch.id })),
      })),
    { name: 'About Us', href: 'https://newsforever.in/about-us', subs: [] },
    { name: 'Contact Us', href: 'https://newsforever.in/contact-us', subs: [] },
  ];

  const handleCatSelect = (id: number | string | 'all', label: string | null) => {
    onCategorySelect(id);
    setActiveSubcatFilter(label);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    onSubscribe(newsletterEmail);
    setNewsletterMsg(t('subscribeThanks'));
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMsg(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-700 font-sans flex flex-col selection:bg-[#7A0C0C] selection:text-white">
      {/* Top Utility Header with Search, Subscribe & Social Icons */}
      <div className="bg-white border-b border-stone-200 py-1.5 px-4 sm:px-8 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-[#7A0C0C] shrink-0" />
              {/* Compact date on mobile so the utility bar never wraps */}
              <span className="sm:hidden">
                {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="hidden sm:inline">
                {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </span>
            {/* Date-based news filter */}
            {onDateFilterChange && (
              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
                className="bg-stone-100 border border-stone-300 text-[10px] sm:text-[11px] font-mono text-stone-600 px-1 sm:px-1.5 py-1 rounded-sm focus:outline-none focus:border-[#7A0C0C] cursor-pointer max-w-[92px] sm:max-w-none"
                aria-label="Filter news by date"
              >
                <option value="all">{t('allDates')}</option>
                <option value="today">{t('today')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
              </select>
            )}
            {activeSubcatFilter && (
              <span className="hidden sm:flex bg-[#7A0C0C]/10 text-[#7A0C0C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono items-center gap-1">
                Filter: {activeSubcatFilter}
                <button onClick={() => setActiveSubcatFilter(null)} className="ml-1 hover:text-black">×</button>
              </span>
            )}
          </div>

          {/* Right Header Controls: Persistent Search Button, Subscribe, Socials */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Persistent Command Palette Search Button — comfortable tap target on mobile */}
            {/* Prominent search field (opens the command palette) */}
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 w-56 md:w-72 px-3 py-1.5 bg-stone-100 hover:bg-white border border-stone-300 hover:border-[#7A0C0C] rounded-full cursor-text transition group"
              role="search"
              title="Search news articles (Cmd+K)"
            >
              <Search className="w-4 h-4 text-stone-500 group-hover:text-[#7A0C0C] shrink-0 transition" />
              <input
                type="search"
                readOnly
                placeholder={t('searchPlaceholder')}
                onFocus={() => setCommandPaletteOpen(true)}
                className="w-full bg-transparent text-xs text-stone-700 placeholder-stone-400 outline-none cursor-text"
                aria-label="Search news articles"
              />
              <kbd className="px-1.5 py-0.5 bg-white text-stone-400 border border-stone-300 rounded font-mono text-[9px] font-bold shrink-0">⌘K</kbd>
            </div>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-300 text-stone-700 rounded-full text-xs"
              aria-label="Search news articles"
            >
              <Search className="w-4 h-4 text-stone-600" />
              <span className="hidden min-[420px]:inline">{t('search')}</span>
            </button>

            {/* Language toggle EN | HI */}
            <div className="flex items-center border border-stone-300 rounded-full overflow-hidden text-[10px] font-mono font-bold">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 transition ${lang === 'en' ? 'bg-[#7A0C0C] text-white' : 'bg-white text-stone-600 hover:text-[#7A0C0C]'}`}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 transition ${lang === 'hi' ? 'bg-[#7A0C0C] text-white' : 'bg-white text-stone-600 hover:text-[#7A0C0C]'}`}
                aria-pressed={lang === 'hi'}
              >
                HI
              </button>
            </div>

            <span className="hidden sm:inline text-stone-300">|</span>

            {/* Subscribe Text Button */}
            <button
              onClick={() => {
                const el = document.getElementById('newsletter-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline text-stone-700 hover:text-[#7A0C0C] font-semibold tracking-tight transition"
            >
              {t('subscribe')}
            </button>

            {/* Social Media Icons (desktop only — mobile bar stays uncluttered) */}
            <div className="hidden sm:flex items-center gap-2.5 text-stone-700">
              <a
                href={setting.facebook_url || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#7A0C0C] transition"
                title="Facebook"
              >
                <Facebook className="w-4 h-4 fill-current stroke-none" />
              </a>
              <a
                href={setting.instagram_url || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#7A0C0C] transition"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={setting.youtube_url || "https://youtube.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#7A0C0C] transition"
                title="YouTube"
              >
                <Youtube className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Brand Logo Header & Navigation Header Bar (sticky, scroll-hide) */}
      <header
        style={siteConfig.headerColor ? { backgroundColor: siteConfig.headerColor } : undefined}
        className={`bg-[#132639] border-b border-black/30 sticky top-0 z-40 shadow-md transition-transform duration-300 ${
          headerHidden && !mobileMenuOpen ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Logo and Navigation Container matching NewsForever layout */}
          <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Logo: NEWS FOREVER */}
            <button onClick={onGoHome} className="flex items-center gap-3 text-left group shrink-0 py-0.5">
              {siteConfig.logoUrl ? (
                <img
                  src={siteConfig.logoUrl}
                  alt="Site logo"
                  className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                />
              ) : (
                <Logo className="w-12 h-12 group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
              )}

              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-white group-hover:text-red-300 transition-colors duration-200">
                    News<span className="text-[#FF6B5E]">Forever</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 bg-red-500/15 text-red-300 border border-red-400/30 font-mono text-[9px] font-bold uppercase rounded-sm tracking-wider">
                    {t('live247')}
                  </span>
                </div>
                <span className="font-sans font-semibold text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-300/80 mt-1 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-red-300" />
                  {t('tagline')}
                </span>
              </div>
            </button>

            {/* Desktop Main Navigation — full live ci_category tree */}
            <nav className="hidden md:flex items-center flex-wrap gap-x-1 gap-y-0.5 text-xs font-bold uppercase tracking-wider text-slate-100">
              {navItems.map((item) => {
                const hasSubcats = item.subs.length > 0;
                const isActive = item.id !== undefined && activeCategory === item.id;

                if (item.href) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 text-slate-200 hover:text-white hover:bg-white/10 rounded transition"
                    >
                      {t(item.name)}
                    </a>
                  );
                }

                return (
                  <div
                    key={item.name}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      onClick={() => handleCatSelect(item.id!, item.id === 'all' ? null : item.name)}
                      className={`flex items-center gap-1 px-2.5 py-2 rounded transition border-b-2 ${
                        isActive
                          ? 'text-white border-[#FF6B5E] bg-white/10 font-extrabold'
                          : 'text-slate-200 border-transparent hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{t(item.name)}</span>
                      {hasSubcats && <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" />}
                    </button>

                    {/* Hover Dropdown Menu */}
                    {hasSubcats && (
                      <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-white border border-stone-200 shadow-xl z-50 py-2 animate-fadeIn max-h-80 overflow-y-auto">
                        {item.subs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCatSelect(sub.id, sub.name)}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold transition flex items-center justify-between group/sub ${
                              activeCategory === sub.id
                                ? 'text-[#7A0C0C] bg-stone-50'
                                : 'text-stone-700 hover:bg-stone-50 hover:text-[#7A0C0C]'
                            }`}
                          >
                            <span>{sub.name}</span>
                            <ChevronRight className="w-3 h-3 text-stone-300 group-hover/sub:text-[#7A0C0C]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Hamburger Menu Button */}
            <div className="md:hidden flex items-center justify-between w-full">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">{t('navMenu')}</span>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-100 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Full-screen slide-out mobile drawer with accordion sub-menus */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="drawer-backdrop absolute inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="drawer-panel absolute inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#FAF8F5]">
              <span className="font-serif font-black text-xl text-stone-900">
                News<span className="text-[#991B1B]">Forever</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-stone-200/70 text-stone-700"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-5 space-y-1.5">
              {navItems.map((item) => {
                if (item.href) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-3 text-sm font-bold uppercase tracking-wider text-stone-800 hover:text-[#7A0C0C] border-b border-stone-100"
                    >
                      {t(item.name)}
                    </a>
                  );
                }

                const subcats = item.subs;
                const isExpanded = activeDropdown === item.name;
                const isActive = item.id !== undefined && activeCategory === item.id;

                return (
                  <div key={item.name} className="border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleCatSelect(item.id!, item.id === 'all' ? null : item.name)}
                        className={`flex-1 text-left text-sm font-bold uppercase tracking-wider px-3 py-3 transition ${
                          isActive ? 'text-[#7A0C0C]' : 'text-stone-800 hover:text-[#7A0C0C]'
                        }`}
                      >
                        {t(item.name)}
                      </button>
                      {subcats.length > 0 && (
                        <button
                          onClick={() => setActiveDropdown(isExpanded ? null : item.name)}
                          className="p-3 text-stone-500 hover:text-[#7A0C0C]"
                          aria-label={`Toggle ${item.name} subcategories`}
                          aria-expanded={isExpanded}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Smooth accordion sub-menu */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded && subcats.length > 0 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pl-5 pb-3 space-y-0.5 border-l-2 border-[#7A0C0C]/30 ml-3 max-h-80 overflow-y-auto">
                        {subcats.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCatSelect(sub.id, sub.name)}
                            className={`block w-full text-left text-xs py-2 px-2 transition ${
                              activeCategory === sub.id
                                ? 'text-[#7A0C0C] font-bold'
                                : 'text-stone-600 hover:text-[#7A0C0C]'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="px-5 py-4 border-t border-stone-200 bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-widest text-stone-500 text-center">
              National & International News Portal
            </div>
          </div>
        </div>
      )}

      {/* Breaking News Ticker — 5 most recent ci_blog titles */}
      <NewsTicker blogs={blogs} onSelectArticle={(slug) => { onSelectArticle(slug); }} />

      {/* Leaderboard Ad Strip — between header and hero, ci_advertisement-backed */}
      <LeaderboardAd ads={ads} />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Newsletter & Footer Section */}
      <footer id="newsletter-section" style={siteConfig.footerColor ? { backgroundColor: siteConfig.footerColor } : undefined} className="bg-[#FAF8F5] border-t border-stone-200 pt-12 pb-8 text-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Newsletter Box */}
          <div className="bg-white border border-stone-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-xl font-serif italic font-bold text-stone-900 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-5 h-5 text-[#7A0C0C]" />
                {t('newsletterTitle')}
              </h3>
              <p className="text-xs text-stone-600">
                {t('newsletterDesc')}
              </p>
            </div>

            <form onSubmit={handleSubscribeSubmit} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="px-4 py-2.5 bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-none focus:border-[#7A0C0C] w-full md:w-72"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7A0C0C] hover:bg-[#5B0909] text-white font-bold text-xs uppercase tracking-widest transition shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>
          </div>

          {newsletterMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold text-center font-mono">
              {newsletterMsg}
            </div>
          )}

          {/* Bottom Footer Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t border-stone-200 text-xs">
            <div className="space-y-3">
              <div className="flex flex-col leading-none">
                <span className="font-serif font-black text-2xl text-[#7A0C0C]">
                  NEWS
                </span>
                <span className="font-sans font-bold text-[9px] tracking-[0.38em] uppercase text-[#7A0C0C]">
                  FOREVER
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                {t('footerBlurb')}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">{t('categoryIndex')}</h4>
              <ul className="space-y-1.5 text-xs">
                {topCategories.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        onCategorySelect(c.id);
                        setActiveSubcatFilter(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-[#7A0C0C] transition"
                    >
                      {c.category_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">{t('topSubcategories')}</h4>
              <ul className="space-y-1 text-stone-600 text-[11px]">
                <li>• Fashion &amp; Glamour</li>
                <li>• Entertainment</li>
                <li>• Business News</li>
                <li>• Lifestyle &amp; Products</li>
                <li>• Astrology</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">{t('editorialOffice')}</h4>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('editorialBlurb')}
              </p>
              <div className="flex items-center gap-3 pt-2 text-stone-700">
                <a href={setting.facebook_url || "#"} className="hover:text-[#7A0C0C]"><Facebook className="w-4 h-4 fill-current stroke-none" /></a>
                <a href={setting.instagram_url || "#"} className="hover:text-[#7A0C0C]"><Instagram className="w-4 h-4" /></a>
                <a href={setting.youtube_url || "#"} className="hover:text-[#7A0C0C]"><Youtube className="w-4.5 h-4.5" /></a>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-[10px] text-stone-500 uppercase tracking-widest font-mono">
            <span>© 2026 News Forever. All rights reserved.</span>
            <button
              onClick={onSwitchToAdmin}
              className="text-stone-400 hover:text-[#7A0C0C] transition underline underline-offset-2"
            >
              {t('adminLogin')}
            </button>
          </div>
        </div>
      </footer>

      {/* Timed promotional pop-up (ci_advertisement, 24h frequency cap) */}
      <PromotionalModal ads={ads} />

      {/* COMMAND PALETTE SEARCH OVERLAY MODAL */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start justify-center sm:pt-20 sm:px-4 animate-in fade-in duration-150">
          {/* Backdrop Click Handler */}
          <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />

          {/* Command Palette Dialog — full-screen on mobile, centered card on larger screens */}
          <div className="relative z-10 bg-white w-full h-full sm:h-auto max-w-full sm:max-w-2xl border-0 sm:border border-stone-300 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-full sm:max-h-[85vh]">
            {/* Top Search Input Bar */}
            <div className="p-3 sm:p-4 border-b border-stone-200 flex items-center gap-2.5 sm:gap-3 bg-stone-50/80">
              <Search className="w-5 h-5 text-[#7A0C0C] shrink-0" />
              <input
                ref={paletteInputRef}
                type="search"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full text-base sm:text-sm font-medium text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              {paletteQuery && (
                <button
                  onClick={() => setPaletteQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-700 text-xs font-mono font-bold shrink-0"
                  title="Clear input"
                >
                  CLEAR
                </button>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-stone-500 bg-white border border-stone-300 font-bold">
                  ESC
                </kbd>
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-2 sm:p-1 -mr-1 sm:mr-0 text-stone-500 hover:text-stone-900"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-stone-500 shrink-0 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#7A0C0C]" /> {t('filterLabel')}
              </span>
              <button
                onClick={() => setSelectedCatFilter('all')}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition whitespace-nowrap ${
                  selectedCatFilter === 'all'
                    ? 'bg-[#7A0C0C] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
                }`}
              >
                {t('allCount')} ({blogs.length})
              </button>
              {topCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatFilter(cat.category_name)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-full transition whitespace-nowrap ${
                    selectedCatFilter === cat.category_name
                      ? 'bg-[#7A0C0C] text-white font-bold shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>

            {/* Article Results Header Status */}
            <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>
                {paletteQuery.trim()
                  ? `Found ${filteredArticles.length} matching article${filteredArticles.length === 1 ? '' : 's'}`
                  : `${t('trendingStories')} (${filteredArticles.length})`}
              </span>
              <span className="hidden sm:inline text-stone-400">{t('clickResult')}</span>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-1">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      onSelectArticle(article.url);
                      setCommandPaletteOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group p-3 hover:bg-stone-50 transition cursor-pointer flex gap-3.5 items-start border border-transparent hover:border-stone-200 rounded-none"
                  >
                    <img
                      src={article.image}
                      alt={article.alt_tag || article.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-stone-200 shrink-0 bg-stone-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                        <span className="bg-[#7A0C0C]/10 text-[#7A0C0C] font-bold uppercase tracking-wider px-2 py-0.5">
                          {article.category_name || 'News'}
                        </span>
                        <span className="text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {article.created_at ? article.created_at.split(' ')[0] : '2026'}
                        </span>
                        {article.author_name && (
                          <span className="text-stone-400">• By {article.author_name}</span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-stone-900 group-hover:text-[#7A0C0C] text-sm sm:text-base leading-snug line-clamp-1 transition">
                        {article.title}
                      </h4>
                      {article.short_content && (
                        <p className="text-xs text-stone-600 line-clamp-1 leading-normal">
                          {article.short_content}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-3 px-4">
                  <FileText className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">
                    No articles found matching "{paletteQuery}"
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Try searching with broader terms, or select another category filter above.
                  </p>
                  <button
                    onClick={() => {
                      setPaletteQuery('');
                      setSelectedCatFilter('all');
                    }}
                    className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-wider transition"
                  >
                    Reset Search Filters
                  </button>
                </div>
              )}
            </div>

            {/* Modal Command Palette Footer (desktop only) */}
            <div className="hidden sm:flex p-3 bg-stone-100 border-t border-stone-200 items-center justify-between text-[10px] font-mono text-stone-500">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#7A0C0C]" />
                News Forever Command Palette
              </span>
              <span className="hidden sm:inline text-stone-400">
                Press <kbd className="px-1 py-0.5 bg-white border border-stone-300 text-stone-600 font-bold">ESC</kbd> to exit
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLayout;

