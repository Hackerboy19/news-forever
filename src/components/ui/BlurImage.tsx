import React, { useState } from 'react';

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  /**
   * Above-the-fold image that decides LCP (a hero, or the first cards of a
   * listing). It loads eagerly at high priority and paints immediately
   * instead of fading in: an element held at opacity 0 is not a Largest
   * Contentful Paint candidate, so the fade was costing the site its own LCP
   * element — Chrome fell back to timing the header wordmark at 4.3s.
   */
  priority?: boolean;
}

/**
 * <img> with a soft blur-in reveal once loaded — avoids jarring pop-in.
 * Parent containers keep fixed heights, so no layout shift either way.
 */
export const BlurImage: React.FC<BlurImageProps> = ({ fallbackSrc, priority, className = '', ...img }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <img
      {...img}
      src={failed && fallbackSrc ? fallbackSrc : img.src}
      loading={img.loading || (priority ? 'eager' : 'lazy')}
      fetchPriority={img.fetchPriority || (priority ? 'high' : undefined)}
      decoding={img.decoding || (priority ? 'async' : undefined)}
      ref={(el) => {
        // Cached images can complete before React attaches onLoad
        if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (fallbackSrc && !failed) setFailed(true);
      }}
      className={
        priority
          ? className
          : `${className} transition-[opacity,filter] duration-500 ease-out ${
              loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
            }`
      }
    />
  );
};

export default BlurImage;
