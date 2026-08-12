import { CISetting } from '../types';

/**
 * Real News Forever site configuration (replaces the removed demo database).
 * Social URLs and branding match the live newsforever.in portal.
 */
export const siteSetting: CISetting = {
  id: 1,
  site_title: 'News Forever',
  site_logo: 'https://newsforever.in/assets/img/logo.png',
  favicon: 'https://newsforever.in/assets/img/favicon.png',
  meta_default_title: 'News Forever | Official News, Pageantry & FSIA Portal',
  meta_default_description:
    'Latest breaking news, beauty pageant updates, Forever Star India Awards, business, astrology, products and international editorial coverage.',
  meta_default_keywords:
    'news forever, beauty pageant, miss india, mrs india, forever star india awards, business news, astrology',
  facebook_url: 'https://facebook.com/newsforever.in',
  twitter_url: 'https://twitter.com/newsforever_in',
  instagram_url: 'https://instagram.com/newsforever.in',
  youtube_url: 'https://youtube.com/foreverstarindia',
  updated_at: '',
};
