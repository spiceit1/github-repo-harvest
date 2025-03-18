import { supabase } from '../lib/supabase';
import { FishData } from '../types';
import ImageCache from './imageCache';

class FishStorage {
  private static cache: Map<string, FishData[]> = new Map();
  private static initialized = false;
  private static BATCH_SIZE = 25;
  private static PAGE_SIZE = 100;
  private static IMAGE_BATCH_SIZE = 5;
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000;

  private static async initialize() {
    if (this.initialized) return;
    
    const { error } = await supabase
      .from('fish_data')
      .select('id')
      .limit(1)
      .single();

    if (error) throw error;
    this.initialized = true;
  }

  private static async loadFishImages(searchNames: string[]): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    
    // Process search names in smaller batches
    for (let i = 0; i < searchNames.length; i += this.IMAGE_BATCH_SIZE) {
      const batch = searchNames.slice(i, i + this.IMAGE_BATCH_SIZE);
      
      let retries = 0;
      let success = false;

      while (retries < this.MAX_RETRIES && !success) {
        try {
          const { data: images, error } = await supabase
            .from('fish_images')
            .select('search_name, image_url')
            .in('search_name', batch)
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

          if (error) throw error;

          if (images) {
            images.forEach(img => {
              const searchName = img.search_name.toUpperCase();
              if (!imageMap.has(searchName)) {
                imageMap.set(searchName, img.image_url);
              }
            });
          }

          success = true;

        } catch (error) {
          console.warn(`Attempt ${retries + 1} failed for batch ${i}:`, error);
          retries++;
          
          if (retries < this.MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retries)));
          }
        }
      }

      if (!success) {
        console.error(`Failed to load images for batch after ${this.MAX_RETRIES} attempts`);
      }

      // Add delay between batches to prevent rate limiting
      if (i + this.IMAGE_BATCH_SIZE < searchNames.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return imageMap;
  }

  static async loadFishData(
    onProgress?: (loaded: number, total: number) => void,
    includeDisabled = false
  ): Promise<FishData[]> {
    try {
      await this.initialize();

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('fish_data')
        .select('*', { count: 'exact' })
        .is('archived', false);

      if (countError) throw countError;

      const total = totalCount || 0;
      const fishData: FishData[] = [];
      let offset = 0;

      // Fetch data in pages
      while (offset < total) {
        // First get fish data
        const { data: fishDataPage, error: fishError } = await supabase
          .from('fish_data')
          .select('*')
          .is('archived', false)
          .range(offset, offset + this.PAGE_SIZE - 1)
          .order('order_index', { ascending: true });

        if (fishError) throw fishError;
        if (!fishDataPage || fishDataPage.length === 0) break;

        // Get search names for this batch
        const searchNames = fishDataPage.map(fish => fish.search_name.toUpperCase());
        
        // Get corresponding images in smaller batches
        const imageMap = await this.loadFishImages(searchNames);

        // Map fish data with images
        const mappedFishData = fishDataPage.map(item => {
          const searchName = item.search_name.toUpperCase();
          const imageUrl = imageMap.get(searchName);

          return {
            id: item.id,
            uniqueId: `fish-${item.id}`,
            name: item.name,
            searchName: searchName,
            cost: item.cost,
            category: item.category,
            isCategory: item.is_category,
            imageUrl: imageUrl,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.search_name + ' saltwater fish')}`,
            disabled: item.disabled || false,
            archived: item.archived || false,
            originalCost: item.original_cost,
            saleCost: item.sale_cost,
            qtyoh: item.qtyoh || 0,
            ebay_listing_id: item.ebay_listing_id,
            ebay_listing_status: item.ebay_listing_status
          };
        });

        fishData.push(...mappedFishData);

        if (onProgress) {
          onProgress(fishData.length, total);
        }

        offset += this.PAGE_SIZE;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Cache the complete data
      this.cache.set('fishData', fishData);

      // Preload images in the background
      ImageCache.preloadImages(fishData).catch(console.error);

      return fishData;

    } catch (error) {
      console.error('Error loading fish data:', error);
      throw error;
    }
  }

  static async saveFishData(fishData: FishData[]): Promise<void> {
    try {
      await this.initialize();

      // Process in batches
      for (let i = 0; i < fishData.length; i += this.BATCH_SIZE) {
        const batch = fishData.slice(i, i + this.BATCH_SIZE);
        
        for (const fish of batch) {
          if (fish.isCategory) continue;

          try {
            // Insert fish data
            const { data: insertedData, error: insertError } = await supabase
              .from('fish_data')
              .insert({
                name: fish.name,
                search_name: fish.searchName.toUpperCase(),
                cost: fish.cost,
                category: fish.category,
                is_category: false,
                order_index: i,
                disabled: false,
                original_cost: fish.originalCost,
                sale_cost: fish.saleCost,
                qtyoh: fish.qtyoh || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (insertError) {
              // If insert fails due to duplicate, try update
              const { error: updateError } = await supabase
                .from('fish_data')
                .update({
                  name: fish.name,
                  cost: fish.cost,
                  category: fish.category,
                  order_index: i,
                  original_cost: fish.originalCost,
                  sale_cost: fish.saleCost,
                  qtyoh: fish.qtyoh || 0,
                  updated_at: new Date().toISOString()
                })
                .eq('search_name', fish.searchName.toUpperCase());

              if (updateError) throw updateError;
            }

          } catch (error) {
            console.error(`Error processing fish "${fish.name}":`, error);
            continue;
          }
        }

        // Add delay between batches
        if (i + this.BATCH_SIZE < fishData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Clear caches
      this.clearCache();
      ImageCache.clear();

    } catch (error) {
      console.error('Error saving fish data:', error);
      throw error;
    }
  }

  static async updateCategoryStatus(category: string, disabled: boolean): Promise<void> {
    try {
      await this.initialize();

      const { error } = await supabase
        .from('fish_data')
        .update({ 
          disabled,
          updated_at: new Date().toISOString()
        })
        .eq('category', category);

      if (error) throw error;

      this.clearCache();
    } catch (error) {
      console.error('Error updating category status:', error);
      throw error;
    }
  }

  static async deleteItem(fishId: string): Promise<void> {
    try {
      await this.initialize();

      // Check if item is referenced in orders
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('fish_id', fishId)
        .limit(1);

      if (checkError) throw checkError;

      if (orderItems && orderItems.length > 0) {
        // Archive if referenced
        const { error: archiveError } = await supabase
          .from('fish_data')
          .update({ 
            archived: true,
            archived_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', fishId);

        if (archiveError) throw archiveError;
      } else {
        // Delete if not referenced
        const { error: deleteError } = await supabase
          .from('fish_data')
          .delete()
          .eq('id', fishId);

        if (deleteError) throw deleteError;
      }

      // Clear caches
      this.clearCache();
      ImageCache.clear();

    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  static async clearAllData(onProgress?: (current: number, total: number) => void): Promise<void> {
    try {
      await this.initialize();

      // Get all fish IDs
      const { data: allFish, error: fishError } = await supabase
        .from('fish_data')
        .select('id');

      if (fishError) throw fishError;
      if (!allFish?.length) return;

      // Get referenced fish IDs
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('fish_id')
        .not('fish_id', 'is', null);

      if (orderError) throw orderError;

      // Create a Set of referenced IDs
      const referencedIds = new Set(orderItems?.map(item => item.fish_id) || []);

      // Separate fish into referenced and non-referenced
      const nonReferencedIds = allFish
        .filter(fish => !referencedIds.has(fish.id))
        .map(fish => fish.id);

      const total = nonReferencedIds.length + referencedIds.size;
      let processed = 0;

      // Delete non-referenced fish in batches
      for (let i = 0; i < nonReferencedIds.length; i += this.BATCH_SIZE) {
        const batchIds = nonReferencedIds.slice(i, i + this.BATCH_SIZE);

        const { error: deleteError } = await supabase
          .from('fish_data')
          .delete()
          .in('id', batchIds);

        if (deleteError) throw deleteError;

        processed += batchIds.length;
        if (onProgress) {
          onProgress(processed, total);
        }

        if (i + this.BATCH_SIZE < nonReferencedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Archive referenced fish
      if (referencedIds.size > 0) {
        const { error: archiveError } = await supabase
          .from('fish_data')
          .update({
            archived: true,
            archived_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', Array.from(referencedIds));

        if (archiveError) throw archiveError;

        processed += referencedIds.size;
        if (onProgress) {
          onProgress(processed, total);
        }
      }

      // Clear caches
      this.clearCache();
      ImageCache.clear();

    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static clearCache() {
    this.cache.clear();
    this.initialized = false;
  }
}

export default FishStorage;