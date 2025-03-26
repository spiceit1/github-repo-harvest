import React, { useState, useEffect, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import ImageCache from '../utils/imageCache';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

const ImageLoader: React.FC<ImageLoaderProps> = React.memo(({
  src,
  alt,
  className = '',
  onClick
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
    setImageSrc(ImageCache.FALLBACK_IMAGE);
  }, []);

  useEffect(() => {
    if (!src) {
      handleError();
      return;
    }

    setLoading(true);
    setError(false);

    // For base64 images, use directly
    if (src.startsWith('data:image/')) {
      setImageSrc(src);
      return;
    }

    // For URLs, try to get from cache first
    const cachedImage = ImageCache.getImage(src);
    if (cachedImage) {
      setImageSrc(cachedImage.src);
      setLoading(false);
      return;
    }

    // Load the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      handleError();
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      setImageSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      handleError();
    };

    img.src = src;

    return () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, handleError]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);

  if (error || !imageSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        onClick={handleClick}
      >
        <ImageOff className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" onClick={handleClick}>
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
});

export default ImageLoader;