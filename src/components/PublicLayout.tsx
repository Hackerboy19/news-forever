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
  activeCategory: number | 'all';
  onCategorySelect: (catId: number | 'all') => void;
  onSelectArticle: (urlSlug: string) => void;
  onGoHome: () => void;
  onSwitchToAdmin: () => void;
  onSubscribe: (email: string) => void;
  children: React.ReactNode;
}

// Subcategory mapping matching exact News Forever taxonomy
const SUB_CATEGORIES: Record<string, { name: string; slug: string }[]> = {
  'Beauty Pageant': [
    { name: 'Miss India', slug: 'miss-india' },
    { name: 'Mrs India', slug: 'mrs-india' },
    { name: 'Miss Teen India', slug: 'miss-teen-india' },
    { name: 'City Finalists', slug: 'city-finalists' },
    { name: 'State Winners', slug: 'state-winners' },
  ],
  'Pageants': [
    { name: 'Miss India', slug: 'miss-india' },
    { name: 'Mrs India', slug: 'mrs-india' },
    { name: 'Miss Teen India', slug: 'miss-teen-india' },
    { name: 'City Finalists', slug: 'city-finalists' },
    { name: 'State Winners', slug: 'state-winners' },
  ],
  'Forever Star India Awards': [
    { name: 'Super Woman Award', slug: 'super-woman-award' },
    { name: 'Super Hero Award', slug: 'super-hero-award' },
    { name: 'National Achievers', slug: 'national-achiever-award' },
    { name: 'Nominate Yourself', slug: 'nominate-yourself-award' },
  ],
  'Awards': [
    { name: 'Super Woman Award', slug: 'super-woman-award' },
    { name: 'Super Hero Award', slug: 'super-hero-award' },
    { name: 'National Achievers', slug: 'national-achiever-award' },
    { name: 'Nominate Yourself', slug: 'nominate-yourself-award' },
  ],
  'News & Lifestyle': [
    { name: 'Business News', slug: 'business-news' },
    { name: 'Astrology', slug: 'astrology' },
    { name: 'Products & Lifestyle', slug: 'products' },
    { name: 'Franchise', slug: 'franchise' },
  ],
  'Products': [
    { name: 'Fashion & Apparel', slug: 'fashion-apparel' },
    { name: 'Cosmetics & Beauty', slug: 'cosmetics-beauty' },
    { name: 'Pageant Crowns & Sashes', slug: 'crowns-sashes' },
  ],
  'Astrology': [
    { name: 'Daily Horoscope', slug: 'daily-horoscope' },
    { name: 'Tarot & Star Signs', slug: 'tarot-star-signs' },
    { name: 'Zodiac Compatibility', slug: 'zodiac-compatibility' },
  ],
  'Business News': [
    { name: 'Corporate Updates', slug: 'corporate-updates' },
    { name: 'Startups & Leadership', slug: 'startups-leadership' },
    { name: 'Markets & Finance', slug: 'markets-finance' },
  ],
  'Franchise': [
    { name: 'State Directorship', slug: 'state-directorship' },
    { name: 'City Franchise Leads', slug: 'city-franchise-leads' },
  ],
  'Star India Kids Contest': [
    { name: 'Kids Modeling', slug: 'kids-modeling' },
    { name: 'Talent Search 2026', slug: 'talent-search-2026' },
  ],
  'Nominate Yourself': [
    { name: 'Award Nomination', slug: 'award-nomination' },
    { name: 'Jury Selection Criteria', slug: 'jury-selection' },
  ],
};

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
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
  const filteredArticles = blogs.filter((article) => {
    const matchesCat = selectedCatFilter === 'all' || article.category_name === selectedCatFilter;
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

  // Find top banner ad from ci_advertisement
  const topAd = ads.find(a => a.position === 'top_banner' && a.status === 1);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    onSubscribe(newsletterEmail);
    setNewsletterMsg('Thank you for subscribing to News Forever updates!');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMsg(''), 4000);
  };

  const navItems = [
    { name: 'LATEST NEWS', id: 'all' },
    ...categories.map(c => ({ name: c.category_name, id: c.id })),
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] font-sans flex flex-col selection:bg-[#7A0C0C] selection:text-white">
      {/* Top Banner Ad Zone */}
      {topAd && (
        <div className="bg-[#F4F1EA] border-b border-[#E7E5E4] py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-bold">
              SPONSORED ADVERTISEMENT
            </span>
            <a
              href={topAd.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-90 transition max-h-[80px] overflow-hidden"
            >
              <img
                src={topAd.advertisement_image}
                alt={topAd.alt_tag}
                className="max-h-14 mx-auto object-contain border border-stone-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&auto=format&fit=crop&q=80';
                }}
              />
            </a>
            <div className="hidden lg:block text-[10px] uppercase tracking-widest font-mono text-stone-500">
              728x90 Banner
            </div>
          </div>
        </div>
      )}

      {/* Top Utility Header with Search, Subscribe & Social Icons */}
      <div className="bg-white border-b border-stone-200 py-1.5 px-4 sm:px-8 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-[#7A0C0C]" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {activeSubcatFilter && (
              <span className="bg-[#7A0C0C]/10 text-[#7A0C0C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                Filter: {activeSubcatFilter}
                <button onClick={() => setActiveSubcatFilter(null)} className="ml-1 hover:text-black">×</button>
              </span>
            )}
          </div>

          {/* Right Header Controls: Persistent Search Button, Subscribe, Socials */}
          <div className="flex items-center gap-4">
            {/* Persistent Command Palette Search Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 hover:bg-stone-200/80 border border-stone-300 text-stone-700 hover:text-[#7A0C0C] font-medium transition text-xs group"
              title="Search news articles (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-stone-600 group-hover:text-[#7A0C0C] transition" />
              <span className="hidden sm:inline text-xs font-sans">Search news...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-white text-stone-500 border border-stone-300 font-mono text-[9px] font-bold shadow-2xs">⌘K</kbd>
            </button>

            <span className="text-stone-300">|</span>

            {/* Subscribe Text Button */}
            <button
              onClick={() => {
                const el = document.getElementById('newsletter-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-stone-700 hover:text-[#7A0C0C] font-semibold tracking-tight transition"
            >
              Subscribe
            </button>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2.5 text-stone-700">
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

      {/* Main Brand Logo Header & Navigation Header Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Logo and Navigation Container matching NewsForever layout */}
          <div className="py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 gap-4">
            {/* Logo: NEWS FOREVER */}
            <button onClick={onGoHome} className="flex items-center gap-3 text-left group shrink-0 py-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] to-stone-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-stone-800">
                <Newspaper className="w-5.5 h-5.5 text-amber-100" />
              </div>

              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-stone-900 group-hover:text-[#991B1B] transition-colors duration-200">
                    News<span className="text-[#991B1B]">Forever</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 bg-stone-100 text-[#991B1B] border border-[#E7E5E4] font-mono text-[9px] font-bold uppercase rounded-sm tracking-wider">
                    Live 24x7
                  </span>
                </div>
                <span className="font-sans font-semibold text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-stone-500 mt-1 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-[#991B1B]" />
                  {setting.tagline || 'International Organic News 24x7'}
                </span>
              </div>
            </button>

            {/* Desktop Main Navigation Dropdowns Bar */}
            <nav className="hidden lg:flex items-center flex-wrap gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              {navItems.map((item) => {
                const subcats = SUB_CATEGORIES[item.name] || [];
                const hasSubcats = subcats.length > 0;
                const isActive = item.id === 'all' ? activeCategory === 'all' : activeCategory === item.id;

                return (
                  <div
                    key={item.name}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      onClick={() => {
                        if (item.id === 'all') {
                          onCategorySelect('all');
                        } else if (typeof item.id === 'number') {
                          onCategorySelect(item.id);
                        }
                        setActiveSubcatFilter(null);
                      }}
                      className={`flex items-center gap-1 transition ${
                        isActive
                          ? 'text-[#7A0C0C] font-extrabold border-b-2 border-[#7A0C0C] pb-0.5'
                          : 'text-stone-800 hover:text-[#7A0C0C]'
                      }`}
                    >
                      <span>{item.name}</span>
                      {hasSubcats && <ChevronDown className="w-3 h-3 text-stone-500 group-hover:text-[#7A0C0C] transition-transform duration-200 group-hover:rotate-180" />}
                    </button>

                    {/* Hover Dropdown Menu */}
                    {hasSubcats && (
                      <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-white border border-stone-200 shadow-xl z-50 py-2 animate-fadeIn">
                        {subcats.map((sub) => (
                          <button
                            key={sub.slug}
                            onClick={() => {
                              if (typeof item.id === 'number') {
                                onCategorySelect(item.id);
                              }
                              setActiveSubcatFilter(sub.name);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#7A0C0C] transition flex items-center justify-between group/sub"
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
            <div className="lg:hidden flex items-center justify-between w-full md:w-auto">
              <span className="text-xs font-mono font-bold uppercase text-stone-500">Navigation Menu</span>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-stone-800 hover:text-[#7A0C0C]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                onCategorySelect('all');
                setActiveSubcatFilter(null);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                activeCategory === 'all' ? 'text-[#7A0C0C] bg-[#7A0C0C]/10 font-bold' : 'text-stone-800'
              }`}
            >
              LATEST NEWS
            </button>

            {categories.map((cat) => {
              const subcats = SUB_CATEGORIES[cat.category_name] || [];
              const isExpanded = activeDropdown === cat.category_name;

              return (
                <div key={cat.id} className="space-y-1 border-b border-stone-100 pb-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        onCategorySelect(cat.id);
                        setActiveSubcatFilter(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-left text-xs font-bold uppercase tracking-wider ${
                        activeCategory === cat.id ? 'text-[#7A0C0C]' : 'text-stone-800'
                      }`}
                    >
                      {cat.category_name}
                    </button>
                    {subcats.length > 0 && (
                      <button
                        onClick={() => setActiveDropdown(isExpanded ? null : cat.category_name)}
                        className="p-1 text-stone-500"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Subcategory List in Mobile Drawer */}
                  {isExpanded && subcats.length > 0 && (
                    <div className="pl-4 pt-1 space-y-1.5 border-l-2 border-[#7A0C0C]/30 ml-2">
                      {subcats.map((sub) => (
                        <button
                          key={sub.slug}
                          onClick={() => {
                            onCategorySelect(cat.id);
                            setActiveSubcatFilter(sub.name);
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left text-xs text-stone-600 hover:text-[#7A0C0C] py-1"
                        >
                          • {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Newsletter & Footer Section */}
      <footer id="newsletter-section" className="bg-[#FAF8F5] border-t border-stone-200 pt-12 pb-8 text-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Newsletter Box */}
          <div className="bg-white border border-stone-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-xl font-serif italic font-bold text-stone-900 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-5 h-5 text-[#7A0C0C]" />
                Subscribe to News Forever Updates
              </h3>
              <p className="text-xs text-stone-600">
                Receive coronation scoring breakdowns, pageant highlights, award nominations, and breaking news directly to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubscribeSubmit} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
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
                Official news, beauty pageant updates, Forever Star India Awards, and international editorial coverage.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">Category Index</h4>
              <ul className="space-y-1.5 text-xs">
                {categories.map((c) => (
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
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">Top Subcategories</h4>
              <ul className="space-y-1 text-stone-600 text-[11px]">
                <li>• Miss India & Miss Bharat</li>
                <li>• Forever Star India Awards</li>
                <li>• Star India Kids Contest 2026</li>
                <li>• Nominate Yourself Award</li>
                <li>• Franchise State Directorship</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px] font-mono">Editorial Office</h4>
              <p className="text-stone-600 text-xs leading-relaxed">
                News Forever Bureau • Independent journalism & official coverage for pageantry and awards.
              </p>
              <div className="flex items-center gap-3 pt-2 text-stone-700">
                <a href={setting.facebook_url || "#"} className="hover:text-[#7A0C0C]"><Facebook className="w-4 h-4 fill-current stroke-none" /></a>
                <a href={setting.instagram_url || "#"} className="hover:text-[#7A0C0C]"><Instagram className="w-4 h-4" /></a>
                <a href={setting.youtube_url || "#"} className="hover:text-[#7A0C0C]"><Youtube className="w-4.5 h-4.5" /></a>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 text-center text-[10px] text-stone-500 uppercase tracking-widest font-mono">
            © 2026 News Forever. All rights reserved. Zero Data Loss Headless CMS.
          </div>
        </div>
      </footer>

      {/* COMMAND PALETTE SEARCH OVERLAY MODAL */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start justify-center pt-10 sm:pt-20 px-4 animate-in fade-in duration-150">
          {/* Backdrop Click Handler */}
          <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />

          {/* Command Palette Dialog Box */}
          <div className="relative z-10 bg-white w-full max-w-2xl border border-stone-300 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-[85vh]">
            {/* Top Search Input Bar */}
            <div className="p-4 border-b border-stone-200 flex items-center gap-3 bg-stone-50/80">
              <Search className="w-5 h-5 text-[#7A0C0C] shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search by title, keyword, category, or tag... (e.g. Miss India, Awards, Astrology)"
                className="w-full text-sm font-medium text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              {paletteQuery && (
                <button
                  onClick={() => setPaletteQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-700 text-xs font-mono font-bold"
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
                  className="p-1 text-stone-500 hover:text-stone-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-stone-500 shrink-0 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#7A0C0C]" /> Filter:
              </span>
              <button
                onClick={() => setSelectedCatFilter('all')}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition whitespace-nowrap ${
                  selectedCatFilter === 'all'
                    ? 'bg-[#7A0C0C] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-200'
                }`}
              >
                All ({blogs.length})
              </button>
              {categories.map((cat) => (
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
                  : `Trending & Latest News Stories (${filteredArticles.length})`}
              </span>
              <span className="hidden sm:inline text-stone-400">Click result to view full article</span>
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

            {/* Modal Command Palette Footer */}
            <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-500">
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

