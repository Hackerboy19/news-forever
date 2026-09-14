import React from 'react';

/**
 * A real anchor for an article.
 *
 * The portal is a single-page app, so article cards used to be `<div>`s with an
 * `onClick` handler. That works for a mouse and for nobody else: Googlebot does
 * not fire click handlers, so none of those cards were crawlable links and the
 * site architecture was invisible to search. Screen-reader users and anyone
 * middle-clicking or copying a link address were equally stuck.
 *
 * This renders a genuine `<a href="/{url}">` — crawlable, focusable, openable
 * in a new tab — and only intercepts the click for client-side navigation when
 * it is a plain left-click. Modified clicks (⌘/Ctrl/Shift/Alt, middle button)
 * fall through to the browser's native behaviour.
 */
export interface ArticleLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  /** The `ci_blog.url` slug, exactly as stored. */
  url: string;
  /** SPA navigation callback. */
  onSelectArticle: (urlSlug: string) => void;
  children: React.ReactNode;
}

export const ArticleLink: React.FC<ArticleLinkProps> = ({
  url,
  onSelectArticle,
  children,
  ...rest
}) => {
  const slug = String(url || '').replace(/^\/+/, '');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle "open in new tab/window" and non-primary buttons.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    onSelectArticle(slug);
  };

  return (
    <a href={`/${slug}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

export default ArticleLink;
