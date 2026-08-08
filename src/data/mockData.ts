import { CIBlog, CICategory, CITag, CIAdvertisement, CIActivityLog, CIUser, CISubscriber, CIImageLibrary, CISetting } from '../types';

export const initialCategories: CICategory[] = [
  {
    id: 1,
    category_name: "Beauty Pageant",
    slug: "beauty-pageant",
    status: 1,
    article_count: 18,
    meta_title: "Beauty Pageants News & Live Coverage 2026 | News Forever",
    meta_description: "Exclusive news, coronation updates, scores, and behind the scenes coverage of Miss India, Mrs India, and Miss Forever Universe.",
    created_at: "2026-01-10 10:00:00",
  },
  {
    id: 2,
    category_name: "Forever Star India Awards",
    slug: "forever-star-india-awards",
    status: 1,
    article_count: 15,
    meta_title: "Forever Star India Awards Coverage & Winners | News Forever",
    meta_description: "Honoring extraordinary achievements across national pageantry, business, art, astrology, and leadership.",
    created_at: "2026-01-12 11:30:00",
  },
  {
    id: 3,
    category_name: "Products",
    slug: "products",
    status: 1,
    article_count: 12,
    meta_title: "Pageant Crowns, Beauty & Luxury Products Spotlights | News Forever",
    meta_description: "Curated spotlights on pageant crowns, sashes, cosmetics, high fashion apparel, and luxury product launches.",
    created_at: "2026-01-15 09:15:00",
  },
  {
    id: 4,
    category_name: "Astrology",
    slug: "astrology",
    status: 1,
    article_count: 22,
    meta_title: "Horoscopes, Zodiac Forecasts & Astro Raj Insights | News Forever",
    meta_description: "Daily horoscopes, astrological predictions by Astro Raj (Rajesh Agarwal), commodity forecasts, and zodiac insights.",
    created_at: "2026-01-18 14:20:00",
  },
  {
    id: 5,
    category_name: "Business News",
    slug: "business-news",
    status: 1,
    article_count: 16,
    meta_title: "Business News, Corporate Achievers & Entrepreneurship | News Forever",
    meta_description: "Breaking corporate updates, market analysis, startup spotlights, and women entrepreneurship news.",
    created_at: "2026-01-20 16:45:00",
  },
  {
    id: 6,
    category_name: "Franchise",
    slug: "franchise",
    status: 1,
    article_count: 9,
    meta_title: "Franchise Opportunities & Directorial Leads | News Forever",
    meta_description: "Explore national pageant franchise opportunities, city directorial leads, and event partnership models.",
    created_at: "2026-01-22 10:00:00",
  },
  {
    id: 7,
    category_name: "Star India Kids Contest",
    slug: "star-india-kids-contest-2026",
    status: 1,
    article_count: 14,
    meta_title: "Star India Kids Contest 2026 News & Registration | News Forever",
    meta_description: "Empowering young talents across dance, modeling, academics, and creative arts across India.",
    created_at: "2026-01-25 11:00:00",
  },
  {
    id: 8,
    category_name: "Nominate Yourself",
    slug: "nominate-yourself-award",
    status: 1,
    article_count: 8,
    meta_title: "Nominate Yourself for Awards & Pageant Titles | News Forever",
    meta_description: "Direct entry applications, self-nomination forms, and jury selection criteria for Super Woman & Super Hero awards.",
    created_at: "2026-01-28 15:30:00",
  },
  {
    id: 9,
    category_name: "Forever Star India",
    slug: "forever-star-india",
    status: 1,
    article_count: 25,
    meta_title: "Forever Star India Official Portal Updates | News Forever",
    meta_description: "Official announcements, state crownings, national directors, and grand finale galas.",
    created_at: "2026-01-30 09:00:00",
  },
];

export const initialTags: CITag[] = [
  { id: 1, tag_name: "Miss Forever Universe 2025", slug: "miss-forever-universe-2025", created_at: "2026-01-01 00:00:00" },
  { id: 2, tag_name: "Astro Raj Forecasts", slug: "astro-raj-forecasts", created_at: "2026-01-02 00:00:00" },
  { id: 3, tag_name: "Super Woman Awards", slug: "super-woman-awards", created_at: "2026-01-03 00:00:00" },
  { id: 4, tag_name: "Coronation Night Jaipur", slug: "coronation-night-jaipur", created_at: "2026-01-04 00:00:00" },
  { id: 5, tag_name: "FSIA Season 5", slug: "fsia-season-5", created_at: "2026-01-05 00:00:00" },
  { id: 6, tag_name: "Star India Kids 2026", slug: "star-india-kids-2026", created_at: "2026-01-06 00:00:00" },
];

export const initialBlogs: CIBlog[] = [
  {
    id: 1001,
    title: "Forensic Science Postgraduate Crowned Forever Miss Deoghar 2025; Nidhi Netra Says, 'Confidence Comes from Believing in Yourself'",
    url: "forensic-science-postgraduate-crowned-forever-miss-deoghar-2025-nidhi-netra",
    short_content: "Postgraduate in Forensic Science Nidhi Netra bags the prestigious Forever Miss Deoghar 2025 title, inspiring young women with her message on self-belief and academic dedication.",
    content: `<p>In an inspiring crowning ceremony hosted by Forever Star India, <strong>Nidhi Netra</strong>, a postgraduate scholar in Forensic Science, was officially crowned <strong>Forever Miss Deoghar 2025</strong>.</p>
    
    <h2>Academic Brilliance Meets Pageantry Excellence</h2>
    <p>Combining her sharp intellect in forensic investigation with grace and stage presence, Nidhi captivated the jury during the regional finale.</p>
    
    <h3>'Confidence Comes from Believing in Yourself'</h3>
    <p>Speaking post-victory, Nidhi Netra shared: <em>"True beauty is an expression of intellect, self-assurance, and purpose. Believing in yourself opens doors to every dream."</em></p>
    
    <h4>Preparation for National Finale</h4>
    <p>As state titleholder, Nidhi will represent Deoghar at the national Miss India Forever Star India 2026 grand finale in Jaipur.</p>`,
    category_id: 1,
    category_name: "Beauty Pageant",
    tag_ids: [1, 4],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Nidhi Netra crowned Forever Miss Deoghar 2025 smiling with crown",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 52100,
    created_at: "2026-08-07 18:00:00",
    updated_at: "2026-08-07 18:00:00",

    meta_title: "Nidhi Netra Crowned Forever Miss Deoghar 2025 | News Forever",
    meta_description: "Forensic Science postgraduate Nidhi Netra wins Forever Miss Deoghar 2025 title in Forever Star India pageant.",
    meta_keyword: "Nidhi Netra, Forever Miss Deoghar 2025, Forensic Science, beauty pageant, Forever Star India",
    og_title: "Forensic Science Postgraduate Crowned Forever Miss Deoghar 2025",
    og_url: "https://newsforever.in/forensic-science-postgraduate-crowned-forever-miss-deoghar-2025-nidhi-netra",
    og_description: "Nidhi Netra wins Forever Miss Deoghar 2025. Read her inspiring interview.",
    og_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Academic Brilliance Meets Pageantry Excellence",
    h3_tag: "Confidence Comes from Believing in Yourself",
    h4_tag: "Preparation for National Finale",
  },
  {
    id: 1002,
    title: "Veterinary Doctor Dr. Anjali Verma from Delhi Nominated for Super Woman Award 2026",
    url: "veterinary-doctor-dr-anjali-verma-delhi-nominated-super-woman-award-2026",
    short_content: "Acknowleged for her revolutionary animal welfare clinics and emergency rescue services, Delhi's Dr. Anjali Verma receives official nomination for the Super Woman Award 2026.",
    content: `<p>Delhi-based veterinary surgeon and animal welfare advocate <strong>Dr. Anjali Verma</strong> has been officially nominated for the prestigious <strong>Super Woman Award 2026</strong> under the Forever Star India Awards banner.</p>
    
    <h2>Dedicated Service to Urban & Rural Animal Welfare</h2>
    <p>Dr. Anjali has treated over 15,000 injured stray animals and pioneered mobile clinical care units operating 24x7 across the National Capital Region.</p>
    
    <h3>Recognizing Female Achievers & Trailblazers</h3>
    <p>The Super Woman Award jury panel commended Dr. Anjali's fearless commitment to medical ethics and community education.</p>`,
    category_id: 2,
    category_name: "Forever Star India Awards",
    tag_ids: [3, 5],
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Veterinary Doctor Dr Anjali Verma receiving medical nomination",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 44300,
    created_at: "2026-08-07 15:30:00",
    updated_at: "2026-08-07 15:30:00",

    meta_title: "Dr. Anjali Verma Nominated Super Woman Award 2026 | News Forever",
    meta_description: "Delhi veterinary doctor Dr. Anjali Verma receives nomination for Super Woman Award 2026 by Forever Star India.",
    meta_keyword: "Dr Anjali Verma, Super Woman Award 2026, Veterinary Doctor Delhi, FSIA, animal welfare",
    og_title: "Dr. Anjali Verma Nominated for Super Woman Award 2026",
    og_url: "https://newsforever.in/veterinary-doctor-dr-anjali-verma-delhi-nominated-super-woman-award-2026",
    og_description: "Veterinary surgeon Dr. Anjali Verma honored for exceptional animal healthcare service.",
    og_image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Dedicated Service to Urban & Rural Animal Welfare",
    h3_tag: "Recognizing Female Achievers & Trailblazers",
  },
  {
    id: 1003,
    title: "May Awardee List - 26 Achievers Selected for the Prestigious Star India Platform",
    url: "may-awardee-list-26-achievers-selected-star-india-platform",
    short_content: "Forever Star India releases the official May Awardee List honoring 26 national leaders across medicine, education, corporate leadership, and social service.",
    content: `<p>The official evaluation board of <strong>Forever Star India</strong> has formally published the <strong>May Awardee List</strong>, recognizing 26 outstanding achievers from across India.</p>
    
    <h2>National Recognition Across Multiple Fields</h2>
    <p>Selected from over 1,200 nominations, the 26 awardees represent exemplary work in healthcare, educational reform, environmental preservation, and social entrepreneurship.</p>
    
    <h3>Official Award Conferral Night in Jaipur</h3>
    <p>The awardees will receive their golden trophies and citations during the upcoming national gala in Jaipur presided over by Astro Raj.</p>`,
    category_id: 2,
    category_name: "Forever Star India Awards",
    tag_ids: [3, 5],
    image: "https://images.unsplash.com/photo-1531058240690-006c446962d8?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "May Awardee List 26 Achievers Star India Platform trophy showcase",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 38900,
    created_at: "2026-08-07 11:00:00",
    updated_at: "2026-08-07 11:00:00",

    meta_title: "May Awardee List: 26 Achievers Selected | News Forever",
    meta_description: "26 national achievers selected for the May Awardee List by Forever Star India platform.",
    meta_keyword: "May Awardee List, 26 Achievers, Forever Star India, FSIA awardees, Jaipur awards",
    og_title: "May Awardee List - 26 Achievers Selected for Star India Platform",
    og_url: "https://newsforever.in/may-awardee-list-26-achievers-selected-star-india-platform",
    og_description: "Read the official list of 26 achievers honored by Forever Star India.",
    og_image: "https://images.unsplash.com/photo-1531058240690-006c446962d8?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "National Recognition Across Multiple Fields",
    h3_tag: "Official Award Conferral Night in Jaipur",
  },
  {
    id: 101,
    title: "Dr. Srujana Devi Crowned Miss Forever Universe India 2025 in Grand Jaipur Gala",
    url: "dr-srujana-devi-crowned-miss-forever-universe-india-2025",
    short_content: "In a spectacular coronation night held in Jaipur, Dr. Srujana Devi bagged the prestigious Miss Forever Universe India 2025 title, impressing judges with her eloquence and medical humanitarian work.",
    content: `<p>In a historic coronation gala organized by Forever Star India at Jaipur, Dr. Srujana Devi was officially crowned <strong>Miss Forever Universe India 2025</strong> amidst applause from international delegates, fashion icons, and jury members.</p>
    
    <h2>Coronation Ceremony & Grand Finale Highlights</h2>
    <p>The finale showcased state representatives from across India competing in traditional ethnic attire, high-fashion evening gowns, and an intellectually challenging Q&A round focused on societal transformation and healthcare accessibility.</p>
    
    <h3>Dr. Srujana Devi's Inspiring Journey</h3>
    <p>A practicing physician and humanitarian advocate, Dr. Srujana emphasized her commitment to bringing free rural health screening clinics to underserved communities across India.</p>
    
    <h4>Jury Panel & Celebrity Guests</h4>
    <p>The panel included leading fashion designers, former beauty queens, and Astro Raj (Rajesh Agarwal), founder of Forever Star India, who praised the contestant's poise and visionary mindset.</p>
    
    <h5>Future Global Pageant Roadmap</h5>
    <p>As the winner of Miss Forever Universe India 2025, Dr. Srujana Devi will now represent the nation at the international stage in late 2026.</p>
    
    <h6>Official Media & Public Response</h6>
    <p>Congratulations poured in from across the country as fans and fashion critics lauded the jury's unanimous choice for the 2025 crown.</p>`,
    category_id: 1,
    category_name: "Beauty Pageant",
    tag_ids: [1, 4, 5],
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Dr Srujana Devi smiling at Miss Forever Universe India coronation night in Jaipur",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 48920,
    created_at: "2026-08-06 14:30:00",
    updated_at: "2026-08-07 09:12:00",
    
    // SEO & OpenGraph Fields
    meta_title: "Dr. Srujana Devi Crowned Miss Forever Universe India 2025 | News Forever",
    meta_description: "Read the full story of Dr. Srujana Devi winning Miss Forever Universe India 2025 in Jaipur. Includes jury insights, gown details, and future global plans.",
    meta_keyword: "Dr Srujana Devi, Miss Forever Universe India 2025, Forever Star India, pageant winner, Jaipur coronation, beauty queen",
    og_title: "Dr. Srujana Devi Crowned Miss Forever Universe India 2025 in Grand Jaipur Gala",
    og_url: "https://newsforever.in/article/dr-srujana-devi-crowned-miss-forever-universe-india-2025",
    og_description: "Doctor and humanitarian Dr. Srujana Devi wins the crown in Jaipur. Read full ceremony breakdown.",
    og_image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Coronation Ceremony & Grand Finale Highlights",
    h3_tag: "Dr. Srujana Devi's Inspiring Journey",
    h4_tag: "Jury Panel & Celebrity Guests",
    h5_tag: "Future Global Pageant Roadmap",
    h6_tag: "Official Media & Public Response",
  },
  {
    id: 102,
    title: "Saartha Sameer Gore Claims Miss Forever Universe 2025 Title",
    url: "saartha-sameer-gore-claims-miss-forever-universe-2025-title",
    short_content: "Saartha Sameer Gore was crowned Miss Forever Universe 2025 after a dazzling performance in evening gown couture and eloquent public advocacy.",
    content: `<p>The prestigious <strong>Miss Forever Universe 2025</strong> crown was awarded to Saartha Sameer Gore during an extraordinary evening celebrating female leadership, cultural pride, and international camaraderie.</p>
    
    <h2>Unanimous Jury Decision in Jaipur</h2>
    <p>Standing tall among national finalists, Saartha captivated the jury with her grace, environmental sustainability advocacy, and commanding stage presence during the evening gown showcase.</p>
    
    <h3>Empowerment & Advocacy Platform</h3>
    <p>Speaking post-coronation, Saartha dedicated her victory to young women striving to break barriers in leadership, business, and creative industries across South Asia.</p>
    
    <h4>Forever Star India Organizers Report</h4>
    <p>Organizer and founder Astro Raj highlighted that Season 5 set new benchmarks for contestant talent, digital voting participation, and international media reach.</p>
    
    <h5>Crowning Moments & Media Gallery</h5>
    <p>Watch full video highlights, photo galleries, and backstage interviews exclusively on News Forever.</p>`,
    category_id: 1,
    category_name: "Beauty Pageant",
    tag_ids: [1, 4],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Saartha Sameer Gore celebrating Miss Forever Universe 2025 coronation",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 39140,
    created_at: "2026-08-05 11:20:00",
    updated_at: "2026-08-05 11:20:00",

    meta_title: "Saartha Sameer Gore Claims Miss Forever Universe 2025 Title | News Forever",
    meta_description: "Saartha Sameer Gore wins Miss Forever Universe 2025. Discover her background, crowning moments, and advocacy projects.",
    meta_keyword: "Saartha Sameer Gore, Miss Forever Universe 2025, beauty queen, pageant coronation, Forever Star India",
    og_title: "Saartha Sameer Gore Wins Miss Forever Universe 2025",
    og_url: "https://newsforever.in/article/saartha-sameer-gore-claims-miss-forever-universe-2025-title",
    og_description: "Full coverage of Saartha Sameer Gore's historic victory at Miss Forever Universe 2025.",
    og_image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Unanimous Jury Decision in Jaipur",
    h3_tag: "Empowerment & Advocacy Platform",
    h4_tag: "Forever Star India Organizers Report",
    h5_tag: "Crowning Moments & Media Gallery",
    h6_tag: "Next Season Announcements",
  },
  {
    id: 103,
    title: "Astro Raj Predicts Gold & Silver Commodity Trends & Planetary Transits for 2026",
    url: "astro-raj-predicts-gold-silver-commodity-trends-2026",
    short_content: "Renowned astrologer Astro Raj (Rajesh Agarwal) releases his quarterly astrological analysis on market movements, precious metals, and zodiac financial alignment.",
    content: `<p>Founder of Forever Star India and globally acclaimed astrologer <strong>Astro Raj (Rajesh Agarwal)</strong> has published his comprehensive commodity market and zodiac forecast for 2026.</p>
    
    <h2>Jupiter & Saturn Planetary Alignment Impact on Precious Metals</h2>
    <p>According to Astro Raj, Jupiter's movement into favorable planetary houses signals significant movement in gold and silver market prices, presenting strategic opportunities for prudent investors.</p>
    
    <h3>Key Astrological Dates for Financial Growth</h3>
    <p>The report details specific lunar phases and solar transits during which business investments and precious metal acquisitions are astrologically favored.</p>
    
    <h4>Zodiac Predictions for Entrepreneurs & Investors</h4>
    <p>Detailed sign-by-sign breakdowns reveal how Fire, Earth, Air, and Water signs can align their business strategies with planetary positions.</p>
    
    <h5>Astrology's Role in Modern Financial Planning</h5>
    <p>Astro Raj explains how ancient Vedic principles provide holistic guidance when combined with modern market analytics.</p>`,
    category_id: 4,
    category_name: "Astrology",
    tag_ids: [2],
    image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Celestial zodiac chart and gold coins symbolizing Astro Raj market forecast",
    status: 1,
    is_featured: false,
    is_trending: true,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 31200,
    created_at: "2026-08-04 16:15:00",
    updated_at: "2026-08-04 16:15:00",

    meta_title: "Astro Raj Predicts Gold & Silver Commodity Trends 2026 | News Forever",
    meta_description: "Renowned astrologer Astro Raj releases key commodity market predictions, gold & silver trends, and zodiac financial insights.",
    meta_keyword: "Astro Raj, Rajesh Agarwal, gold predictions, silver forecast, commodity astrology, horoscopes, market trends",
    og_title: "Astro Raj Commodity & Precious Metals Forecast 2026",
    og_url: "https://newsforever.in/article/astro-raj-predicts-gold-silver-commodity-trends-2026",
    og_description: "Read Astro Raj's expert astrological analysis on market transits and precious metals.",
    og_image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Jupiter & Saturn Planetary Alignment Impact on Precious Metals",
    h3_tag: "Key Astrological Dates for Financial Growth",
    h4_tag: "Zodiac Predictions for Entrepreneurs & Investors",
    h5_tag: "Astrology's Role in Modern Financial Planning",
    h6_tag: "Consultation & Direct Booking Guidelines",
  },
  {
    id: 104,
    title: "Forever Star India Awards Season 5: Honoring Real Super Heroes & Women Achievers in Jaipur",
    url: "forever-star-india-awards-season-5-super-heroes-women-achievers",
    short_content: "The Season 5 Forever Star India Awards celebrated outstanding icons in art, medicine, education, corporate leadership, and social service in a star-studded gala.",
    content: `<p>The 5th edition of the <strong>Forever Star India Awards (FSIA)</strong> brought together trailblazers, business leaders, doctors, artists, and humanitarians under one roof in Jaipur to celebrate remarkable accomplishments.</p>
    
    <h2>Recognizing Excellence Across 50+ Categories</h2>
    <p>From 'Super Woman Awards' to 'Real Super Heroes' and 'National Excellence Awards', the evening honored unsung heroes and prominent industry figures from every state of India.</p>
    
    <h3>Empowering Female Leaders & Social Innovators</h3>
    <p>Keynote speakers highlighted how FSIA platforms provide national recognition, networking, and media visibility to women entrepreneurs and community leaders.</p>
    
    <h4>Jury Selection & Transparency Standards</h4>
    <p>The rigorous evaluation process considered innovation, measurable social impact, community recommendation, and personal dedication.</p>
    
    <h5>Grand Gala Evening Highlights</h5>
    <p>Distinguished guests enjoyed musical performances, runway presentations, and the official trophy conferral ceremony.</p>`,
    category_id: 2,
    category_name: "Forever Star India Awards",
    tag_ids: [3, 5],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Forever Star India Awards ceremony stage with trophy presentation",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 29850,
    created_at: "2026-08-03 08:30:00",
    updated_at: "2026-08-03 08:30:00",

    meta_title: "Forever Star India Awards Season 5 Winners & Highlights | News Forever",
    meta_description: "Explore the full coverage of Forever Star India Awards Season 5 in Jaipur, featuring Super Woman and Real Super Heroes award recipients.",
    meta_keyword: "Forever Star India Awards, FSIA Season 5, Super Woman Awards, Real Super Heroes, award winners Jaipur",
    og_title: "Forever Star India Awards Season 5 Honors National Achievers",
    og_url: "https://newsforever.in/article/forever-star-india-awards-season-5-super-heroes-women-achievers",
    og_description: "Over 100 national icons recognized at FSIA Season 5 in Jaipur. Read full winner list.",
    og_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Recognizing Excellence Across 50+ Categories",
    h3_tag: "Empowering Female Leaders & Social Innovators",
    h4_tag: "Jury Selection & Transparency Standards",
    h5_tag: "Grand Gala Evening Highlights",
    h6_tag: "Nominations Open for Season 6",
  },
  {
    id: 105,
    title: "Dr. Rachna Awasthi Honored as Best Astrologer in Lucknow at FSIA Awards Ceremony",
    url: "dr-rachna-awasthi-honored-best-astrologer-lucknow-fsia-awards",
    short_content: "Renowned Vedic astrologer Dr. Rachna Awasthi was bestowed the 'Best Astrologer in Lucknow' award during the prestigious Forever Star India Awards.",
    content: `<p>In recognition of her decades of selfless service, accurate Vedic consultations, and spiritual guidance, <strong>Dr. Rachna Awasthi</strong> was conferred the <em>Best Astrologer in Lucknow</em> award by Forever Star India.</p>
    
    <h2>A Milestone in Astrological Research & Practice</h2>
    <p>Dr. Rachna Awasthi has guided thousands of individuals across career planning, marital harmony, gemstone recommendations, and Vastu consultations.</p>
    
    <h3>Presented by Astro Raj & FSIA Panel</h3>
    <p>The award trophy and citation certificate were presented by Astro Raj (Rajesh Agarwal), founder of Forever Star India, who commended her contributions to preserving classical Vedic wisdom.</p>
    
    <h4>Impact on Spiritual Wellness</h4>
    <p>Upon receiving the honor, Dr. Rachna expressed her gratitude to her clients and dedicated the award to promoting holistic spiritual wellness across Uttar Pradesh and beyond.</p>`,
    category_id: 2,
    category_name: "Forever Star India Awards",
    tag_ids: [2, 3, 5],
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Dr Rachna Awasthi receiving Best Astrologer in Lucknow award at FSIA gala",
    status: 1,
    is_featured: false,
    is_trending: false,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 18450,
    created_at: "2026-08-02 12:45:00",
    updated_at: "2026-08-02 12:45:00",

    meta_title: "Dr. Rachna Awasthi Honored Best Astrologer Lucknow | News Forever",
    meta_description: "Dr. Rachna Awasthi receives the Best Astrologer in Lucknow award at Forever Star India Awards ceremony.",
    meta_keyword: "Dr Rachna Awasthi, Best Astrologer Lucknow, FSIA, Forever Star India Awards, astrology award",
    og_title: "Dr. Rachna Awasthi Awarded Best Astrologer in Lucknow at FSIA",
    og_url: "https://newsforever.in/article/dr-rachna-awasthi-honored-best-astrologer-lucknow-fsia-awards",
    og_description: "Read about Dr. Rachna Awasthi's recognition at the Forever Star India Awards gala.",
    og_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "A Milestone in Astrological Research & Practice",
    h3_tag: "Presented by Astro Raj & FSIA Panel",
    h4_tag: "Impact on Spiritual Wellness",
    h5_tag: "Client Testimonials & Future Projects",
    h6_tag: "Contact & Consultation Details",
  },
  {
    id: 106,
    title: "Star India Kids Contest 2026: National Talent Registration Opens for Dance, Modeling & Arts",
    url: "star-india-kids-contest-2026-national-talent-registration-opens",
    short_content: "Forever Star India launches the 2026 edition of Star India Kids Contest, offering young prodigies nationwide a premier platform to showcase talent in modeling, dance, and creative arts.",
    content: `<p>The official nationwide registration for <strong>Star India Kids Contest 2026</strong> is now live! Designed to foster confidence, creativity, and stage presence in young children, this annual event attracts thousands of young participants from across India.</p>
    
    <h2>Categories & Age Groups</h2>
    <p>Open for children aged 3 to 15 years, the contest features competitive segments in Kids Fashion Modeling, Solo & Group Dance, Fine Arts, and Public Speaking.</p>
    
    <h3>Mentorship & Expert Grooming Workshops</h3>
    <p>Selected kids will undergo virtual and offline grooming workshops led by celebrity choreographers, personality coaches, and pageant mentors.</p>
    
    <h4>State Auditions & Finale Stage</h4>
    <p>State-level auditions will take place across major metro cities before culminating in the national grand finale in Jaipur.</p>`,
    category_id: 7,
    category_name: "Star India Kids Contest",
    tag_ids: [6],
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Young talented kids smiling on stage during Star India Kids Contest rehearsal",
    status: 1,
    is_featured: true,
    is_trending: false,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 22100,
    created_at: "2026-08-01 10:15:00",
    updated_at: "2026-08-01 10:15:00",

    meta_title: "Star India Kids Contest 2026 Registration Live | News Forever",
    meta_description: "Register your child for Star India Kids Contest 2026. Categories include modeling, dance, arts, and public speaking.",
    meta_keyword: "Star India Kids Contest 2026, kids modeling India, kids dance competition, Forever Star India, talent hunt",
    og_title: "Star India Kids Contest 2026 National Talent Registration Opens",
    og_url: "https://newsforever.in/article/star-india-kids-contest-2026-national-talent-registration-opens",
    og_description: "Register for Star India Kids Contest 2026. Empowering children through dance, fashion, and creative confidence.",
    og_image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Categories & Age Groups",
    h3_tag: "Mentorship & Expert Grooming Workshops",
    h4_tag: "State Auditions & Finale Stage",
    h5_tag: "Prizes & Trophy Recognition",
    h6_tag: "How to Apply Online",
  },
  {
    id: 107,
    title: "Yamini Sharma Conferred Super Woman 2025 Award in Astrologer & Spiritual Guide Category",
    url: "yamini-sharma-conferred-super-woman-2025-award-astrologer",
    short_content: "Astrologer Yamini Sharma received the prestigious Super Woman 2025 award at the Forever Star India ceremony for her visionary spiritual guidance and women empowerment work.",
    content: `<p>In a grand celebration honoring exemplary women leaders, <strong>Yamini Sharma</strong> was awarded the <em>Super Woman 2025</em> title in the Astrologer and Spiritual Guide category during the Forever Star India Awards.</p>
    
    <h2>Celebrating Women Empowerment in Spiritual Science</h2>
    <p>Yamini Sharma's dedicated counseling has transformed thousands of lives, providing clarity, mental peace, and practical astrological remedies to families and professional women.</p>
    
    <h3>Presented by Astro Raj & Jury Board</h3>
    <p>The award was presented by Astro Raj (Rajesh Agarwal), founder of Forever Star India, who praised Yamini Sharma's dedication to elevating astrology as an empowering science.</p>`,
    category_id: 2,
    category_name: "Forever Star India Awards",
    tag_ids: [2, 3],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Yamini Sharma receiving Super Woman 2025 award trophy",
    status: 1,
    is_featured: false,
    is_trending: false,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 15600,
    created_at: "2026-07-31 15:20:00",
    updated_at: "2026-07-31 15:20:00",

    meta_title: "Yamini Sharma Awarded Super Woman 2025 Astrologer | News Forever",
    meta_description: "Yamini Sharma wins Super Woman 2025 award in the Astrologer category at Forever Star India Awards.",
    meta_keyword: "Yamini Sharma, Super Woman 2025, Forever Star India Awards, astrologer award, spiritual guide",
    og_title: "Yamini Sharma Awarded Super Woman 2025 Title",
    og_url: "https://newsforever.in/article/yamini-sharma-conferred-super-woman-2025-award-astrologer",
    og_description: "Yamini Sharma honored at Forever Star India Awards 2025. Read full story.",
    og_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Celebrating Women Empowerment in Spiritual Science",
    h3_tag: "Presented by Astro Raj & Jury Board",
    h4_tag: "Community Reactions & Testimonials",
    h5_tag: "Vision for Spiritual Counseling",
    h6_tag: "Contact Information",
  },
  {
    id: 108,
    title: "How Astrology Plays a Key Role in Beauty Pageant Success: Insights by Astro Raj",
    url: "how-astrology-plays-key-role-beauty-pageant-success-astro-raj",
    short_content: "Astro Raj (Rajesh Agarwal) explains how planetary transits, aura alignment, and lucky colors influence confidence and stage presence in competitive pageantry.",
    content: `<p>In an exclusive editorial for News Forever, founder and master astrologer <strong>Astro Raj (Rajesh Agarwal)</strong> discusses the fascinating intersection between Vedic astrology and high-stakes beauty pageants.</p>
    
    <h2>Planetary Transits & Stage Presence Alignment</h2>
    <p>Astro Raj explains how Venus (planet of beauty and charm) and Mercury (planet of speech and intellect) play a pivotal role during judge Q&A rounds and coronation night performances.</p>
    
    <h3>Choosing Lucky Colors & Gemstone Harmony</h3>
    <p>Discover how selecting evening gown shades and personal accessories aligned with one's astrological chart enhances charisma and positive energy on stage.</p>
    
    <h4>Mindset & Spiritual Balance Before the Finale</h4>
    <p>Practical breathing techniques, meditation routines, and astrological guidance designed to keep contestants calm and focused under camera lights.</p>`,
    category_id: 4,
    category_name: "Astrology",
    tag_ids: [1, 2, 4],
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Astro Raj explaining planetary alignment charts for pageant delegates",
    status: 1,
    is_featured: false,
    is_trending: true,
    author_id: 1,
    author_name: "Rajesh Agarwal (Astro Raj)",
    views: 27400,
    created_at: "2026-07-29 11:10:00",
    updated_at: "2026-07-29 11:10:00",

    meta_title: "Role of Astrology in Pageant Success | Astro Raj Insights | News Forever",
    meta_description: "Explore how Vedic astrology and planetary alignments influence beauty pageant performance, stage presence, and confidence with Astro Raj.",
    meta_keyword: "Astro Raj, Rajesh Agarwal, astrology in pageantry, Venus transit, lucky colors, pageant confidence, Vedic astrology",
    og_title: "How Astrology Influences Beauty Pageant Success: Astro Raj Explains",
    og_url: "https://newsforever.in/article/how-astrology-plays-key-role-beauty-pageant-success-astro-raj",
    og_description: "Learn how Venus, Mercury, and personal aura chart alignments impact pageant performance.",
    og_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Planetary Transits & Stage Presence Alignment",
    h3_tag: "Choosing Lucky Colors & Gemstone Harmony",
    h4_tag: "Mindset & Spiritual Balance Before the Finale",
    h5_tag: "Case Studies of Past Pageant Champions",
    h6_tag: "Personal Astrology Consultations with Astro Raj",
  },
  {
    id: 109,
    title: "Forever Star India Season 6 Grand Finale Dates Unveiled: Over 100 State Winners to Compete",
    url: "forever-star-india-season-6-grand-finale-dates-unveiled",
    short_content: "Official dates for Forever Star India Season 6 have been announced. Over 100 state winners across Miss India, Mrs India, and Miss Teen India will gather in Jaipur.",
    content: `<p>The management of <strong>Forever Star India</strong> has officially announced the schedule for Season 6 Grand Finale events. Set to take place in Jaipur, the multi-day extravaganza will crown the new Miss India, Mrs India, and Miss Teen India champions.</p>
    
    <h2>Event Schedule & State Crowning Gala</h2>
    <p>Delegates representing all 28 states and union territories of India will undergo intensive grooming workshops, photoshoots, and preliminary rounds before the televised finale.</p>
    
    <h3>National Directors & Jury Panel</h3>
    <p>International fashion choreographers, celebrity judges, and former FSIA titleholders will evaluate the candidates on intelligence, leadership, and stage presence.</p>`,
    category_id: 9,
    category_name: "Forever Star India",
    tag_ids: [4, 5],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Forever Star India Season 6 grand stage preparation in Jaipur",
    status: 1,
    is_featured: true,
    is_trending: false,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 21300,
    created_at: "2026-07-28 09:30:00",
    updated_at: "2026-07-28 09:30:00",

    meta_title: "Forever Star India Season 6 Grand Finale Dates Unveiled | News Forever",
    meta_description: "Forever Star India Season 6 grand finale dates announced. Over 100 state representatives to compete in Jaipur.",
    meta_keyword: "Forever Star India Season 6, FSIA Season 6, pageant finale Jaipur, Miss India 2026, Mrs India 2026",
    og_title: "Forever Star India Season 6 Finale Dates Announced",
    og_url: "https://newsforever.in/article/forever-star-india-season-6-grand-finale-dates-unveiled",
    og_description: "Jaipur prepares for FSIA Season 6 grand finale. Read schedule and event breakdown.",
    og_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Event Schedule & State Crowning Gala",
    h3_tag: "National Directors & Jury Panel",
    h4_tag: "Grooming & Wardrobe Partners",
    h5_tag: "Live Streaming & Voting Guidelines",
    h6_tag: "Ticket & Passes Booking Information",
  },
  {
    id: 110,
    title: "Couture Pageant Crowns & Sashes 2026: Craftsmanship Behind the Forever Star India Tiaras",
    url: "couture-pageant-crowns-sashes-2026-craftsmanship-forever-star-india",
    short_content: "An exclusive look at the master jewelers and embroiderers crafting custom handcrafted crowns and silk sashes for Forever Star India champions.",
    content: `<p>Every crown awarded by <strong>Forever Star India</strong> is a masterpiece of artisan jewelry design. Hand-set with sparkling crystals and royal blue accents, the tiaras symbolize dignity and empowerment.</p>
    
    <h2>Artisanal Design & Handcrafted Setting</h2>
    <p>Crafted over hundreds of hours, each crown features ergonomic lightweight silver-alloy framing to ensure maximum elegance during ceremonial wear.</p>
    
    <h3>Embroidered Gold Thread Sashes</h3>
    <p>Custom silk sashes are hand-embroidered with metallic gold thread, bearing titleholder state names and official FSIA insignia.</p>`,
    category_id: 3,
    category_name: "Products",
    tag_ids: [4, 5],
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80",
    alt_tag: "Handcrafted crystal pageant crown on display for Forever Star India",
    status: 1,
    is_featured: false,
    is_trending: false,
    author_id: 2,
    author_name: "News Forever Editorial Team",
    views: 16800,
    created_at: "2026-07-25 14:00:00",
    updated_at: "2026-07-25 14:00:00",

    meta_title: "Craftsmanship of Forever Star India Crowns & Sashes | News Forever",
    meta_description: "Discover how artisan jewelers create the signature handcrafted crowns and gold-embroidered sashes for Forever Star India pageants.",
    meta_keyword: "pageant crowns, Forever Star India tiara, pageant sashes, couture jewelry, luxury crowns",
    og_title: "Crafting the Iconic Forever Star India Pageant Crowns",
    og_url: "https://newsforever.in/article/couture-pageant-crowns-sashes-2026-craftsmanship-forever-star-india",
    og_description: "Inside the atelier: how handcrafted tiaras and sashes are brought to life.",
    og_image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80",

    h2_tag: "Artisanal Design & Handcrafted Setting",
    h3_tag: "Embroidered Gold Thread Sashes",
    h4_tag: "Care & Preservation Standards",
    h5_tag: "Crown Unveiling Events",
    h6_tag: "Order & Customization Requests",
  },
];

export const initialAdvertisements: CIAdvertisement[] = [
  {
    id: 1,
    title: "Forever Star India Season 6 Registrations Open",
    advertisement_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    alt_tag: "Forever Star India Season 6 Banner",
    url: "https://newsforever.in/",
    position: "top_banner",
    status: 1,
    click_count: 4850,
    impressions: 142000,
    created_at: "2026-08-01 00:00:00",
  },
  {
    id: 2,
    title: "Astro Raj Personal Consultation Booking",
    advertisement_image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=600&auto=format&fit=crop&q=80",
    alt_tag: "Astro Raj Consultation Banner",
    url: "https://newsforever.in/",
    position: "sidebar_sticky",
    status: 1,
    click_count: 3120,
    impressions: 89400,
    created_at: "2026-08-01 00:00:00",
  },
];

export const initialActivityLogs: CIActivityLog[] = [
  {
    id: 1,
    user_id: 1,
    user_name: "Rajesh Agarwal (Astro Raj)",
    activity: "Article Published: Dr. Srujana Devi Crowned Miss Forever Universe India 2025",
    module: "Blog",
    ip_address: "103.21.124.8",
    created_at: "2026-08-06 14:30:00",
  },
  {
    id: 2,
    user_id: 2,
    user_name: "Editorial Team",
    activity: "Updated OpenGraph meta tags for newsforever.in articles",
    module: "Blog",
    ip_address: "103.21.124.9",
    created_at: "2026-08-05 10:15:00",
  },
];

export const initialUsers: CIUser[] = [
  {
    id: 1,
    username: "astro_raj",
    email: "rajesh@newsforever.in",
    role: "Super Admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: 1,
    last_login: "2026-08-07 05:10:00",
  },
  {
    id: 2,
    username: "news_editor",
    email: "editor@newsforever.in",
    role: "Senior Editor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: 1,
    last_login: "2026-08-06 18:22:00",
  },
];

export const initialSubscribers: CISubscriber[] = [
  { id: 1, email: "reader.pageant@gmail.com", status: "subscribed", subscribed_at: "2026-08-01 10:00:00" },
  { id: 2, email: "media@newsforever.in", status: "subscribed", subscribed_at: "2026-08-02 14:20:00" },
  { id: 3, email: "coronation.fan@gmail.com", status: "subscribed", subscribed_at: "2026-08-04 09:15:00" },
];

export const initialImages: CIImageLibrary[] = [
  { id: 1, file_name: "srujana-devi-coronation.jpg", file_path: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1000&auto=format&fit=crop&q=80", file_size: "1.2 MB", alt_tag: "Dr Srujana Devi Miss Forever Universe India 2025", uploaded_by: "astro_raj", created_at: "2026-08-06 14:00:00" },
  { id: 2, file_name: "saartha-gore-crown.jpg", file_path: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80", file_size: "2.4 MB", alt_tag: "Saartha Sameer Gore Miss Forever Universe 2025", uploaded_by: "news_editor", created_at: "2026-08-05 11:00:00" },
];

export const initialSetting: CISetting = {
  id: 1,
  site_title: "News Forever",
  site_logo: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&auto=format&fit=crop&q=80",
  favicon: "https://newsforever.in/favicon.ico",
  meta_default_title: "News Forever | Official News, Pageantry & FSIA Portal",
  meta_default_description: "News Forever is the official news portal covering Forever Star India Awards, Miss India, Mrs India, Star India Kids Contest, Astrology forecasts by Astro Raj, Business news, and Product reviews.",
  meta_default_keywords: "News Forever, Forever Star India, Miss India, Mrs India, FSIA, Astro Raj, Astrology, Beauty Pageant, Super Woman Awards, Star India Kids",
  facebook_url: "https://facebook.com/newsforever.in",
  twitter_url: "https://twitter.com/newsforeverin",
  instagram_url: "https://instagram.com/newsforever.in",
  youtube_url: "https://youtube.com/foreverstarindia",
  updated_at: "2026-08-07 11:00:00",
};
