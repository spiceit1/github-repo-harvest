import { supabase } from '../lib/supabase';
import { FishData } from '../types';
import ImageCache from './imageCache';

class FishStorage {
  private static readonly PAGE_SIZE = 50;
  private static readonly IMAGE_BATCH_SIZE = 50;
  private static initialized: boolean = false;
  private static progressCallback?: (loaded: number, total: number, stage?: 'database' | 'images') => void;

  public static async initialize(progressCallback: (loaded: number, total: number, stage?: 'database' | 'images') => void): Promise<void> {
    FishStorage.progressCallback = progressCallback;
    
    if (FishStorage.initialized) {
      console.log('FishStorage already initialized');
      return;
    }

    console.log('Initializing FishStorage...');
    try {
      // Helper function to create a timeout promise
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out')), ms)
      );

      // First check if we can connect to the fish_data table
      try {
        const { error: dataError } = await Promise.race([
          supabase
            .from('fish_data')
            .select('id')
            .limit(1),
          timeout(5000) // 5 second timeout
        ]) as { error: any };

        if (dataError) {
          console.error('Error connecting to fish_data table:', dataError);
          throw dataError;
        }
        console.log('Successfully connected to fish_data table');
      } catch (error) {
        console.error('Error connecting to fish_data table:', error);
        throw error;
      }

      // Then check fish_images table
      try {
        const { error: imageError } = await Promise.race([
          supabase
            .from('fish_images')
            .select('id')
            .limit(1),
          timeout(5000) // 5 second timeout
        ]) as { error: any };

        if (imageError) {
          // Log the error but don't throw - we can still function without images
          console.warn('Warning: Error connecting to fish_images table:', imageError);
        } else {
          console.log('Successfully connected to fish_images table');
        }
      } catch (error) {
        // Log the error but don't throw - we can still function without images
        console.warn('Warning: Error connecting to fish_images table:', error);
      }

      console.log('FishStorage initialized successfully');
      FishStorage.initialized = true;
    } catch (error) {
      console.error('Failed to initialize FishStorage:', error);
      const message = error instanceof Error ? error.message : 'Database connection error';
      throw new Error(`Initialization failed: ${message}`);
    }
  }

  public static async loadFishData(): Promise<FishData[]> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Starting to load fish data...');
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('fish_data')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting total count:', countError);
        throw countError;
      }

      const total = count || 0;
      console.log(`Found ${total} fish records`);
      
      if (total === 0) {
        console.warn('No fish data found in database');
        FishStorage.progressCallback?.(0, 0);
        return [];
      }

      // Report initial progress
      FishStorage.progressCallback?.(0, total, 'database');

      // Load all fish data in a single query
      console.log('Loading fish data...');
      const { data: fishData, error } = await supabase
        .from('fish_data')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading fish data:', error);
        throw error;
      }

      if (!fishData || fishData.length === 0) {
        throw new Error('No fish data was loaded');
      }

      // Log all Clown Tang entries to debug
      const clownTangs = fishData.filter(item => item.name.includes('CLOWN TANG'));
      console.log('Found Clown Tang entries:', clownTangs);

      // Convert fish data
      const allFish = fishData.map(item => {
        // Normalize search name for Clown Tang entries
        let searchName = item.search_name;
        if (item.name.includes('CLOWN TANG')) {
          searchName = 'CLOWN TANG';  // Force the same search name for all Clown Tang entries
          console.log(`Normalizing Clown Tang search name from ${item.search_name} to ${searchName}`);
        }
        const upperSearchName = searchName.toUpperCase();
        console.log(`Processing fish: ${item.name}, original search_name: ${item.search_name}, normalized: ${upperSearchName}`);
        return {
          id: item.id,
          uniqueId: `fish-${item.id}`,
          name: item.name,
          searchName: upperSearchName,
          cost: item.cost,
          category: item.category,
          isCategory: item.is_category || false,
          imageUrl: '', // Will be populated later
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(searchName + ' saltwater fish')}`,
          disabled: item.disabled || false,
          archived: item.archived || false,
          originalCost: item.original_cost,
          saleCost: item.sale_cost,
          qtyoh: item.qtyoh || 0,
          ebay_listing_id: item.ebay_listing_id,
          ebay_listing_status: item.ebay_listing_status
        };
      });

      // Log all processed Clown Tang entries
      const processedClownTangs = allFish.filter(item => item.name.includes('CLOWN TANG'));
      console.log('Processed Clown Tang entries:', processedClownTangs);

      // Report progress
      FishStorage.progressCallback?.(allFish.length, total, 'database');

      // Load images immediately
      console.log('Loading images...');
      await FishStorage.loadImagesInBackground(allFish);

      return allFish;
    } catch (error) {
      console.error('Error in loadFishData:', error);
      throw error;
    }
  }

  private static async loadImagesInBackground(fishData: FishData[]): Promise<void> {
    console.log('Starting background image loading...');
    
    // Reset the ImageCache request tracker to ensure we start fresh
    ImageCache.resetRequestTracker();
    
    // Get unique search names and create a map to track which ones are loaded
    const searchNames = [...new Set(fishData.map(fish => fish.searchName.toUpperCase()))];
    const loadedSearchNames = new Set<string>();
    console.log(`Found ${searchNames.length} unique search names to load images for`);
    
    try {
      // Reduced batch size and concurrency to prevent timeouts
      const BATCH_SIZE = 10;
      const CONCURRENT_BATCHES = 2;
      const batches = [];
      
      for (let i = 0; i < searchNames.length; i += BATCH_SIZE) {
        batches.push(searchNames.slice(i, i + BATCH_SIZE));
      }

      const totalUniqueImages = searchNames.length;

      // Process batches with retries
      for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);
        
        await Promise.all(currentBatches.map(async (searchNameBatch) => {
          const MAX_RETRIES = 3;
          let retryCount = 0;
          
          while (retryCount < MAX_RETRIES) {
            try {
              const { data: images, error } = await supabase
                .from('fish_images')
                .select('search_name, image_url')
                .in('search_name', searchNameBatch);

              if (error) {
                throw error;
              }

              if (!images || images.length === 0) {
                console.log(`No images found for batch with ${searchNameBatch.length} names`);
                return;
              }

              // Create a map for faster lookups
              const imageMap = new Map(
                images.map(img => [img.search_name.toUpperCase(), img.image_url])
              );

              // Apply images to all matching fish in one pass
              fishData.forEach(fish => {
                const imageUrl = imageMap.get(fish.searchName.toUpperCase());
                if (imageUrl) {
                  fish.imageUrl = imageUrl;
                  // Only count each unique search name once
                  if (!loadedSearchNames.has(fish.searchName.toUpperCase())) {
                    loadedSearchNames.add(fish.searchName.toUpperCase());
                    // Update progress with unique images loaded and stage
                    FishStorage.progressCallback?.(loadedSearchNames.size, totalUniqueImages, 'images');
                  }
                }
              });

              break; // Success, exit retry loop
              
            } catch (error) {
              retryCount++;
              console.error(`Error processing batch (attempt ${retryCount}/${MAX_RETRIES}):`, error);
              
              if (retryCount === MAX_RETRIES) {
                console.error(`Failed to load images for batch after ${MAX_RETRIES} attempts`);
                return;
              }
              
              // Exponential backoff between retries
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
            }
          }
        }));

        // Larger delay between batch sets to prevent overwhelming
        if (i + CONCURRENT_BATCHES < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Preload images for display
      const fishWithImages = fishData.filter(fish => fish.imageUrl);
      if (fishWithImages.length > 0) {
        console.log(`Preloading ${fishWithImages.length} images...`);
        await ImageCache.preloadImages(fishWithImages, (loaded: number, total: number) => {
          console.log(`Image loading progress: ${loaded}/${total}`);
          FishStorage.progressCallback?.(loaded, total, 'images');
        });
      }
    } catch (error) {
      console.error('Error in loadImagesInBackground:', error);
      FishStorage.progressCallback?.(0, 0);
    }
  }

  public static async updateCategoryStatus(category: string, disabled: boolean): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log(`Updating category status: ${category} (disabled: ${disabled})`);
      
      const { error } = await supabase
        .from('fish_data')
        .update({ disabled })
        .eq('category', category)
        .eq('is_category', false);

      if (error) {
        console.error('Error updating category status:', error);
        throw error;
      }

      console.log(`Successfully updated category status: ${category}`);
    } catch (error) {
      console.error('Error in updateCategoryStatus:', error);
      throw error;
    }
  }

  public static async updateItemStatus(id: string, disabled: boolean): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log(`Updating item status: ${id} (disabled: ${disabled})`);
      
      const { error } = await supabase
        .from('fish_data')
        .update({ disabled })
        .eq('id', id);

      if (error) {
        console.error('Error updating item status:', error);
        throw error;
      }

      console.log(`Successfully updated item status: ${id}`);
    } catch (error) {
      console.error('Error in updateItemStatus:', error);
      throw error;
    }
  }

  public static async deleteItem(id: string): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log(`Deleting item: ${id}`);
      
      const { error } = await supabase
        .from('fish_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting item:', error);
        throw error;
      }

      console.log(`Successfully deleted item: ${id}`);
    } catch (error) {
      console.error('Error in deleteItem:', error);
      throw error;
    }
  }

  public static async saveFishData(fishData: FishData[]): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Saving fish data...');
      
      // First, clear existing data
      const { error: deleteError } = await supabase
        .from('fish_data')
        .delete()
        .neq('id', 'dummy'); // Delete all records

      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
        throw deleteError;
      }

      // Then insert new data
      const { error: insertError } = await supabase
        .from('fish_data')
        .insert(fishData.map(fish => ({
          name: fish.name,
          search_name: fish.searchName,
          cost: fish.cost,
          category: fish.category,
          is_category: fish.isCategory || false,
          disabled: fish.disabled || false,
          archived: fish.archived || false,
          original_cost: fish.originalCost,
          sale_cost: fish.saleCost,
          qtyoh: fish.qtyoh || 0,
          ebay_listing_id: fish.ebay_listing_id,
          ebay_listing_status: fish.ebay_listing_status
        })));

      if (insertError) {
        console.error('Error inserting new data:', insertError);
        throw insertError;
      }

      console.log(`Successfully saved ${fishData.length} fish records`);
    } catch (error) {
      console.error('Error in saveFishData:', error);
      throw error;
    }
  }

  public static async normalizeSearchNames(): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Normalizing search names for Clown Tang entries...');
      
      // Update all Clown Tang entries to use the same search name
      const { error } = await supabase
        .from('fish_data')
        .update({ search_name: 'CLOWN TANG' })
        .like('name', '%CLOWN TANG%');

      if (error) {
        console.error('Error normalizing search names:', error);
        throw error;
      }

      // Also update the fish_images table
      const { error: imageError } = await supabase
        .from('fish_images')
        .update({ search_name: 'CLOWN TANG' })
        .like('search_name', '%CLOWN TANG%');

      if (imageError) {
        console.error('Error normalizing image search names:', imageError);
        throw imageError;
      }

      console.log('Successfully normalized search names');
    } catch (error) {
      console.error('Error in normalizeSearchNames:', error);
      throw error;
    }
  }

  public static async clearAllData(progressCallback?: (current: number, total: number) => void): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Clearing all data...');
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('fish_data')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting total count:', countError);
        throw countError;
      }

      const total = count || 0;
      console.log(`Found ${total} records to delete`);
      
      if (total === 0) {
        console.log('No records to delete');
        return;
      }

      // Delete in batches
      const batchSize = 100;
      const batches = Math.ceil(total / batchSize);
      let deleted = 0;

      for (let i = 0; i < batches; i++) {
        const { error } = await supabase
          .from('fish_data')
          .delete()
          .neq('id', 'dummy')
          .limit(batchSize);

        if (error) {
          console.error('Error deleting batch:', error);
          throw error;
        }

        deleted += batchSize;
        progressCallback?.(Math.min(deleted, total), total);
      }

      console.log(`Successfully cleared ${deleted} records`);
    } catch (error) {
      console.error('Error in clearAllData:', error);
      throw error;
    }
  }
}

export default FishStorage;