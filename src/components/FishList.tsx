import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, FileUp, List, Download, ChevronDown, DollarSign, Eye, EyeOff, Percent, Package, Ban, Trash2 } from 'lucide-react';
import { parseCsvFile } from '../utils/csvParser';
import { FishData } from '../types';
import SearchModal from './SearchModal';
import FishStorage from '../utils/fishStorage';
import FishCard from './FishCard';
import { supabase } from '../lib/supabase';
import LoadingIndicator from './LoadingIndicator';
import StatsDisplay from './Stats';
import ImageCache from '../utils/imageCache';
import ImageStorage from '../utils/imageStorage';
import { useFishData } from '../contexts/FishDataContext';

interface FishListProps {
  isAdmin: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onCategoriesUpdate: (categories: string[]) => void;
  renderCustomView?: (fishData: FishData[]) => React.ReactNode;
}

const FishList = React.memo<FishListProps>(({
  isAdmin,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onCategoriesUpdate,
  renderCustomView
}) => {
  const { fishData, setFishData, loading, error: contextError, refreshData } = useFishData();
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<'database' | 'images' | 'processing' | 'deleting'>('database');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFish, setSelectedFish] = useState<FishData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasData = fishData.some(fish => !fish.isCategory);
  const isProcessing = loading || showProgress;

  useEffect(() => {
    const activeCategories = Array.from(new Set(
      fishData
        .filter(fish => !fish.isCategory && (!fish.disabled || isAdmin))
        .filter(fish => fish.category)
        .map(fish => fish.category!)
        .sort()
    ));

    onCategoriesUpdate(activeCategories);
  }, [fishData, isAdmin, onCategoriesUpdate]);

  const handleToggleCategory = async (category: string, disable: boolean) => {
    try {
      const categoryFish = fishData.filter(fish => 
        !fish.isCategory && fish.category === category && fish.id
      );

      if (categoryFish.length === 0) return;

      setShowProgress(true);
      setProgress(0);
      setProgressTotal(categoryFish.length);

      await FishStorage.updateCategoryStatus(category, disable);

      // Update local state instead of refetching
      setFishData(prevData => 
        prevData.map(fish => 
          fish.category === category && !fish.isCategory
            ? { ...fish, disabled: disable }
            : fish
        )
      );

      setProgress(categoryFish.length);

    } catch (error) {
      console.error('Error toggling category:', error);
      setError('Failed to toggle category status');
    } finally {
      setShowProgress(false);
      setLoadingMessage('');
      setLoadingProgress(0);
      setLoadingTotal(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setError(null);
    
    try {
      setLoadingStage('processing');
      setLoadingMessage('Processing CSV file...');
      
      const result = await parseCsvFile(file);
      
      if (!result || !result.fishData || result.fishData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const { fishData: newData, stats } = result;

      setLoadingMessage(`Found ${stats.items} items in ${stats.categories} categories. Saving data...`);
      
      await FishStorage.saveFishData(newData);
      
      setLoadingMessage('Loading images...');
      await ImageCache.preloadImages(newData);
      
      setFishData(newData);
      onCategoryChange('');
      setSelectedItems(new Set());

      setLoadingMessage(`Successfully processed ${stats.items} items`);
      setTimeout(() => setLoadingMessage(''), 2000);

    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  const handleClearData = async () => {
    if (!hasData) return;

    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }

    try {
      setLoadingStage('deleting');
      setLoadingMessage('Clearing existing data...');

      await FishStorage.clearAllData((current, total) => {
        setLoadingProgress(current);
        setLoadingTotal(total);
      });

      setFishData([]);
      setSelectedItems(new Set());
      onCategoryChange('');

    } catch (error) {
      console.error('Error clearing data:', error);
      setError('Failed to clear data. Please try again.');
    } finally {
      setLoadingMessage('');
      setLoadingProgress(0);
      setLoadingTotal(0);
    }
  };

  const handleSearchClick = (fish: FishData) => {
    setSelectedFish(fish);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (fish: FishData) => {
    if (!fish.id) return;

    try {
      setLoadingStage('deleting');
      setLoadingMessage('Deleting item...');

      await FishStorage.deleteItem(fish.id);

      // Update local state instead of refetching
      setFishData(prevData => prevData.filter(item => item.id !== fish.id));

    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    } finally {
      setLoadingMessage('');
      setLoadingProgress(0);
      setLoadingTotal(0);
    }
  };

  const handleImageUpdate = async (searchName: string, imageUrl: string) => {
    if (!searchName || !imageUrl) {
      console.error('Invalid search name or image URL');
      return;
    }

    try {
      setLoadingStage('images');
      setLoadingMessage('Updating image...');

      await ImageStorage.storeImage(searchName, imageUrl);

      // Update local state instead of refetching
      setFishData(prevData => 
        prevData.map(fish => 
          fish.searchName === searchName 
            ? { ...fish, imageUrl } 
            : fish
        )
      );

      await ImageCache.preloadImages([{ imageUrl } as FishData]);

      setIsModalOpen(false);
      setSelectedFish(null);

    } catch (error) {
      console.error('Error updating image:', error);
      setError('Failed to update image. Please try again.');
    } finally {
      setLoadingMessage('');
      setLoadingProgress(0);
      setLoadingTotal(0);
    }
  };

  const filteredFishData = useMemo(() => {
    return fishData.filter(fish => {
      if (fish.isCategory) return true;
      
      if (fish.archived) return false;
      
      if (!isAdmin && fish.disabled) return false;
      if (isAdmin && !showDisabled && fish.disabled) return false;
      
      if (searchTerm) {
        return (
          fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (fish.category && fish.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      if (selectedCategory && fish.category !== selectedCategory) return false;

      return true;
    });
  }, [fishData, searchTerm, showDisabled, isAdmin, selectedCategory]);

  const groupedFishData = useMemo(() => {
    const groups: { [key: string]: FishData[] } = {};
    const categoryOrder = Array.from(new Set(
      fishData
        .filter(fish => !fish.isCategory && fish.category)
        .map(fish => fish.category!)
    )).sort();
    
    // Initialize empty arrays for each category in order
    categoryOrder.forEach(category => {
      groups[category] = [];
    });
    
    // Group fish by category
    filteredFishData.forEach(fish => {
      if (!fish.isCategory && fish.category) {
        if (!groups[fish.category]) {
          groups[fish.category] = [];
        }
        if (!fish.disabled || (isAdmin && showDisabled)) {
          groups[fish.category].push(fish);
        }
      }
    });

    // Remove empty categories
    Object.keys(groups).forEach(category => {
      if (groups[category].length === 0) {
        delete groups[category];
      }
    });

    return groups;
  }, [filteredFishData, isAdmin, showDisabled]);

  if (renderCustomView) {
    return renderCustomView(filteredFishData);
  }

  if (loading || contextError) {
    return (
      <LoadingIndicator 
        stage={loadingStage}
        progress={loadingTotal > 0 ? {
          current: loadingProgress,
          total: loadingTotal
        } : undefined}
        message={loadingMessage || contextError}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Fish List CSV</h2>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Select CSV File
                </label>
                <div className="flex items-center gap-4">
                  <label 
                    className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                      hasData || isProcessing
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
                    }`}
                  >
                    <FileUp className="h-5 w-5 mr-2" />
                    Choose File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={hasData || isProcessing}
                    />
                  </label>
                  <button
                    onClick={handleClearData}
                    disabled={!hasData || isProcessing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      !hasData || isProcessing
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <Trash2 className="h-5 w-5" />
                    Clear Data
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </div>

          <StatsDisplay 
            fishData={fishData}
            onToggleCategory={handleToggleCategory}
            onCategoryClick={onCategoryChange}
          />

          <div className="bg-gray-800 text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDisabled}
                  onChange={(e) => setShowDisabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2">Show Disabled</span>
              </label>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4">
          {Object.keys(groupedFishData).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedFishData).map(([category, items]) => (
                items.length > 0 && (
                  <div key={category} id={`category-${category}`}>
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                    </div>
                    <div className="space-y-4">
                      {items.map((fish) => (
                        <FishCard
                          key={fish.uniqueId}
                          fish={fish}
                          onImageClick={() => handleSearchClick(fish)}
                          isAdmin={isAdmin}
                          onToggleDisabled={async () => {
                            try {
                              await FishStorage.updateCategoryStatus(fish.category || '', !fish.disabled);
                              setFishData(prevData => 
                                prevData.map(item => 
                                  item.id === fish.id
                                    ? { ...item, disabled: !fish.disabled }
                                    : item
                                )
                              );
                            } catch (error) {
                              console.error('Error toggling fish status:', error);
                              setError('Failed to toggle fish status');
                            }
                          }}
                          onDelete={() => handleDeleteItem(fish)}
                          onImageUpdate={handleImageUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Upload className="h-12 w-12 mb-3" />
              <p>No fish found</p>
            </div>
          )}
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFish(null);
        }}
        url={selectedFish?.searchUrl || ''}
        fish={selectedFish}
        onImageUpdate={handleImageUpdate}
      />

      {showProgress && (
        <LoadingIndicator
          stage="processing"
          progress={{
            current: progress,
            total: progressTotal
          }}
          message="Processing bulk action..."
        />
      )}
    </div>
  );
});

FishList.displayName = 'FishList';

export default FishList;