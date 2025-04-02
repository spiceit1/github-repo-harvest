import React, { useState, useEffect } from 'react';
import { Search, Edit, RefreshCw } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { FishCard } from './FishCard';
import SearchModal from './SearchModal';
import * as fishStorage from '../utils/fishStorage';
import { supabase } from '../lib/supabase';
import { FishListProps, FishData } from '../types/fish';

const FishList: React.FC<FishListProps> = ({
  isAdmin,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onCategoriesUpdate
}) => {
  const [fish, setFish] = useState<FishData[]>([]);
  const [filteredFish, setFilteredFish] = useState<FishData[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedFish, setSelectedFish] = useState<FishData | null>(null);
  
  // Keep only necessary state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load fish data on component mount
  useEffect(() => {
    const loadFishData = async () => {
      setLoading(true);
      try {
        const data = await fishStorage.fetchFishData({
          category: selectedCategory || undefined,
          searchTerm: searchTerm || undefined,
          includeDisabled: isAdmin,
          includeArchived: isAdmin
        });
        setFish(data);
        setFilteredFish(data);
      } catch (err) {
        setError('Error loading fish data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFishData();
  }, [isAdmin, searchTerm, selectedCategory]);

  // Filter fish when search term or category changes
  useEffect(() => {
    let filtered = fish;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setFilteredFish(filtered);
  }, [fish, searchTerm, selectedCategory]);

  // Render content based on loading state and data availability
  return (
    <div className="w-full">
      {loading ? (
        <div className="w-full text-center p-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading fish data...</p>
        </div>
      ) : error ? (
        <div className="w-full text-center p-8 text-red-500">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : filteredFish.length === 0 ? (
        <div className="w-full text-center p-8 text-gray-500">
          <p>No fish found. Try changing your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFish.map((fish) => (
            <FishCard
              key={fish.uniqueId}
              fish={fish}
              isAdmin={isAdmin}
              onEdit={() => {
                setSelectedFish(fish);
                setShowSearchModal(true);
              }}
            />
          ))}
        </div>
      )}

      {showSearchModal && selectedFish && (
        <SearchModal
          fish={selectedFish}
          onClose={() => {
            setShowSearchModal(false);
            setSelectedFish(null);
          }}
          onSave={(updatedFish) => {
            setFish(prevFish => 
              prevFish.map(f => f.uniqueId === updatedFish.uniqueId ? updatedFish : f)
            );
            setShowSearchModal(false);
            setSelectedFish(null);
          }}
        />
      )}
    </div>
  );
};

export default FishList;
