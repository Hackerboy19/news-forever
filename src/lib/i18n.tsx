import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Lightweight EN | HI interface translation. Chrome labels, nav umbrellas
 * and section headers switch language; article content stays exactly as
 * authored in the CMS (single-language ci_blog rows — no rewriting).
 */

export type Lang = 'en' | 'hi';

const DICT = {
  en: {
    tagline: 'National & International News Portal',
    search: 'Search',
    subscribe: 'Subscribe',
    breaking: 'Breaking',
    featuredCover: 'Featured Cover Story',
    liveDigest: 'Live News Digest',
    mostRead: 'Most Read Headlines',
    latestNews: 'Latest News & Highlights',
    categoryFeed: 'Category Feed',
    showingArticles: 'Showing {n} articles',
    readStory: 'Read Story',
    viewAll: 'View All',
    trendingNow: 'Trending Now',
    topViewed: 'Top Viewed',
    relatedStories: 'Related Stories in',
    quickAnswers: 'Quick Answers — People Also Ask',
    newsletterTitle: 'Subscribe to News Forever Updates',
    newsletterDesc: 'Receive coronation scoring breakdowns, pageant highlights, award nominations, and breaking news directly to your inbox.',
    emailPlaceholder: 'Enter your email address...',
    categoryIndex: 'Category Index',
    topSubcategories: 'Top Subcategories',
    editorialOffice: 'Editorial Office',
    editorialBlurb: 'News Forever Bureau • Independent national & international journalism.',
    footerBlurb: 'Independent national & international news — politics, fashion & glamour, entertainment, business, lifestyle and astrology coverage.',
    allDates: 'All dates',
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    adminLogin: 'Admin Login',
    navMenu: 'Navigation Menu',
    // Nav umbrella labels
    'Home': 'Home',
    'Political News': 'Political News',
    'Fashion & Glamour': 'Fashion & Glamour',
    'Entertainment': 'Entertainment',
    'Business': 'Business',
    'Lifestyle & Products': 'Lifestyle & Products',
    'Astrology': 'Astrology',
    'About Us': 'About Us',
    'Contact Us': 'Contact Us',
  },
  hi: {
    tagline: 'राष्ट्रीय एवं अंतर्राष्ट्रीय समाचार पोर्टल',
    search: 'खोजें',
    subscribe: 'सदस्यता लें',
    breaking: 'ताज़ा खबर',
    featuredCover: 'मुख्य कवर स्टोरी',
    liveDigest: 'लाइव न्यूज़ डाइजेस्ट',
    mostRead: 'सबसे ज़्यादा पढ़ी गई खबरें',
    latestNews: 'ताज़ा समाचार एवं मुख्य अंश',
    categoryFeed: 'श्रेणी फ़ीड',
    showingArticles: '{n} लेख दिखाए जा रहे हैं',
    readStory: 'पूरी खबर पढ़ें',
    viewAll: 'सभी देखें',
    trendingNow: 'ट्रेंडिंग',
    topViewed: 'सर्वाधिक देखे गए',
    relatedStories: 'संबंधित खबरें —',
    quickAnswers: 'त्वरित उत्तर — लोग यह भी पूछते हैं',
    newsletterTitle: 'न्यूज़ फ़ॉरएवर अपडेट की सदस्यता लें',
    newsletterDesc: 'ताज़ा खबरें, प्रतियोगिता के मुख्य अंश, पुरस्कार नामांकन और ब्रेकिंग न्यूज़ सीधे अपने इनबॉक्स में पाएं।',
    emailPlaceholder: 'अपना ईमेल पता दर्ज करें...',
    categoryIndex: 'श्रेणी सूची',
    topSubcategories: 'प्रमुख उप-श्रेणियां',
    editorialOffice: 'संपादकीय कार्यालय',
    editorialBlurb: 'न्यूज़ फ़ॉरएवर ब्यूरो • स्वतंत्र राष्ट्रीय एवं अंतर्राष्ट्रीय पत्रकारिता।',
    footerBlurb: 'स्वतंत्र राष्ट्रीय एवं अंतर्राष्ट्रीय समाचार — राजनीति, फैशन व ग्लैमर, मनोरंजन, व्यापार, जीवनशैली और ज्योतिष कवरेज।',
    allDates: 'सभी तिथियां',
    today: 'आज',
    thisWeek: 'इस सप्ताह',
    thisMonth: 'इस महीने',
    adminLogin: 'एडमिन लॉगिन',
    navMenu: 'नेविगेशन मेनू',
    // Nav umbrella labels
    'Home': 'होम',
    'Political News': 'राजनीतिक समाचार',
    'Fashion & Glamour': 'फैशन और ग्लैमर',
    'Entertainment': 'मनोरंजन',
    'Business': 'व्यापार',
    'Lifestyle & Products': 'जीवनशैली और उत्पाद',
    'Astrology': 'ज्योतिष',
    'About Us': 'हमारे बारे में',
    'Contact Us': 'संपर्क करें',
  },
} as const;

export type DictKey = keyof (typeof DICT)['en'];

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a dict key; falls back to the key itself. {n} interpolation supported. */
  t: (key: DictKey | string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => String(k),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('nf_lang') as Lang) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    // Chrome-only toggle: crawlers always see the EN default; article
    // content, titles, meta and URLs never change with the toggle.
    // NOTE: deliberately NO hreflang tags — hreflang requires distinct
    // per-language URLs; emitting alternates that point to the same URL
    // is a malformed signal that can hurt rather than help rankings.
    document.documentElement.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    try {
      localStorage.setItem('nf_lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t: I18nValue['t'] = (key, vars) => {
    const table = DICT[lang] as Record<string, string>;
    let out = table[key as string] ?? (DICT.en as Record<string, string>)[key as string] ?? String(key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
    }
    return out;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
