import React, { useState } from 'react';
import { CICategory, CIAdvertisement, CISetting } from '../types';
import { 
  Search, 
  Menu, 
  X, 
  Lock, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Globe, 
  Mail, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface PublicLayoutProps {
  categories: CICategory[];
  ads: CIAdvertisement[];
  setting: CISetting;
  activeCategory: number | 'all';
  onCategorySelect: (catId: number | 'all') => void;
  onSelectArticle: (urlSlug: string) => void;
  onGoHome: () => void;
  onSwitchToAdmin: () => void;
  onSubscribe: (email: string) => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  categories,
  ads,
  setting,
  activeCategory,
  onCategorySelect,
  onSelectArticle,
  onGoHome,
  onSwitchToAdmin,
  onSubscribe,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  // Find top banner ad from ci_advertisement
  const topAd = ads.find(a => a.position === 'top_banner' && a.status === 1);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    onSubscribe(newsletterEmail);
    setNewsletterMsg('Thank you for subscribing to Global Gazette News Alerts!');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterMsg(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] font-sans flex flex-col selection:bg-[#991B1B] selection:text-white">
      {/* Top Banner Ad Zone (Pulls from ci_advertisement table) */}
      {topAd && (
        <div className="bg-[#F4F1EA] border-b border-[#E7E5E4] py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-bold">
              ADVERTISEMENT | LEADERBOARD ZONE
            </span>
            <a
              href={topAd.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-90 transition max-h-[90px] overflow-hidden"
            >
              <img
                src={topAd.advertisement_image}
                alt={topAd.alt_tag}
                className="max-h-16 mx-auto object-contain rounded-none border border-stone-300"
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

      {/* Main Header & Branding Bar */}
      <header className="bg-white border-b border-[#E7E5E4] sticky top-0 z-40 backdrop-blur-md bg-white/95 shadow-xs">
        {/* Utility Top Bar */}
        <div className="border-b border-[#E7E5E4] py-2 px-6 text-xs text-stone-600 hidden sm:block bg-[#F5F2EC]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-stone-600 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#991B1B]" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-700 text-[11px]">Edition: <strong className="font-serif italic font-semibold text-stone-900">Global Pageantry & International News</strong></span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest font-semibold">
                Verified News Desk
              </span>
            </div>
          </div>
        </div>

        {/* Primary Logo Header */}
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo & Tagline */}
          <button onClick={onGoHome} className="flex items-center gap-3.5 text-left group">
            <div className="w-10 h-10 bg-[#991B1B] flex items-center justify-center font-bold text-white text-xl shadow-md group-hover:bg-[#7F1D1D] transition">
              G
            </div>
            <div>
              <span className="font-serif italic font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight block leading-none">
                GLOBAL GAZETTE
              </span>
              <span className="text-[10px] text-stone-500 font-bold tracking-widest uppercase block mt-1">
                {setting.site_title || "Pageant Times & International News Portal"}
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Categorical Navigation Bar */}
        <nav className="bg-[#FAF8F5] border-t border-[#E7E5E4] hidden md:block">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-1 py-1">
              <button
                onClick={() => onCategorySelect('all')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition ${
                  activeCategory === 'all'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                All Stories
              </button>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.id)}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition whitespace-nowrap ${
                      isActive
                        ? 'bg-[#991B1B] text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/50'
                    }`}
                  >
                    {cat.category_name}
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] uppercase tracking-widest font-mono text-stone-500 flex items-center gap-1.5 py-2 shrink-0 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#991B1B]" />
              Headless Architecture Engine
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E7E5E4] bg-white p-4 space-y-2">
            <button
              onClick={() => {
                onCategorySelect('all');
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest ${
                activeCategory === 'all' ? 'text-[#991B1B] bg-[#991B1B]/10 font-bold' : 'text-stone-700'
              }`}
            >
              All Stories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onCategorySelect(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest ${
                  activeCategory === cat.id ? 'text-[#991B1B] bg-[#991B1B]/10 font-bold' : 'text-stone-700'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>

      {/* Newsletter & Footer Section */}
      <footer className="bg-[#F2EFE9] border-t border-[#E7E5E4] pt-12 pb-8 text-stone-700">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Newsletter Box */}
          <div className="bg-white border border-[#E7E5E4] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-xl font-serif italic font-bold text-stone-900 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-5 h-5 text-[#991B1B]" />
                Subscribe to Global Gazette Editorial Digest
              </h3>
              <p className="text-xs text-stone-600">
                Receive coronation scoring breakdowns, pageant highlights, and fashion updates directly to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubscribeSubmit} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email..."
                className="px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E5E4] text-stone-900 text-xs focus:outline-none focus:border-[#991B1B] w-full md:w-72"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-widest transition shrink-0 shadow-sm"
              >
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t border-[#E7E5E4] text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-serif italic text-xl font-bold">
                <div className="w-6 h-6 bg-[#991B1B] flex items-center justify-center text-xs text-white not-italic font-sans font-bold">G</div>
                GLOBAL GAZETTE
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                Headless news portal architecture preserving 100% legacy CodeIgniter database authority and SEO structure.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px]">Categories</h4>
              <ul className="space-y-1.5 text-xs">
                {categories.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => onCategorySelect(c.id)} className="hover:text-[#991B1B] transition">
                      {c.category_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px]">System Specs</h4>
              <ul className="space-y-1 text-stone-600 font-mono text-[11px]">
                <li>Frontend: React 19 / Next.js</li>
                <li>Backend: Express REST API</li>
                <li>Database: MySQL <code className="text-[#991B1B] font-bold">ci_*</code> Schema</li>
                <li>Styling: English Editorial Light Theme</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-widest text-[10px]">Editorial Bureau</h4>
              <p className="text-stone-600 text-xs leading-relaxed">
                Independent journalism & international correspondent team bringing global coronation coverage and editorial analyses.
              </p>
            </div>
          </div>

          <div className="border-t border-[#E7E5E4] pt-6 text-center text-[10px] text-stone-500 uppercase tracking-widest font-mono">
            © 2026 Global Gazette News Portal. Zero Data Loss Headless Migration.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
