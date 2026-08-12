import React, { useState } from 'react';

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * <img> with a soft blur-in reveal once loaded — avoids jarring pop-in.
 * Parent containers keep fixed heights, so no layout shift either way.
 */
export const BlurImage: React.FC<BlurImageProps> = ({ fallbackSrc, className = '', ...img }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <img
      {...img}
      src={failed && fallbackSrc ? fallbackSrc : img.src}
      loading={img.loading || 'lazy'}
      ref={(el) => {
        // Cached images can complete before React attaches onLoad
        if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (fallbackSrc && !failed) setFailed(true);
      }}
      className={`${className} transition-[opacity,filter] duration-500 ease-out ${
        loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
      }`}
    />
  );
};

export default BlurImage;
