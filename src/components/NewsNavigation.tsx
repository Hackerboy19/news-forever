import React, { useState } from 'react';

interface NewsNavigationProps {
  activeCategoryName?: string;
  onSelectCategory?: (categoryName: string, categoryUrl: string) => void;
}

export const NewsNavigation: React.FC<NewsNavigationProps> = ({
  activeCategoryName = 'Beauty Pageant',
  onSelectCategory,
}) => {
  const [activeTab, setActiveTab] = useState(activeCategoryName);

  // Tabs extracted directly from the Category List in the admin panel
  const tabs = [
    { name: 'Beauty Pageant', url: 'https://newsforever.in/category/beauty-pageant' },
    { name: 'Forever Star India Awards', url: 'https://newsforever.in/category/forever-star-india-awards' },
    { name: 'Products', url: 'https://newsforever.in/category/products' },
    { name: 'Astrology', url: 'https://newsforever.in/category/astrology' },
    { name: 'Business News', url: 'https://newsforever.in/category/business-news' },
    { name: 'Franchise', url: 'https://newsforever.in/category/franchise' },
    { name: 'Star India Kids Contest', url: 'https://newsforever.in/category/star-india-kids-contest-2026' },
    { name: 'Nominate Yourself', url: 'https://newsforever.in/category/nominate-yourself-award' },
    { name: 'Forever Star India', url: 'https://newsforever.in/category/forever-star-india' },
  ];

  return (
    <nav className="w-full bg-[#FAF8F5] border-b border-[#E7E5E4] py-4 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Horizontal scroll container for mobile, flex wrap for desktop */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 py-2">
          {tabs.map((tab) => {
            const isSelected = (activeTab || activeCategoryName) === tab.name;
            return (
              <a
                key={tab.name}
                href={tab.url}
                onClick={(e) => {
                  e.preventDefault(); 
                  setActiveTab(tab.name);
                  if (onSelectCategory) {
                    onSelectCategory(tab.name, tab.url);
                  }
                }}
                className={`
                  whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 ease-in-out
                  ${
                    isSelected
                      ? 'bg-[#991B1B] text-white shadow-xs font-bold'
                      : 'bg-white text-stone-700 border border-[#E7E5E4] hover:bg-stone-100 hover:text-stone-900 hover:border-stone-300 hover:shadow-xs'
                  }
                `}
                aria-current={isSelected ? 'page' : undefined}
              >
                {tab.name}
              </a>
            );
          })}
        </div>
      </div>

      {/* Embedded CSS to hide the scrollbar for a cleaner look on mobile */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </nav>
  );
};

export default NewsNavigation;
