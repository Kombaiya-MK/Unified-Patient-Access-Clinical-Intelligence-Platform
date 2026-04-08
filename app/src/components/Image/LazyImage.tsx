/**
 * LazyImage Component
 *
 * Wraps an image with Intersection Observer-based lazy loading.
 * Shows a lightweight placeholder until the image enters the viewport,
 * then loads and fades in the real image. Prevents layout shift by
 * reserving space via width/height or aspectRatio.
 *
 * Usage:
 *   <LazyImage
 *     src="/images/report.png"
 *     alt="Clinical report"
 *     width={800}
 *     height={600}
 *     rootMargin="200px"
 *   />
 *
 * @module Image/LazyImage
 * @task US_044 TASK_006
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Required alt text for accessibility */
  alt: string;
  /** Intrinsic width to prevent CLS */
  width?: number;
  /** Intrinsic height to prevent CLS */
  height?: number;
  /** IntersectionObserver rootMargin — how early to start loading (default: "200px") */
  rootMargin?: string;
  /** Optional placeholder background color */
  placeholderColor?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  rootMargin = '200px',
  placeholderColor = '#f3f4f6',
  style,
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(!hasIntersectionObserver);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const element = imgRef.current;
    if (!element || !hasIntersectionObserver) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const placeholderStyle: React.CSSProperties = {
    backgroundColor: placeholderColor,
    width: width ?? '100%',
    height: height ?? 'auto',
    display: 'block',
    ...style,
  };

  const imageStyle: React.CSSProperties = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 300ms ease',
    width: width ?? '100%',
    height: height ?? 'auto',
    display: 'block',
    ...style,
  };

  if (!isVisible) {
    return (
      <div
        ref={imgRef as React.RefObject<HTMLDivElement>}
        role="img"
        aria-label={alt}
        style={placeholderStyle}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      onLoad={handleLoad}
      decoding="async"
      style={imageStyle}
      {...rest}
    />
  );
};
