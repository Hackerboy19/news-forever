import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Menu, X, Sparkles, Calendar, Newspaper, Crown, Award, Flame, Globe } from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  onSelectCategoryUrl?: (url: string, categoryName: string) => void;
  onSearchClick?: () => void;
  activePath?: string;
  tagline?: string;
}

export interface NavTaxonomyItem {
  name: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  subcategories?: { name: string; url: string }[];
}

export const NAVIGATION_TAXONOMY: NavTaxonomyItem[] = [
  { name: 'Home', url: '/' },
  {
    name: 'Pageants',
    url: 'https://newsforever.in/category/beauty-pageant',
    icon: Crown,
    subcategories: [
      { name: 'Miss India', url: 'https://newsforever.in/category/miss-india' },
      { name: 'Mrs India', url: 'https://newsforever.in/category/mrs-india' },
      { name: 'Miss Teen India', url: 'https://newsforever.in/category/miss-teen-india' },
      { name: 'City Finalists', url: 'https://newsforever.in/category/city-finalists' },
      { name: 'State Winners', url: 'https://newsforever.in/category/state-winners' },
    ],
  },
  {
    name: 'Awards',
    url: 'https://newsforever.in/category/forever-star-india-awards',
    icon: Award,
    subcategories: [
      { name: 'Super Woman Award', url: 'https://newsforever.in/category/super-woman-award' },
      { name: 'Super Hero Award', url: 'https://newsforever.in/category/super-hero-award' },
      { name: 'National Achievers', url: 'https://newsforever.in/category/national-achiever-award' },
      { name: 'Nominate Yourself', url: 'https://newsforever.in/category/nominate-yourself-award' },
    ],
  },
  {
    name: 'News & Lifestyle',
    url: 'https://newsforever.in/category/news',
    icon: Newspaper,
    subcategories: [
      { name: 'Business News', url: 'https://newsforever.in/category/business-news' },
      { name: 'Astrology', url: 'https://newsforever.in/category/astrology' },
      { name: 'Products & Lifestyle', url: 'https://newsforever.in/category/products' },
      { name: 'Franchise', url: 'https://newsforever.in/category/franchise' },
    ],
  },
  { name: 'About Us', url: 'https://newsforever.in/about-us' },
  { name: 'Contact Us', url: 'https://newsforever.in/contact-us' },
];

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onSelectCategoryUrl,
  onSearchClick,
  activePath = '/',
  tagline = 'International Organic News 24x7',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleNavClick = (e: React.MouseEvent, itemUrl: string, name: string) => {
    e.preventDefault();
    if (onSelectCategoryUrl) {
      onSelectCategoryUrl(itemUrl, name);
    } else if (itemUrl === '/' && onGoHome) {
      onGoHome();
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] shadow-xs transition-all duration-200">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E5E4] py-1.5 px-4 sm:px-8 text-[11px] font-mono text-stone-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-stone-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#991B1B]" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="hidden md:inline-block text-stone-300">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-[#991B1B] font-bold tracking-tight">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#991B1B]"></span>
              </span>
              <Sparkles className="w-3 h-3 text-[#991B1B]" /> {tagline}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSearchClick}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E7E5E4] hover:border-[#991B1B] text-stone-700 hover:text-[#991B1B] font-sans font-medium transition text-xs rounded-full shadow-2xs"
            >
              <Search className="w-3 h-3 text-[#991B1B]" />
              <span>Search articles...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-[#FAF8F5] text-stone-400 font-mono text-[9px] border border-[#E7E5E4] rounded-sm">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Enhanced Logo Component with Premium Light English Typography */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onGoHome) onGoHome();
            }}
            className="flex items-center gap-3 group shrink-0 py-0.5"
          >
            {/* Brand Emblem Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] to-stone-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-stone-800">
              <Newspaper className="w-5.5 h-5.5 text-amber-100" />
            </div>

            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1">
                <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-stone-900 group-hover:text-[#991B1B] transition-colors duration-200">
                  News<span className="text-[#991B1B]">Forever</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-stone-100 text-[#991B1B] border border-[#E7E5E4] font-mono text-[9px] font-bold uppercase rounded-sm tracking-wider">
                  Live 24x7
                </span>
              </div>
              <span className="font-sans font-semibold text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-stone-500 mt-1 flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-[#991B1B]" />
                {tagline}
              </span>
            </div>
          </a>

          {/* Centered Desktop Nested Hover Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-stone-800">
            {NAVIGATION_TAXONOMY.map((item) => {
              const hasSubs = item.subcategories && item.subcategories.length > 0;
              const isActive = activePath === item.url;
              const IconComp = item.icon;

              return (
                <div
                  key={item.name}
                  className="relative group py-2 px-2.5"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={item.url}
                    onClick={(e) => handleNavClick(e, item.url, item.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-[#991B1B] text-white font-extrabold shadow-xs'
                        : 'text-stone-800 hover:text-[#991B1B] hover:bg-stone-100/80'
                    }`}
                  >
                    {IconComp && <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#991B1B]'}`} />}
                    <span>{item.name}</span>
                    {hasSubs && (
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 group-hover:rotate-180 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-[#991B1B]'}`} />
                    )}
                  </a>

                  {/* Accessible Nested Subcategory Dropdown */}
                  {hasSubs && (
                    <div className="absolute left-0 top-full hidden group-hover:block w-64 bg-white/98 backdrop-blur-md border border-[#E7E5E4] shadow-xl rounded-xl z-50 p-2 animate-fadeIn transition-all duration-200">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 px-3 py-1.5 border-b border-stone-100 mb-1 flex items-center justify-between">
                        <span>{item.name} Categories</span>
                        {IconComp && <IconComp className="w-3 h-3 text-[#991B1B]" />}
                      </div>
                      {item.subcategories?.map((sub) => (
                        <a
                          key={sub.name}
                          href={sub.url}
                          onClick={(e) => handleNavClick(e, sub.url, sub.name)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-[#FAF8F5] hover:text-[#991B1B] transition flex items-center justify-between group/sub"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover/sub:bg-[#991B1B] transition-colors" />
                            {sub.name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-stone-300 group-hover/sub:text-[#991B1B] group-hover/sub:translate-x-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Header Controls (Search Trigger & Mobile Menu Toggle) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSearchClick}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-700 hover:text-[#991B1B] transition lg:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#991B1B]" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#991B1B]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E7E5E4] px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          {NAVIGATION_TAXONOMY.map((item) => (
            <div key={item.name} className="space-y-1">
              <a
                href={item.url}
                onClick={(e) => handleNavClick(e, item.url, item.name)}
                className="block text-sm font-bold uppercase tracking-wider text-stone-800 hover:text-[#991B1B] py-1.5"
              >
                {item.name}
              </a>
              {item.subcategories && (
                <div className="pl-4 space-y-1 border-l-2 border-[#E7E5E4]">
                  {item.subcategories.map((sub) => (
                    <a
                      key={sub.name}
                      href={sub.url}
                      onClick={(e) => handleNavClick(e, sub.url, sub.name)}
                      className="block text-xs font-medium text-stone-600 hover:text-[#991B1B] py-1"
                    >
                      {sub.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
