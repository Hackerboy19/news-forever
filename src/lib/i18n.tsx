import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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
    live247: 'Live 24x7',
    sponsored: 'Sponsored',
    advertisement: 'Advertisement',
    leadEditorial: 'Lead Editorial',
    exploreTopics: 'Explore Topics',
    filterLabel: 'Filter:',
    allCount: 'All',
    trendingStories: 'Trending & Latest News Stories',
    clickResult: 'Click result to view full article',
    searchPlaceholder: 'Search news, categories, tags…',
    webShare: 'Web Share',
    copyUrl: 'Copy URL',
    published: 'Published:',
    byAuthor: 'By',
    shareEditorial: 'Share This Editorial',
    subscribeThanks: 'Thank you for subscribing to News Forever updates!',
    paqAbout: 'What is this story about?',
    paqHighlights: 'What are the key highlights?',
    paqMore: 'Where can I read more {cat} coverage?',
    paqMoreAnswer: 'Browse the {cat} section of News Forever for all related stories, winner announcements and updates.',
    paqFees: 'Are there fees or extra charges to participate?',
    paqFeesAnswer: 'All charges are ONE-TIME payments collected only through the official registration page — there are no future, recurring or hidden charges beyond the level you select. Each level states exactly what it covers before you pay. For the current one-time fee amounts, see the official registration page or contact the organisers directly. News Forever never collects payments.',
    askPlaceholder: 'Ask a question about this article…',
    askButton: 'Ask',
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
    live247: 'लाइव 24x7',
    sponsored: 'प्रायोजित',
    advertisement: 'विज्ञापन',
    leadEditorial: 'मुख्य संपादकीय',
    exploreTopics: 'विषय खोजें',
    filterLabel: 'फ़िल्टर:',
    allCount: 'सभी',
    trendingStories: 'ट्रेंडिंग व ताज़ा खबरें',
    clickResult: 'पूरी खबर पढ़ने के लिए परिणाम चुनें',
    searchPlaceholder: 'समाचार, श्रेणियां, टैग खोजें…',
    webShare: 'साझा करें',
    copyUrl: 'लिंक कॉपी करें',
    published: 'प्रकाशित:',
    byAuthor: 'लेखक:',
    shareEditorial: 'यह लेख साझा करें',
    subscribeThanks: 'न्यूज़ फ़ॉरएवर अपडेट की सदस्यता लेने के लिए धन्यवाद!',
    paqAbout: 'यह खबर किस बारे में है?',
    paqHighlights: 'मुख्य बिंदु क्या हैं?',
    paqMore: '{cat} की और खबरें कहां पढ़ें?',
    paqMoreAnswer: 'सभी संबंधित खबरों, विजेता घोषणाओं और अपडेट के लिए न्यूज़ फ़ॉरएवर का {cat} खंड देखें।',
    paqFees: 'क्या भाग लेने के लिए शुल्क या अतिरिक्त प्रभार हैं?',
    paqFeesAnswer: 'सभी शुल्क एकमुश्त (one-time) हैं और केवल आधिकारिक पंजीकरण पृष्ठ के माध्यम से लिए जाते हैं — आपके चुने हुए स्तर के अलावा कोई भविष्य का, आवर्ती या छिपा हुआ शुल्क नहीं है। हर स्तर भुगतान से पहले स्पष्ट बताता है कि उसमें क्या शामिल है। वर्तमान एकमुश्त शुल्क राशि के लिए आधिकारिक पंजीकरण पृष्ठ देखें या आयोजकों से सीधे संपर्क करें। न्यूज़ फ़ॉरएवर कभी भुगतान एकत्र नहीं करता।',
    askPlaceholder: 'इस लेख के बारे में प्रश्न पूछें…',
    askButton: 'पूछें',
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
  /** Translated blog title lookup (server-translated, EN fallback until loaded). */
  tt: (title: string) => string;
  /** Register blog titles for batch server-side translation when HI is active. */
  registerTitles: (titles: string[]) => void;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => String(k),
  tt: (title) => title,
  registerTitles: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      // ?lang=hi URL param wins (indexable Hindi URLs), then saved preference
      const fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (fromUrl === 'hi' || fromUrl === 'en') return fromUrl;
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

  // Server-translated blog titles: components register the titles they show;
  // one batched request per new set, EN fallback until the map arrives.
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const requestedRef = useRef<Set<string>>(new Set());

  const registerTitles = (titles: string[]) => {
    if (lang !== 'hi') return;
    const fresh = [...new Set(titles)].filter((x) => x && !requestedRef.current.has(x));
    if (fresh.length === 0) return;
    fresh.forEach((x) => requestedRef.current.add(x));
    fetch('/api/translate-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles: fresh }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.translations) setTitleMap((prev) => ({ ...prev, ...d.translations }));
      })
      .catch(() => {});
  };

  // Language switch back to EN: keep cache, lookups just bypass below
  const tt = (title: string) => (lang === 'hi' ? titleMap[title] || title : title);

  return <I18nContext.Provider value={{ lang, setLang, t, tt, registerTitles }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
