import { supabase } from '../lib/supabase';

// Types
interface FishDataFilter {
  category?: string;
  searchTerm?: string;
  includeDisabled?: boolean;
  includeArchived?: boolean;
}

// Constants
const PAGE_SIZE = 100; // Add type annotation and keep the constant for future use
const IMAGE_BATCH_SIZE = 20; // Add type annotation and keep the constant for future use

// Function to fetch fish data with filters
export const fetchFishData = async (filters?: FishDataFilter) => {
  try {
    let query = supabase
      .from('fish_data')
      .select('*');
    
    // Apply filters if provided
    if (filters) {
      // Filter by category if specified
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      // Filter by search term if specified
      if (filters.searchTerm) {
        const searchTermLower = filters.searchTerm.toLowerCase();
        query = query.ilike('search_name', `%${searchTermLower}%`);
      }
      
      // Include or exclude disabled items
      if (filters.includeDisabled === false) {
        query = query.eq('disabled', false);
      }
      
      // Include or exclude archived items
      if (filters.includeArchived === false) {
        query = query.eq('archived', false);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fish data:', error);
    return [];
  }
};

// Function to fetch categories
export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('fish_data')
      .select('category')
      .eq('is_category', true);
    
    if (error) throw error;
    
    // Format and filter the categories
    const categories = data
      .map((item: { category: string }) => item.category)
      .filter(Boolean);
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Function to update fish data
export const updateFishData = async (id: string, updates: Partial<FishData>) => {
  try {
    // Remove any properties that should not be sent to the database
    const { uniqueId, searchUrl, ...validUpdates } = updates as any;
    
    const { data, error } = await supabase
      .from('fish_data')
      .update(validUpdates)
      .eq('id', id);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating fish data:', error);
    return null;
  }
};

// Function to save fish image
export const saveFishImage = async (searchName: string, imageUrl: string) => {
  try {
    // First check if an image already exists for this fish
    const { data: existingImages, error: fetchError } = await supabase
      .from('fish_images')
      .select('*')
      .eq('search_name', searchName);
    
    if (fetchError) throw fetchError;
    
    if (existingImages && existingImages.length > 0) {
      // Update the existing image
      const { error: updateError } = await supabase
        .from('fish_images')
        .update({ image_url: imageUrl })
        .eq('search_name', searchName);
      
      if (updateError) throw updateError;
    } else {
      // Insert a new image
      const { error: insertError } = await supabase
        .from('fish_images')
        .insert([
          { 
            search_name: searchName, 
            image_url: imageUrl,
            user_id: (await supabase.auth.getUser()).data.user?.id || ''
          }
        ]);
      
      if (insertError) throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving fish image:', error);
    return false;
  }
};

// Function to fetch fish images
export const fetchFishImages = async (searchNames: string[]) => {
  try {
    if (!searchNames.length) return {};
    
    const { data, error } = await supabase
      .from('fish_images')
      .select('search_name, image_url')
      .in('search_name', searchNames);
    
    if (error) throw error;
    
    // Convert to a map for easier access
    const imagesMap: Record<string, string> = {};
    data?.forEach((img: { search_name: string, image_url: string }) => {
      imagesMap[img.search_name] = img.image_url;
    });
    
    return imagesMap;
  } catch (error) {
    console.error('Error fetching fish images:', error);
    return {};
  }
};

// Add any other necessary functions for fish data management
export const bulkUpdateFishData = async (updates: Array<{ id: string, data: Partial<FishData> }>) => {
  try {
    // Since Supabase doesn't support bulk updates natively, we'll process them sequentially
    const results = [];
    
    for (const update of updates) {
      const result = await updateFishData(update.id, update.data);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Error performing bulk update:', error);
    return [];
  }
};
