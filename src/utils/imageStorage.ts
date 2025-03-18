import { supabase } from '../lib/supabase';
import FishStorage from './fishStorage';
import ImageCache from './imageCache';

class ImageStorage {
  private static readonly DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

  static async storeImage(searchName: string, imageUrl: string, isBase64 = false): Promise<void> {
    if (!searchName || !imageUrl) {
      throw new Error('Invalid search name or image URL');
    }

    const normalizedSearchName = searchName.toUpperCase().trim();

    try {
      // For base64 images, we only need to validate the format
      if (isBase64 && !imageUrl.startsWith('data:image/')) {
        throw new Error('Invalid base64 image format');
      }

      // For URLs, validate the image
      if (!isBase64) {
        const isValid = await ImageCache.validateImage(imageUrl);
        if (!isValid) {
          throw new Error('Unable to validate image URL');
        }
      }

      // First try to delete any existing image
      const { error: deleteError } = await supabase
        .from('fish_images')
        .delete()
        .eq('search_name', normalizedSearchName)
        .eq('user_id', this.DEFAULT_USER_ID);

      if (deleteError) {
        throw deleteError;
      }

      // Then insert the new image
      const { error: insertError } = await supabase
        .from('fish_images')
        .upsert({
          search_name: normalizedSearchName,
          image_url: imageUrl,
          user_id: this.DEFAULT_USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Clear caches to ensure fresh data
      await FishStorage.clearCache();
      ImageCache.clear();

      // Preload the new image if it's a URL
      if (!isBase64) {
        await ImageCache.preloadImages([{ imageUrl } as any]);
      }

    } catch (error) {
      console.error('Error storing image:', error);
      throw error;
    }
  }

  static async getStoredImage(searchName: string): Promise<string | null> {
    if (!searchName) return null;

    const normalizedSearchName = searchName.toUpperCase().trim();

    try {
      const { data: imageData, error: imageError } = await supabase
        .from('fish_images')
        .select('image_url')
        .eq('search_name', normalizedSearchName)
        .eq('user_id', this.DEFAULT_USER_ID)
        .maybeSingle();

      if (imageError) throw imageError;

      if (imageData?.image_url) {
        // If it's a base64 image, return it directly
        if (imageData.image_url.startsWith('data:image/')) {
          return imageData.image_url;
        }

        // For URLs, validate the image
        const isValid = await ImageCache.validateImage(imageData.image_url);
        if (isValid) {
          return imageData.image_url;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting stored image:', error);
      return null;
    }
  }

  static async clearImageCache(): Promise<void> {
    ImageCache.clear();
  }
}

export default ImageStorage;