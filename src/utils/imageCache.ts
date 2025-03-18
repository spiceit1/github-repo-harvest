import { FishData } from '../types';

class ImageCache {
  private static cache: Map<string, string> = new Map();
  private static localStorageKey = 'fish_image_cache_v2';
  private static CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static initialized = false;
  static readonly FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=500&auto=format&fit=crop';

  private static async initialize() {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const { images, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          Object.entries(images).forEach(([key, value]) => {
            this.cache.set(key, value as string);
          });
        } else {
          localStorage.removeItem(this.localStorageKey);
        }
      }
    } catch (error) {
      console.warn('Error initializing image cache:', error);
      localStorage.removeItem(this.localStorageKey);
    } finally {
      this.initialized = true;
    }
  }

  private static saveToLocalStorage() {
    try {
      const images = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.localStorageKey, JSON.stringify({
        images,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error saving image cache:', error);
    }
  }

  static getImage(url: string): string {
    if (!url) return this.FALLBACK_IMAGE;
    if (url.startsWith('data:image/')) return url;
    return this.cache.get(url) || url;
  }

  static async validateImage(url: string): Promise<boolean> {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Image load failed'));
        };

        // Add cache-busting parameter
        const cacheBuster = `_cb=${Date.now()}`;
        const separator = url.includes('?') ? '&' : '?';
        img.src = `${url}${separator}${cacheBuster}`;
      });
      
      return true;
    } catch {
      return false;
    }
  }

  static async preloadImages(fishData: FishData[]): Promise<void> {
    await this.initialize();

    const imagesToLoad = fishData
      .filter(fish => fish.imageUrl && !this.cache.has(fish.imageUrl))
      .map(fish => fish.imageUrl!)
      .filter((url, index, self) => 
        self.indexOf(url) === index && !url.startsWith('data:image/')
      );

    if (imagesToLoad.length === 0) return;

    const loadImage = async (url: string) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 10000);

          img.onload = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image load failed'));
          };

          // Add cache-busting parameter
          const cacheBuster = `_cb=${Date.now()}`;
          const separator = url.includes('?') ? '&' : '?';
          img.src = `${url}${separator}${cacheBuster}`;
        });

        this.cache.set(url, url);
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
        this.cache.delete(url);
      }
    };

    // Load images in batches of 3 to prevent overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < imagesToLoad.length; i += batchSize) {
      const batch = imagesToLoad.slice(i, i + batchSize);
      await Promise.all(batch.map(loadImage));
      // Save cache after each batch
      this.saveToLocalStorage();
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static clear() {
    this.cache.clear();
    localStorage.removeItem(this.localStorageKey);
    this.initialized = false;
  }
}

export default ImageCache;