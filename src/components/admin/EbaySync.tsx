import React, { useState } from 'react';
import { RefreshCw, AlertCircle, Check } from 'lucide-react';
import EbayService from '../../utils/ebayService';

const EbaySync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(false);

      const ebayService = EbayService.getInstance();
      await ebayService.syncInventory();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error syncing with eBay:', error);
      setError('Failed to sync inventory with eBay. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">eBay Sync</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Sync your inventory with eBay to automatically create and update listings.
        </p>

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

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="h-5 w-5" />
            Successfully synced inventory with eBay!
          </div>
        )}
      </div>
    </div>
  );
};

export default EbaySync;