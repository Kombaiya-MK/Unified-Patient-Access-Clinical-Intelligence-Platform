/**
 * ResponsiveImage Component
 *
 * Renders an <img> with srcSet and sizes attributes for
 * responsive image delivery across 1x, 2x, 3x pixel densities.
 * Supports WebP source via <picture> when a webpSrc is provided.
 *
 * Usage:
 *   <ResponsiveImage
 *     src="/images/hero.png"
 *     srcSet="/images/hero-400.png 400w, /images/hero-800.png 800w, /images/hero-1200.png 1200w"
 *     sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
 *     alt="Hero banner"
 *     width={1200}
 *     height={600}
 *   />
 *
 * @module Image/ResponsiveImage
 * @task US_044 TASK_006
 */

import React from 'react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback image source */
  src: string;
  /** srcSet string for resolution switching (e.g. "img-400.png 400w, img-800.png 800w") */
  srcSet?: string;
  /** sizes attribute for viewport-based selection */
  sizes?: string;
  /** Optional WebP source for <picture> element */
  webpSrcSet?: string;
  /** Optional AVIF source for <picture> element */
  avifSrcSet?: string;
  /** Required alt text for accessibility */
  alt: string;
  /** Intrinsic width to prevent CLS */
  width?: number;
  /** Intrinsic height to prevent CLS */
  height?: number;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  srcSet,
  sizes,
  webpSrcSet,
  avifSrcSet,
  alt,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  const hasModernFormats = avifSrcSet || webpSrcSet;

  if (hasModernFormats) {
    return (
      <picture>
        {avifSrcSet && (
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        )}
        {webpSrcSet && (
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        )}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          {...rest}
        />
      </picture>
    );
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      {...rest}
    />
  );
};
