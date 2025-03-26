import { supabase } from '../lib/supabase';
import ImageCache from './imageCache';

class ImageStorage {
  private static readonly DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

  static async storeImage(searchName: string, imageData: string): Promise<void> {
    if (!searchName || !imageData) {
      throw new Error('Invalid search name or image data');
    }

    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image format - must be base64 image data');
    }

    // Check size limit (2MB)
    if (imageData.length > 2 * 1024 * 1024) {
      throw new Error('Image too large - must be less than 2MB');
    }

    const normalizedSearchName = searchName.toUpperCase().trim();

    try {
      // Delete any existing image
      const { error: deleteError } = await supabase
        .from('fish_images')
        .delete()
        .eq('search_name', normalizedSearchName)
        .eq('user_id', this.DEFAULT_USER_ID);

      if (deleteError) throw deleteError;

      // Insert the new image
      const { error: insertError } = await supabase
        .from('fish_images')
        .upsert({
          search_name: normalizedSearchName,
          image_url: imageData,
          user_id: this.DEFAULT_USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Clear the image cache
      ImageCache.clear();

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
      return imageData?.image_url || null;

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