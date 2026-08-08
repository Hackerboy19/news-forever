import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Menu, X, Sparkles, Calendar } from 'lucide-react';

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
  subcategories?: { name: string; url: string }[];
}

export const NAVIGATION_TAXONOMY: NavTaxonomyItem[] = [
  { name: 'Home', url: '/' },
  {
    name: 'Pageants',
    url: 'https://newsforever.in/category/beauty-pageant',
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E7E5E4] shadow-xs">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E5E4] py-1.5 px-4 sm:px-8 text-[11px] font-mono text-stone-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="hidden md:inline-block text-stone-300">|</span>
            <span className="hidden md:flex items-center gap-1 text-[#2563EB] font-bold tracking-tight">
              <Sparkles className="w-3 h-3" /> {tagline}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSearchClick}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#E7E5E4] hover:border-[#2563EB] text-stone-700 hover:text-[#2563EB] font-sans font-medium transition text-xs rounded-sm"
            >
              <Search className="w-3 h-3 text-[#2563EB]" />
              <span>Search...</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#FAF8F5] text-stone-400 font-mono text-[9px] border border-[#E7E5E4]">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo Component with Elegant Typography */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onGoHome) onGoHome();
            }}
            className="flex flex-col leading-none group shrink-0"
          >
            <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-stone-900 group-hover:text-[#2563EB] transition-colors duration-200">
              News<span className="text-[#2563EB]">Forever</span>
            </span>
            <span className="font-sans font-medium text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-stone-600 mt-0.5">
              {tagline}
            </span>
          </a>

          {/* Centered Desktop Nested Hover Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-stone-800">
            {NAVIGATION_TAXONOMY.map((item) => {
              const hasSubs = item.subcategories && item.subcategories.length > 0;
              const isActive = activePath === item.url;

              return (
                <div
                  key={item.name}
                  className="relative group py-2 px-3"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={item.url}
                    onClick={(e) => handleNavClick(e, item.url, item.name)}
                    className={`flex items-center gap-1 transition-all duration-200 ${
                      isActive
                        ? 'text-[#2563EB] font-extrabold border-b-2 border-[#2563EB] pb-0.5'
                        : 'text-stone-800 hover:text-[#2563EB]'
                    }`}
                  >
                    <span>{item.name}</span>
                    {hasSubs && (
                      <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-[#2563EB] transition-transform duration-200 group-hover:rotate-180" />
                    )}
                  </a>

                  {/* Accessible Nested Subcategory Dropdown */}
                  {hasSubs && (
                    <div className="absolute left-0 top-full hidden group-hover:block w-60 bg-white/95 backdrop-blur-md border border-[#E7E5E4] shadow-xl rounded-b-lg z-50 py-2 animate-fadeIn">
                      {item.subcategories?.map((sub) => (
                        <a
                          key={sub.name}
                          href={sub.url}
                          onClick={(e) => handleNavClick(e, sub.url, sub.name)}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#FAF8F5] hover:text-[#2563EB] transition flex items-center justify-between group/sub"
                        >
                          <span>{sub.name}</span>
                          <ChevronRight className="w-3 h-3 text-stone-300 group-hover/sub:text-[#2563EB] group-hover/sub:translate-x-0.5 transition-transform" />
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
              className="p-2 rounded-full hover:bg-stone-100 text-stone-700 hover:text-[#2563EB] transition lg:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#2563EB]" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                className="block text-sm font-bold uppercase tracking-wider text-stone-800 hover:text-[#2563EB] py-1.5"
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
                      className="block text-xs font-medium text-stone-600 hover:text-[#2563EB] py-1"
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
