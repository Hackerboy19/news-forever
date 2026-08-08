import React, { useEffect } from 'react';
import { CIBlog } from '../types';

export interface SEOProps {
  article?: CIBlog | null;
  title?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  image?: string;
  defaultTitle?: string;
  siteName?: string;
}

export type SEOManagerProps = SEOProps;

export const SEOManager: React.FC<SEOProps> = ({
  article,
  title,
  meta_title,
  meta_description,
  meta_keyword,
  og_title,
  og_description,
  og_image,
  og_url,
  image,
  defaultTitle = 'News Forever - International Organic News 24x7',
  siteName = 'News Forever',
}) => {
  useEffect(() => {
    // Extract props from article object if present, else fallback to individual props
    const activeTitle = article?.meta_title || article?.title || meta_title || title;
    const finalTitle = activeTitle ? `${activeTitle} | ${siteName}` : defaultTitle;
    document.title = finalTitle;

    // Helper function to update or create meta tags
    const setMetaTag = (attribute: 'name' | 'property', attrValue: string, contentValue?: string) => {
      if (!contentValue) return;
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // Helper function to update or create link tags
    const setLinkTag = (relValue: string, hrefValue?: string) => {
      if (!hrefValue) return;
      let element = document.querySelector(`link[rel="${relValue}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', relValue);
        document.head.appendChild(element);
      }
      element.setAttribute('href', hrefValue);
    };

    // 2. Standard Meta Tags
    const activeDesc = article?.meta_description || article?.short_content || meta_description;
    const finalDesc = activeDesc || 'News Forever provides 24x7 organic coverage on beauty pageants, national awards, business, and lifestyle news.';
    setMetaTag('name', 'description', finalDesc);

    const activeKeywords = article?.meta_keyword || meta_keyword;
    if (activeKeywords) {
      setMetaTag('name', 'keywords', activeKeywords);
    }

    // 3. Open Graph Meta Tags
    const activeOgTitle = article?.og_title || og_title || activeTitle || finalTitle;
    setMetaTag('property', 'og:title', activeOgTitle);

    const activeOgDesc = article?.og_description || og_description || finalDesc;
    setMetaTag('property', 'og:description', activeOgDesc);

    const activeImage = article?.og_image || article?.image || og_image || image || 'https://newsforever.in/assets/img/logo.png';
    setMetaTag('property', 'og:image', activeImage);

    const activeUrl = article?.og_url || og_url || (typeof window !== 'undefined' ? window.location.href : '');
    if (activeUrl) {
      setMetaTag('property', 'og:url', activeUrl);
      setLinkTag('canonical', activeUrl);
    }
  }, [
    article,
    title,
    meta_title,
    meta_description,
    meta_keyword,
    og_title,
    og_description,
    og_image,
    og_url,
    image,
    defaultTitle,
    siteName,
  ]);

  return null; // Purely head-side manager component
};

export default SEOManager;

