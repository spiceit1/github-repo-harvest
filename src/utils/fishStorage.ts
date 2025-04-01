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
        .select('id', { count: 'exact', head: true })
        .eq('archived', false); // Only count non-archived fish

      if (countError) {
        console.error('Error getting total count:', countError);
        throw countError;
      }

      const total = count || 0;
      console.log(`Found ${total} active fish records`);
      
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
        .eq('archived', false) // Only load non-archived fish
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

  private static async loadImagesInBackground(fishData: FishData[], includeDisabled: boolean = false): Promise<void> {
    console.log('Starting background image loading...');
    
    // Reset the ImageCache request tracker to ensure we start fresh
    ImageCache.resetRequestTracker();
    
    // Get unique search names based on the includeDisabled parameter
    const searchNames = [...new Set(fishData
      .filter(fish => {
        if (includeDisabled) {
          return fish.disabled && !fish.archived; // Only load disabled, non-archived items
        }
        return !fish.disabled && !fish.archived; // Only load active, non-archived items
      })
      .map(fish => fish.searchName.toUpperCase())
    )];
    const loadedSearchNames = new Set<string>();
    console.log(`Found ${searchNames.length} unique search names to load images for ${includeDisabled ? 'disabled' : 'active'} items`);
    
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

              // Apply images based on the includeDisabled parameter
              fishData
                .filter(fish => {
                  if (includeDisabled) {
                    return fish.disabled && !fish.archived;
                  }
                  return !fish.disabled && !fish.archived;
                })
                .forEach(fish => {
                  const imageUrl = imageMap.get(fish.searchName.toUpperCase());
                  if (imageUrl) {
                    fish.imageUrl = imageUrl;
                    if (!loadedSearchNames.has(fish.searchName.toUpperCase())) {
                      loadedSearchNames.add(fish.searchName.toUpperCase());
                      FishStorage.progressCallback?.(loadedSearchNames.size, totalUniqueImages, 'images');
                    }
                  }
                });

              break; // Success, exit retry loop
            } catch (error) {
              console.error(`Error loading images (attempt ${retryCount + 1}):`, error);
              retryCount++;
              if (retryCount === MAX_RETRIES) {
                throw error;
              }
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          }
        }));

        // Report progress after each batch
        FishStorage.progressCallback?.(
          Math.min(loadedSearchNames.size, totalUniqueImages),
          totalUniqueImages,
          'images'
        );
      }

      // Preload images for display
      const loadedUrls = Array.from(loadedSearchNames)
        .map(name => fishData.find(fish => fish.searchName === name)?.imageUrl)
        .filter((url): url is string => !!url);

      await ImageCache.preloadImages(fishData.filter(fish => fish.imageUrl && loadedUrls.includes(fish.imageUrl)));

      console.log(`Finished loading ${loadedSearchNames.size} images`);
    } catch (error) {
      console.error('Error in loadImagesInBackground:', error);
      throw error;
    }
  }

  // Add a new public method to load disabled item images
  public static async loadDisabledItemImages(fishData: FishData[]): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Loading images for disabled items...');
      await FishStorage.loadImagesInBackground(fishData, true);
    } catch (error) {
      console.error('Error loading disabled item images:', error);
      throw error;
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
      console.log('Starting fish data save process...');
      
      // First, mark all existing records as archived instead of deleting them
      console.log('Archiving existing data...');
      const { error: archiveError } = await supabase
        .from('fish_data')
        .update({ archived: true })
        .not('id', 'is', null);

      if (archiveError) {
        console.error('Error archiving existing data:', archiveError);
        throw new Error(`Failed to archive existing data: ${archiveError.message}`);
      }

      console.log(`Processing ${fishData.length} new fish records...`);
      let processed = 0;
      let errors = [];

      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < fishData.length; i += batchSize) {
        const batch = fishData.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(fishData.length / batchSize)}`);

        // Insert batch of new records
        const { error: insertError } = await supabase
          .from('fish_data')
          .insert(batch.map(fish => ({
            name: fish.name,
            search_name: fish.searchName,
            cost: fish.cost,
            category: fish.category,
            is_category: fish.isCategory || false,
            disabled: fish.disabled || false,
            original_cost: fish.originalCost,
            sale_cost: fish.saleCost,
            qtyoh: fish.qtyoh || 0,
            ebay_listing_id: fish.ebay_listing_id,
            ebay_listing_status: fish.ebay_listing_status,
            archived: false
          })));

        if (insertError) {
          console.error(`Error inserting batch:`, insertError);
          errors.push({ batch: i / batchSize + 1, error: insertError.message });
          continue;
        }

        processed += batch.length;
      }

      console.log(`Processed ${processed} out of ${fishData.length} fish records`);
      if (errors.length > 0) {
        console.error('Errors during processing:', errors);
        throw new Error(`Failed to process ${errors.length} batches. Check console for details.`);
      }

      if (processed === 0) {
        throw new Error('No fish records were processed successfully');
      }

      console.log('Fish data save process completed successfully');
    } catch (error) {
      console.error('Error in saveFishData:', error);
      throw error instanceof Error ? error : new Error('Failed to save fish data');
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

  public static async clearAllFishData(): Promise<void> {
    if (!FishStorage.initialized) {
      throw new Error('FishStorage not initialized');
    }

    try {
      console.log('Starting fish data wipe process...');
      
      // First, get all fish_ids that are referenced in order_items
      const { data: referencedIds, error: referencedError } = await supabase
        .from('order_items')
        .select('fish_id')
        .not('fish_id', 'is', null);

      if (referencedError) {
        console.error('Error getting referenced fish IDs:', referencedError);
        throw new Error(`Failed to get referenced fish IDs: ${referencedError.message}`);
      }

      // Get the array of referenced IDs, or empty array if none found
      const referencedIdArray = (referencedIds || []).map(item => item.fish_id);
      
      if (referencedIdArray.length > 0) {
        // Delete all fish_data records that are NOT referenced in order_items
        const { error: deleteError } = await supabase
          .from('fish_data')
          .delete()
          .not('id', 'in', `(${referencedIdArray.join(',')})`);

        if (deleteError) {
          console.error('Error deleting unreferenced fish data:', deleteError);
          throw new Error(`Failed to delete unreferenced fish data: ${deleteError.message}`);
        }

        // For referenced records, mark them as disabled instead of deleting
        const { error: disableError } = await supabase
          .from('fish_data')
          .update({ disabled: true })
          .in('id', referencedIdArray);

        if (disableError) {
          console.error('Error disabling referenced fish data:', disableError);
          throw new Error(`Failed to disable referenced fish data: ${disableError.message}`);
        }

        console.log('Fish data wipe completed successfully');
        console.log(`- Disabled ${referencedIdArray.length} referenced records`);
      } else {
        // If no referenced IDs, delete all records
        const { error: deleteAllError } = await supabase
          .from('fish_data')
          .delete()
          .not('id', 'is', null);

        if (deleteAllError) {
          console.error('Error deleting all fish data:', deleteAllError);
          throw new Error(`Failed to delete all fish data: ${deleteAllError.message}`);
        }

        console.log('Fish data wipe completed successfully');
        console.log('- Deleted all records (no referenced records found)');
      }
    } catch (error) {
      console.error('Error in clearAllFishData:', error);
      throw error instanceof Error ? error : new Error('Failed to clear fish data');
    }
  }
}

export default FishStorage;