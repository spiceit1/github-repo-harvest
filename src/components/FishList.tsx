import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
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
import { useFishData } from '../hooks/useFishData';
import { FishDataContext } from '../contexts/FishDataContext';

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
  const { 
    fishData, 
    setFishData, 
    loading, 
    error: contextError, 
    refreshData,
    progress,
    categories 
  } = useContext(FishDataContext);
  
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<'database' | 'images' | 'processing' | 'deleting'>('database');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
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
      setBulkProgress(0);
      setBulkTotal(categoryFish.length);

      await FishStorage.updateCategoryStatus(category, disable);

      // Update local state instead of refetching
      setFishData(prevData => 
        prevData.map(fish => 
          fish.category === category && !fish.isCategory
            ? { ...fish, disabled: disable }
            : fish
        )
      );

      setBulkProgress(categoryFish.length);

    } catch (error) {
      console.error('Error toggling category:', error);
      setError('Failed to toggle category status');
    } finally {
      setLoadingMessage('');
      setBulkProgress(0);
      setBulkTotal(0);
      setShowProgress(false);
    }
  };

  const handleToggleItem = async (fish: FishData) => {
    if (!fish.id) return;

    try {
      setShowProgress(true);
      setBulkProgress(0);
      setBulkTotal(1);

      await FishStorage.updateItemStatus(fish.id, !fish.disabled);

      // Update local state instead of refetching
      setFishData(prevData => 
        prevData.map(item => 
          item.id === fish.id
            ? { ...item, disabled: !item.disabled }
            : item
        )
      );

      setBulkProgress(1);

    } catch (error) {
      console.error('Error toggling item:', error);
      setError('Failed to toggle item status');
    } finally {
      setLoadingMessage('');
      setBulkProgress(0);
      setBulkTotal(0);
      setShowProgress(false);
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

  const handleBulkAction = async () => {
    setError(null);
    setLoadingStage('processing');
    setShowProgress(true);
    setBulkProgress(0);
    setBulkTotal(selectedItems.size);

    try {
      if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        return;
      }

      await FishStorage.clearAllData((current, total) => {
        setBulkProgress(current);
        setBulkTotal(total);
      });

      setFishData([]);
      setSelectedItems(new Set());
      onCategoryChange('');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoadingMessage('');
      setBulkProgress(0);
      setBulkTotal(0);
      setShowProgress(false);
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
      setBulkProgress(0);
      setBulkTotal(0);
      setShowProgress(false);
    }
  };

  const handleImageUpdate = async (searchName: string, imageData: string) => {
    if (!searchName || !imageData) {
      console.error('Missing search name or image data');
      return;
    }

    try {
      await ImageStorage.storeImage(searchName, imageData);
      refreshData();
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  };

  const handleImageUpdated = () => {
    // Refresh the fish list to get updated images
    loadFishData();
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
      <div className="container mx-auto px-4 py-8">
        <LoadingIndicator
          message={progress ? `Loading ${progress?.loaded} of ${progress?.total} ${progress?.stage === 'images' ? 'images' : 'items'}...` : 'Initializing...'}
          showProgress={progress !== null}
          loaded={progress?.loaded}
          total={progress?.total}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
                    onClick={handleBulkAction}
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
                          isAdmin={isAdmin}
                          isSelected={selectedItems.has(fish.uniqueId)}
                          onSelect={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(fish.uniqueId);
                            } else {
                              newSelected.delete(fish.uniqueId);
                            }
                            setSelectedItems(newSelected);
                          }}
                          onToggleDisabled={() => handleToggleItem(fish)}
                          onUpdateSalePrice={(price) => handleImageUpdate(fish.searchName, price)}
                          onDelete={() => handleDeleteItem(fish)}
                          onImageUpdated={() => refreshData()}
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

      {isModalOpen && selectedFish && (
        <SearchModal
          fish={selectedFish}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFish(null);
          }}
          onImageUpdate={handleImageUpdate}
        />
      )}

      {showProgress && bulkTotal > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="text-sm font-medium text-gray-700">
            Processing... ({Math.round((bulkProgress / bulkTotal) * 100)}%)
          </div>
          <div className="mt-2 h-1 bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress / bulkTotal) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

FishList.displayName = 'FishList';

export default FishList;