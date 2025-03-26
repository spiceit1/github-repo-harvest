import { FishData } from '../types';

interface CachedImageData {
  url: string;
  timestamp: number;
}

class ImageCache {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises = new Map<string, Promise<void>>();
  private static requestedUrls = new Set<string>();
  private static readonly MAX_CONCURRENT_LOADS = 10; // Increased from 5
  private static readonly CACHE_SIZE_LIMIT = 1000;
  private static readonly localStorageKey = 'fish_image_cache_v2';
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly SIZE_THRESHOLD = 10 * 1024; // 10KB for base64
  private static initialized = false;
  static readonly FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=500&auto=format&fit=crop';

  private static async initialize() {
    if (this.initialized) return;
    try {
      await this.loadFromLocalStorage();
      this.initialized = true;
    } catch (error) {
      console.warn('Error initializing image cache:', error);
      localStorage.removeItem(this.localStorageKey);
      this.initialized = true;
    }
  }

  private static async loadFromLocalStorage() {
    const stored = localStorage.getItem(this.localStorageKey);
    if (!stored) return;

    try {
      const cachedData: { [key: string]: CachedImageData } = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out expired entries
      const validEntries = Object.entries(cachedData).filter(([_, data]) => 
        now - data.timestamp < this.CACHE_TTL
      );

      // Load valid images
      await Promise.all(validEntries.map(async ([key, data]) => {
        try {
          if (this.cache.has(key)) return; // Skip if already cached
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = data.url;
          });
          this.cache.set(key, img);
        } catch (error) {
          console.warn(`Failed to load cached image: ${key}`, error);
        }
      }));

      // Remove expired entries from storage
      if (validEntries.length < Object.keys(cachedData).length) {
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.warn('Error loading from cache:', error);
      localStorage.removeItem(this.localStorageKey);
    }
  }

  private static async loadWithFallback(url: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      await this.loadingPromises.get(url);
      return this.cache.get(url)!;
    }

    let loadPromise: Promise<HTMLImageElement>;
    try {
      loadPromise = this.isBase64Image(url) ? 
        this.loadBase64Image(url) : 
        this.loadUrlImage(url);
      
      this.loadingPromises.set(url, loadPromise.then());
      const img = await loadPromise;
      this.loadingPromises.delete(url);
      return img;
    } catch (error) {
      this.loadingPromises.delete(url);
      console.warn(`Failed to load image: ${url}`, error);
      
      // Use fallback image
      const fallbackImg = new Image();
      fallbackImg.src = this.FALLBACK_IMAGE;
      this.cache.set(url, fallbackImg);
      return fallbackImg;
    }
  }

  private static async loadBase64Image(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    this.cache.set(url, img);
    return img;
  }

  private static async loadUrlImage(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
    
    this.cache.set(url, img);
    return img;
  }

  public static async preloadImages(
    fishData: FishData[], 
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    await this.initialize();

    // Filter duplicates and already cached images
    const uniqueFishData = fishData.filter(fish => 
      fish.imageUrl && 
      !this.requestedUrls.has(fish.imageUrl) &&
      !this.cache.has(fish.imageUrl)
    );
    
    const total = uniqueFishData.length;
    if (total === 0) {
      onProgress?.(0, 0);
      return;
    }

    // Mark all new URLs as requested
    uniqueFishData.forEach(fish => {
      if (fish.imageUrl) {
        this.requestedUrls.add(fish.imageUrl);
      }
    });

    let loaded = 0;
    onProgress?.(loaded, total);

    // Process images in parallel with concurrency limit
    const chunks = [];
    for (let i = 0; i < uniqueFishData.length; i += this.MAX_CONCURRENT_LOADS) {
      chunks.push(uniqueFishData.slice(i, i + this.MAX_CONCURRENT_LOADS));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (fish) => {
          try {
            await this.loadWithFallback(fish.imageUrl!);
          } catch (error) {
            console.warn('Error loading image:', error);
          } finally {
            loaded++;
            onProgress?.(loaded, total);
          }
        })
      );
    }

    this.cleanupCache();
    this.saveToLocalStorage();
  }

  public static getImage(url: string): HTMLImageElement | null {
    return this.cache.get(url) || null;
  }

  public static clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.requestedUrls.clear();
    localStorage.removeItem(this.localStorageKey);
    this.initialized = false;
    console.log('Image cache cleared');
  }

  private static saveToLocalStorage() {
    try {
      const cacheData: { [key: string]: CachedImageData } = {};
      const now = Date.now();
      
      for (const [key, img] of this.cache.entries()) {
        cacheData[key] = {
          url: img.src,
          timestamp: now
        };
      }

      localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const stored = localStorage.getItem(this.localStorageKey);
          if (stored) {
            const cachedData: { [key: string]: CachedImageData } = JSON.parse(stored);
            const entries = Object.entries(cachedData);
            
            // Remove oldest 25% of entries
            const toRemove = Math.ceil(entries.length * 0.25);
            const remainingEntries = entries
              .sort((a, b) => b[1].timestamp - a[1].timestamp)
              .slice(0, -toRemove);

            const newCache: { [key: string]: CachedImageData } = {};
            remainingEntries.forEach(([key, data]) => {
              newCache[key] = data;
            });

            localStorage.setItem(this.localStorageKey, JSON.stringify(newCache));
          }
        } catch (retryError) {
          console.warn('Failed to save cache even after cleanup:', retryError);
        }
      } else {
        console.warn('Error saving image cache:', error);
      }
    }
  }

  public static resetRequestTracker(): void {
    this.requestedUrls.clear();
    console.log('Image request tracker has been reset');
  }

  private static cleanupCache(): void {
    if (this.cache.size > this.CACHE_SIZE_LIMIT) {
      const entriesToRemove = Array.from(this.cache.entries())
        .slice(0, this.cache.size - this.CACHE_SIZE_LIMIT);
      
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private static isBase64Image(url: string): boolean {
    return url.startsWith('data:image/');
  }
}

export default ImageCache;