import { CIBlog, CICategory, CITag, CIAdvertisement, CIActivityLog, CIUser, CISubscriber, CIImageLibrary, CISetting } from '../types';

export const initialCategories: CICategory[] = [
  {
    id: 1,
    category_name: "Pageants",
    slug: "pageants",
    status: 1,
    article_count: 14,
    meta_title: "Global Beauty Pageants News & Live Coverage 2026",
    meta_description: "Exclusive news, coronation updates, scores, and behind the scenes coverage of Miss Universe, Miss World, and international beauty pageants.",
    created_at: "2026-01-10 10:00:00",
  },
  {
    id: 2,
    category_name: "Finalists",
    slug: "finalists",
    status: 1,
    article_count: 9,
    meta_title: "Pageant Finalists Profiles & Interviews",
    meta_description: "Meet the top national delegates, regional queens, and international finalists competing across global platforms.",
    created_at: "2026-01-12 11:30:00",
  },
  {
    id: 3,
    category_name: "Fashion & Style",
    slug: "fashion-style",
    status: 1,
    article_count: 22,
    meta_title: "High Fashion Trends, Evening Gown Reviews & Red Carpet",
    meta_description: "In-depth haute couture analysis, evening gown breakdowns, designer interviews, and red carpet highlights.",
    created_at: "2026-01-15 09:15:00",
  },
  {
    id: 4,
    category_name: "Entertainment",
    slug: "entertainment",
    status: 1,
    article_count: 18,
    meta_title: "Entertainment & Celebrity News Updates",
    meta_description: "Breaking entertainment news, celebrity spotlights, performance reviews, and award show coverage.",
    created_at: "2026-01-18 14:20:00",
  },
  {
    id: 5,
    category_name: "Lifestyle & Culture",
    slug: "lifestyle-culture",
    status: 1,
    article_count: 11,
    meta_title: "Wellness, Global Culture & Advocacy Spotlights",
    meta_description: "Inspirational stories of advocacy, sustainable living, cultural preservation, and empowerment initiatives.",
    created_at: "2026-01-20 16:45:00",
  },
];

export const initialTags: CITag[] = [
  { id: 1, tag_name: "Miss Universe 2026", slug: "miss-universe-2026", created_at: "2026-01-01 00:00:00" },
  { id: 2, tag_name: "Coronation Night", slug: "coronation-night", created_at: "2026-01-02 00:00:00" },
  { id: 3, tag_name: "Evening Gown", slug: "evening-gown", created_at: "2026-01-03 00:00:00" },
  { id: 4, tag_name: "Haute Couture", slug: "haute-couture", created_at: "2026-01-04 00:00:00" },
  { id: 5, tag_name: "Preliminary Competition", slug: "preliminary-competition", created_at: "2026-01-05 00:00:00" },
  { id: 6, tag_name: "National Costume", slug: "national-costume", created_at: "2026-01-06 00:00:00" },
];

export const initialBlogs: CIBlog[] = [
  {
    id: 101,
    title: "Miss Universe 2026 Finalists Announced: High-Stakes Coronation Night Approaches",
    url: "miss-universe-2026-finalists-announced-coronation-night",
    short_content: "The selection committee has revealed the official top 30 finalists for Miss Universe 2026 after rigorous preliminary rounds in Bangkok.",
    content: `<p>The excitement has reached fever pitch as the Miss Universe Organization officially unveiled the Top 30 finalists for the 75th Miss Universe Competition. Staged across a week of intense preliminary competitions in Bangkok, Thailand, delegates showcased custom national costumes, swimwear confidence, and deep advocacy presentations.</p>
    
    <h2>Preliminary Competition Highlights & Scoring Standards</h2>
    <p>International judges noted unprecedented competition quality this cycle. Candidates demonstrated exceptional poise, eloquent public speaking, and impactful humanitarian initiatives ranging from climate resilience to global educational equity.</p>
    
    <h3>Evening Gown Preliminary Showcase</h3>
    <p>From shimmering hand-embroidered metallic silks to sustainable upcycled couture gowns, the evening gown segment proved to be a masterclass in global craftsmanship and theatrical elegance.</p>
    
    <h4>National Costume Extravaganza</h4>
    <p>Each delegate paid homage to their heritage through intricate wearable art, incorporating traditional textiles, artisanal beadwork, and technological light elements.</p>
    
    <h5>Judges & Selection Panel Insights</h5>
    <p>The panel praised the intelligence and readiness of the candidates, emphasizing that the modern winner must lead as an authentic ambassador for change.</p>
    
    <h6>Final Predictions & Fan Favorite Voting</h6>
    <p>Global voting portals remain active until midnight preceding coronation night. Stay tuned for real-time live score updates on Global Gazette.</p>`,
    category_id: 1,
    category_name: "Pageants",
    tag_ids: [1, 2, 5],
    image: "assets/img/blog/2026/08/miss-universe-stage.jpg",
    alt_tag: "Miss Universe 2026 finalists standing on the preliminary stage in Bangkok",
    status: 1,
    is_featured: true,
    is_trending: true,
    author_id: 1,
    author_name: "Elena Rostova",
    views: 45290,
    created_at: "2026-08-05 14:30:00",
    updated_at: "2026-08-06 09:12:00",
    
    // SEO & OpenGraph Fields
    meta_title: "Miss Universe 2026 Top 30 Finalists Unveiled | Official Coronation Coverage",
    meta_description: "Explore the full list of Miss Universe 2026 finalists, preliminary competition scores, national costume highlights, and coronation night forecast.",
    meta_keyword: "Miss Universe 2026, finalists, pageant news, coronation night, Bangkok, beauty queens",
    og_title: "Miss Universe 2026 Finalists Announced: High-Stakes Coronation Approaches",
    og_url: "https://news.globalgazette.com/article/miss-universe-2026-finalists-announced-coronation-night",
    og_description: "The official top 30 delegates revealed! Get full stats, gown breakdowns, and coronation predictions.",
    og_image: "assets/img/blog/2026/08/miss-universe-stage.jpg",

    // DOM Heading Hierarchy Fields
    h2_tag: "Preliminary Competition Highlights & Scoring Standards",
    h3_tag: "Evening Gown Preliminary Showcase",
    h4_tag: "National Costume Extravaganza",
    h5_tag: "Judges & Selection Panel Insights",
    h6_tag: "Final Predictions & Fan Favorite Voting",
  },
  {
    id: 102,
    title: "Behind the Velvet Curtain: Designing the Ultimate $2.5 Million Diamond Crown",
    url: "behind-velvet-curtain-designing-2-5-million-diamond-crown",
    short_content: "An exclusive look at the master jewelers behind the new legendary crown featuring rare blue sapphires and ethically sourced canary diamonds.",
    content: `<p>Crafted over 1,800 painstaking hours by master artisans, the newly commissioned 'Lumière de L'Humanité' crown stands as a pinnacle of high jewelry design. Incorporating over 800 carats of ethically mined gems, the crown symbolizes unity and resilience.</p>
    
    <h2>Artisanal Engineering & Master Gemology</h2>
    <p>Every stone was individually selected for hue uniformity and brilliance. The center stone, a flawless 52-carat royal blue sapphire, reflects the deep expanse of global waters.</p>
    
    <h3>Ethical Sourcing & Conflict-Free Guarantee</h3>
    <p>The house of jewelry confirmed full traceability from origin mines to final setting, setting a landmark sustainability standard for crown manufacturing.</p>
    
    <h4>Intricate Structural Assembly</h4>
    <p>Using lightweight titanium alloy framing embedded in 18k white gold, the crown balances grandeur with ergonomic comfort for long ceremonial wear.</p>
    
    <h5>Exhibition Tour Dates</h5>
    <p>Before coronation night, the crown will be showcased in Geneva, Paris, and Tokyo under maximum security vaults.</p>
    
    <h6>Legacy & Historical Significance</h6>
    <p>This marks the fifth crown redesign in pageant history, setting a modern record for gemological valuation.</p>`,
    category_id: 3,
    category_name: "Fashion & Style",
    tag_ids: [3, 4],
    image: "assets/img/blog/2026/08/diamond-crown-jewels.jpg",
    alt_tag: "High jewelry master craftsman inspecting rare diamond crown with magnifying loupe",
    status: 1,
    is_featured: false,
    is_trending: true,
    author_id: 2,
    author_name: "Marcus Vance",
    views: 28410,
    created_at: "2026-08-04 11:20:00",
    updated_at: "2026-08-04 11:20:00",

    meta_title: "Designing the $2.5M Diamond Crown: Behind the Scenes Jewelry Report",
    meta_description: "Discover how master jewelers created the Lumière de L'Humanité crown with 800 carats of rare sapphires and ethical canary diamonds.",
    meta_keyword: "diamond crown, pageant crown, luxury jewelry, sapphire, high fashion, master artisans",
    og_title: "Inside the Creation of the $2.5 Million Diamond Crown",
    og_url: "https://news.globalgazette.com/article/behind-velvet-curtain-designing-2-5-million-diamond-crown",
    og_description: "Over 1,800 hours of craftsmanship created this 800-carat masterpiece. Full photo tour.",
    og_image: "assets/img/blog/2026/08/diamond-crown-jewels.jpg",

    h2_tag: "Artisanal Engineering & Master Gemology",
    h3_tag: "Ethical Sourcing & Conflict-Free Guarantee",
    h4_tag: "Intricate Structural Assembly",
    h5_tag: "Exhibition Tour Dates",
    h6_tag: "Legacy & Historical Significance",
  },
  {
    id: 103,
    title: "Meet the Finalist: How Sophia Chen is Championing Youth STEM Literacy",
    url: "meet-finalist-sophia-chen-championing-youth-stem-literacy",
    short_content: "Delegate Sophia Chen shares her personal journey from biomedical engineer to national ambassador empowering young women in technology.",
    content: `<p>Combining a master's degree in robotics with an unwavering passion for youth advocacy, Sophia Chen represents a new generation of leaders redefining pageant platforms.</p>
    
    <h2>From Robotics Lab to National Ambassador</h2>
    <p>Before stepping onto the pageant stage, Sophia spent six years engineering accessible prosthetic limbs and establishing non-profit coding camps across rural communities.</p>
    
    <h3>The 'Code for Equality' Initiative</h3>
    <p>Her flagship foundation has reached over 45,000 students worldwide, providing free tablet computers and open-source science curricula.</p>
    
    <h4>Preliminary Interview Performance</h4>
    <p>In her closed-door judge interview, Sophia articulated how pageantry amplifies grassroots advocacy to global policymaking forums.</p>
    
    <h5>Community Engagement Metrics</h5>
    <p>Over $1.2M in educational grants raised through grassroots partnerships over the past 18 months.</p>
    
    <h6>Future Ambitions & Global Goals</h6>
    <p>Sophia plans to expand her AI education initiative across Southeast Asia and Latin America regardless of coronation outcome.</p>`,
    category_id: 2,
    category_name: "Finalists",
    tag_ids: [1, 6],
    image: "assets/img/blog/2026/08/sophia-chen-portrait.jpg",
    alt_tag: "Sophia Chen speaking at a youth technology summit in formal attire",
    status: 1,
    is_featured: true,
    is_trending: false,
    author_id: 1,
    author_name: "Elena Rostova",
    views: 19800,
    created_at: "2026-08-03 16:15:00",
    updated_at: "2026-08-03 16:15:00",

    meta_title: "Sophia Chen Profile: STEM Literacy Advocacy & Pageant Journey",
    meta_description: "Exclusive interview with finalist Sophia Chen on her robotics engineering background, non-profit initiatives, and vision for empowering youth.",
    meta_keyword: "Sophia Chen, STEM literacy, pageant finalist, advocacy, youth empowerment, robotics",
    og_title: "Meet Delegate Sophia Chen: Bridging Robotics Engineering and Pageantry",
    og_url: "https://news.globalgazette.com/article/meet-finalist-sophia-chen-championing-youth-stem-literacy",
    og_description: "From robotics research to global advocacy, learn how Sophia Chen is inspiring thousands.",
    og_image: "assets/img/blog/2026/08/sophia-chen-portrait.jpg",

    h2_tag: "From Robotics Lab to National Ambassador",
    h3_tag: "The 'Code for Equality' Initiative",
    h4_tag: "Preliminary Interview Performance",
    h5_tag: "Community Engagement Metrics",
    h6_tag: "Future Ambitions & Global Goals",
  },
  {
    id: 104,
    title: "Paris Couture Week 2026: Redefining Pageant Evening Gowns with Sustainable Silk",
    url: "paris-couture-week-2026-redefining-pageant-evening-gowns",
    short_content: "Top fashion houses in Paris collaborate with pageant delegates to pioneer zero-waste embroidery and organic silk gowns.",
    content: `<p>At Paris Couture Week, the traditional boundary between high fashion runways and pageant evening competition blurred in stunning fashion.</p>
    
    <h2>Zero-Waste Haute Couture Innovations</h2>
    <p>Designers showcased zero-waste pattern drafting techniques and organic plant-dyed silks that glisten under stage spotlights without synthetic micro-plastics.</p>
    
    <h3>Met Gala & Pageant Runway Crossovers</h3>
    <p>Leading couturiers noted that pageant gowns require unique structural engineering—balancing high mobility with dramatic silhouette presence.</p>
    
    <h4>Artisanal Embroidery Techniques</h4>
    <p>Hand-sewn glass beads and upcycled crystals created three-dimensional light diffraction effects during movement tests.</p>
    
    <h5>Fashion Critic Reviews</h5>
    <p>Vogue and Harper's Bazaar lauded the sustainability shift as the most significant evolution in evening gown history.</p>
    
    <h6>Where to View Full Lookbook</h6>
    <p>Check out our 4K high-resolution gallery showcasing all 24 couture gowns ahead of the final competition.</p>`,
    category_id: 3,
    category_name: "Fashion & Style",
    tag_ids: [3, 4],
    image: "assets/img/blog/2026/08/paris-couture-gown.jpg",
    alt_tag: "Model walking down a Paris runway wearing a dramatic emerald green sustainable silk evening gown",
    status: 1,
    is_featured: false,
    is_trending: false,
    author_id: 3,
    author_name: "Chloe Dupont",
    views: 14200,
    created_at: "2026-08-02 08:45:00",
    updated_at: "2026-08-02 08:45:00",

    meta_title: "Paris Couture Week 2026: Sustainable Evening Gown Revolution",
    meta_description: "Explore how top Paris couturiers are designing eco-friendly, zero-waste silk gowns for pageant contestants and red carpets.",
    meta_keyword: "Paris Couture Week, sustainable gowns, pageant fashion, evening gown, eco-fashion, Paris couture",
    og_title: "Paris Couture Week 2026: The New Era of Sustainable Pageant Gowns",
    og_url: "https://news.globalgazette.com/article/paris-couture-week-2026-redefining-pageant-evening-gowns",
    og_description: "Zero-waste silk, hand-stitched crystals, and sustainable luxury take over the runway.",
    og_image: "assets/img/blog/2026/08/paris-couture-gown.jpg",

    h2_tag: "Zero-Waste Haute Couture Innovations",
    h3_tag: "Met Gala & Pageant Runway Crossovers",
    h4_tag: "Artisanal Embroidery Techniques",
    h5_tag: "Fashion Critic Reviews",
    h6_tag: "Where to View Full Lookbook",
  },
  {
    id: 105,
    title: "Global Gazette Live Broadcast Schedule: Where to Watch Coronation Night Worldwide",
    url: "global-gazette-live-broadcast-schedule-where-to-watch",
    short_content: "Complete streaming listings, satellite channels, time-zone conversions, and official digital viewing portals for the global finals.",
    content: `<p>Never miss a second of coronation night! Here is your comprehensive broadcast map covering 160 countries across cable, satellite, and mobile streaming.</p>
    
    <h2>Worldwide Broadcast Partners & Streaming Platforms</h2>
    <p>Official broadcast rights have been granted to major global networks, alongside free high-definition live streaming on YouTube and Roku app channels.</p>
    
    <h3>Time Zone Conversion Cheat Sheet</h3>
    <p>Coronation night broadcasts live from Bangkok at 20:00 ICT (UTC+7). Match your local time zone below to catch red carpet arrivals.</p>
    
    <h4>Red Carpet Special Coverage</h4>
    <p>Tune in two hours before the main event for expert fashion commentary, delegate arrival interviews, and judges panel introductions.</p>
    
    <h5>Interactive Fan Reaction Rooms</h5>
    <p>Join live audio commentary rooms and participate in real-time polls through our official mobile app during the telecast.</p>
    
    <h6>Replay Availability & On-Demand Access</h6>
    <p>Full 4K unedited broadcasts will be archived on Global Gazette Video Vault immediately following the final crowning moment.</p>`,
    category_id: 4,
    category_name: "Entertainment",
    tag_ids: [1, 2],
    image: "assets/img/blog/2026/08/broadcast-truck-camera.jpg",
    alt_tag: "Professional television broadcasting equipment set up inside a arena production control room",
    status: 1,
    is_featured: false,
    is_trending: false,
    author_id: 2,
    author_name: "Marcus Vance",
    views: 31200,
    created_at: "2026-08-01 19:00:00",
    updated_at: "2026-08-01 19:00:00",

    meta_title: "How & Where to Watch Coronation Night 2026 Live Broadcast Guide",
    meta_description: "Full TV channel guide, live stream links, global time zone tables, and red carpet coverage schedule.",
    meta_keyword: "coronation night live stream, where to watch pageant, TV channels, broadcast schedule, red carpet",
    og_title: "Coronation Night 2026 Global Viewing Guide",
    og_url: "https://news.globalgazette.com/article/global-gazette-live-broadcast-schedule-where-to-watch",
    og_description: "Find local channel schedules, HD streaming links, and red carpet coverage in your region.",
    og_image: "assets/img/blog/2026/08/broadcast-truck-camera.jpg",

    h2_tag: "Worldwide Broadcast Partners & Streaming Platforms",
    h3_tag: "Time Zone Conversion Cheat Sheet",
    h4_tag: "Red Carpet Special Coverage",
    h5_tag: "Interactive Fan Reaction Rooms",
    h6_tag: "Replay Availability & On-Demand Access",
  }
];

export const initialAdvertisements: CIAdvertisement[] = [
  {
    id: 1,
    title: "Lumière Haute Couture - Paris Fashion Week Exclusive",
    advertisement_image: "assets/img/ads/lumiere-fashion-728x90.jpg",
    alt_tag: "Lumière Paris Haute Couture Collection Banner Ad 728x90",
    url: "https://example.com/lumiere-couture?ref=gazette",
    position: "top_banner",
    status: 1,
    click_count: 1420,
    impressions: 89400,
    created_at: "2026-01-15 10:00:00",
  },
  {
    id: 2,
    title: "Crown Jewels Luxury Timepieces - Official Sponsor",
    advertisement_image: "assets/img/ads/crown-jewels-300x600.jpg",
    alt_tag: "Crown Jewels Swiss Luxury Watch Collection Sticky Sidebar Ad 300x600",
    url: "https://example.com/crown-watches?ref=gazette",
    position: "sidebar_sticky",
    status: 1,
    click_count: 980,
    impressions: 64200,
    created_at: "2026-01-18 12:00:00",
  },
  {
    id: 3,
    title: "Aura Cosmetics - Radiant Glow Skincare Line",
    advertisement_image: "assets/img/ads/aura-cosmetics-728x250.jpg",
    alt_tag: "Aura Cosmetics Radiant Skin Glow In-Article Native Banner 728x250",
    url: "https://example.com/aura-glow?ref=gazette",
    position: "in_content",
    status: 1,
    click_count: 2150,
    impressions: 112000,
    created_at: "2026-01-20 09:30:00",
  },
  {
    id: 4,
    title: "Bangkok Luxury Resorts & Spa Official Host Hotel",
    advertisement_image: "assets/img/ads/bangkok-resort-970x90.jpg",
    alt_tag: "Bangkok Royal Palms Resort & Spa Footer Leaderboard Banner 970x90",
    url: "https://example.com/bangkok-resorts?ref=gazette",
    position: "footer_banner",
    status: 1,
    click_count: 730,
    impressions: 48900,
    created_at: "2026-01-25 15:00:00",
  },
];

export const initialActivityLogs: CIActivityLog[] = [
  {
    id: 901,
    user_id: 1,
    user_name: "Elena Rostova",
    activity: "Updated Blog Article #101 SEO Meta Tags and Heading Hierarchy",
    module: "Blog",
    ip_address: "192.168.1.45",
    created_at: "2026-08-06 09:12:00",
  },
  {
    id: 902,
    user_id: 2,
    user_name: "Marcus Vance",
    activity: "Created new Advertisement campaign 'Aura Cosmetics - Radiant Glow'",
    module: "Advertisement",
    ip_address: "192.168.1.88",
    created_at: "2026-08-05 18:40:00",
  },
  {
    id: 903,
    user_id: 1,
    user_name: "Elena Rostova",
    activity: "Published Article 'Miss Universe 2026 Finalists Announced'",
    module: "Blog",
    ip_address: "192.168.1.45",
    created_at: "2026-08-05 14:30:00",
  },
  {
    id: 904,
    user_id: 3,
    user_name: "Chloe Dupont",
    activity: "Added Category 'Lifestyle & Culture' with SEO defaults",
    module: "Category",
    ip_address: "192.168.2.14",
    created_at: "2026-08-04 10:15:00",
  },
  {
    id: 905,
    user_id: 1,
    user_name: "Elena Rostova",
    activity: "Updated System Settings: Primary Brand Logo and OpenGraph Defaults",
    module: "Setting",
    ip_address: "192.168.1.45",
    created_at: "2026-08-03 11:00:00",
  },
];

export const initialUsers: CIUser[] = [
  {
    id: 1,
    username: "elena_rostova",
    email: "elena.rostova@globalgazette.com",
    role: "Super Admin",
    avatar: "assets/img/avatars/elena.jpg",
    status: 1,
    last_login: "2026-08-07 05:10:00",
  },
  {
    id: 2,
    username: "marcus_vance",
    email: "marcus.vance@globalgazette.com",
    role: "Senior Editor",
    avatar: "assets/img/avatars/marcus.jpg",
    status: 1,
    last_login: "2026-08-06 18:22:00",
  },
  {
    id: 3,
    username: "chloe_dupont",
    email: "chloe.dupont@globalgazette.com",
    role: "SEO Specialist",
    avatar: "assets/img/avatars/chloe.jpg",
    status: 1,
    last_login: "2026-08-05 12:05:00",
  },
];

export const initialSubscribers: CISubscriber[] = [
  { id: 1, email: "fashion.insider@vogue.com", status: "subscribed", subscribed_at: "2026-08-01 10:00:00" },
  { id: 2, email: "media.buyer@aura-cosmetics.com", status: "subscribed", subscribed_at: "2026-08-02 14:20:00" },
  { id: 3, email: "coronation.fan@gmail.com", status: "subscribed", subscribed_at: "2026-08-04 09:15:00" },
  { id: 4, email: "press@pageantnews.org", status: "subscribed", subscribed_at: "2026-08-05 16:30:00" },
];

export const initialImages: CIImageLibrary[] = [
  { id: 1, file_name: "miss-universe-stage.jpg", file_path: "assets/img/blog/2026/08/miss-universe-stage.jpg", file_size: "1.2 MB", alt_tag: "Miss Universe 2026 preliminary stage in Bangkok", uploaded_by: "elena_rostova", created_at: "2026-08-05 14:00:00" },
  { id: 2, file_name: "diamond-crown-jewels.jpg", file_path: "assets/img/blog/2026/08/diamond-crown-jewels.jpg", file_size: "2.4 MB", alt_tag: "Master jeweler inspecting diamond crown with loupe", uploaded_by: "marcus_vance", created_at: "2026-08-04 11:00:00" },
  { id: 3, file_name: "sophia-chen-portrait.jpg", file_path: "assets/img/blog/2026/08/sophia-chen-portrait.jpg", file_size: "980 KB", alt_tag: "Sophia Chen speaking at youth tech summit", uploaded_by: "elena_rostova", created_at: "2026-08-03 16:00:00" },
  { id: 4, file_name: "paris-couture-gown.jpg", file_path: "assets/img/blog/2026/08/paris-couture-gown.jpg", file_size: "1.8 MB", alt_tag: "Emerald green sustainable silk evening gown on runway", uploaded_by: "chloe_dupont", created_at: "2026-08-02 08:30:00" },
];

export const initialSetting: CISetting = {
  id: 1,
  site_title: "Global Gazette & Pageant Times",
  site_logo: "assets/img/logo/brand-logo-dark.svg",
  favicon: "assets/img/favicon.ico",
  meta_default_title: "Global Gazette - International News & Pageant Portal",
  meta_default_description: "Premier news source for international beauty pageants, haute couture fashion, entertainment highlights, and delegate spotlights.",
  meta_default_keywords: "pageants, fashion, news, coronation, delegates, miss universe, miss world",
  facebook_url: "https://facebook.com/globalgazette",
  twitter_url: "https://twitter.com/globalgazette",
  instagram_url: "https://instagram.com/globalgazette",
  youtube_url: "https://youtube.com/globalgazette",
  updated_at: "2026-08-03 11:00:00",
};
