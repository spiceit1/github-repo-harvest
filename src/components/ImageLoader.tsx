import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import ImageCache from '../utils/imageCache';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  className = '',
  onClick
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const mounted = React.useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        if (mounted.current) {
          setError(true);
          setLoading(false);
          setImageSrc(ImageCache.FALLBACK_IMAGE);
        }
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // For base64 images, use directly
        if (src.startsWith('data:image/')) {
          setImageSrc(src);
          setLoading(false);
          return;
        }

        // For URLs, try to load with cache
        const imageUrl = ImageCache.getImage(src);
        
        // Create a new image element to test the source
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 8000); // 8 second timeout

          img.onload = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image load failed'));
          };

          img.src = imageUrl;
        });

        if (mounted.current) {
          setImageSrc(imageUrl);
          setLoading(false);
        }
      } catch (error) {
        console.warn(`Error loading image (${src}):`, error);
        if (mounted.current) {
          setError(true);
          setLoading(false);
          setImageSrc(ImageCache.FALLBACK_IMAGE);
        }
      }
    };

    loadImage();
  }, [src]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

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
        onError={() => {
          setError(true);
          setLoading(false);
          setImageSrc(ImageCache.FALLBACK_IMAGE);
        }}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
};

export default ImageLoader;