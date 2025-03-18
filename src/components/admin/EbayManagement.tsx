import React, { useState, useEffect } from 'react';
import { Share2, RefreshCw, AlertCircle, Check, ExternalLink, Trash2, Settings, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EbayService from '../../utils/ebayService';
import { FishData } from '../../types';
import EbayCredentialsForm from './EbayCredentialsForm';

const EbayManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fishData, setFishData] = useState<FishData[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadFishData();
  }, []);

  const loadFishData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fish_data')
        .select('*')
        .eq('disabled', false)
        .eq('archived', false)
        .order('name');

      if (error) throw error;
      setFishData(data || []);
    } catch (err) {
      console.error('Error loading fish data:', err);
      setError('Failed to load fish data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const ebayService = EbayService.getInstance();
      await ebayService.syncInventory();

      await loadFishData(); // Refresh data
      setSuccess('Successfully synced inventory with eBay');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error syncing with eBay:', err);
      setError('Failed to sync with eBay');
    } finally {
      setSyncing(false);
    }
  };

  const handleEndListing = async (fish: FishData) => {
    if (!fish.ebay_listing_id) return;

    try {
      setError(null);
      const ebayService = EbayService.getInstance();
      await ebayService.endListing(fish.ebay_listing_id);

      await supabase
        .from('fish_data')
        .update({ 
          ebay_listing_id: null,
          ebay_listing_status: null
        })
        .eq('id', fish.id);

      await loadFishData(); // Refresh data
    } catch (err) {
      console.error('Error ending eBay listing:', err);
      setError('Failed to end eBay listing');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">eBay Management</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${syncing
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'}
              transition-colors
            `}
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync with eBay'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      {showSettings && (
        <EbayCredentialsForm />
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">eBay Listings</h3>
          
          <div className="space-y-4">
            {fishData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No fish found</p>
            ) : (
              fishData.map(fish => (
                <div 
                  key={fish.id}
                  className={`
                    border rounded-lg p-4
                    ${fish.ebay_listing_id ? 'border-green-200 bg-green-50' : 'border-gray-200'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{fish.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Price: ${fish.saleCost?.toFixed(2)}</div>
                        <div>Quantity: {fish.qtyoh}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {fish.ebay_listing_id ? (
                        <>
                          <a
                            href={`https://www.${fish.ebay_listing_status === 'sandbox' ? 'sandbox.' : ''}ebay.com/itm/${fish.ebay_listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Listing
                          </a>
                          <button
                            onClick={() => handleEndListing(fish)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            End Listing
                          </button>
                        </>
                      ) : (
                        <div className="text-gray-500 text-sm">Not listed</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayManagement;