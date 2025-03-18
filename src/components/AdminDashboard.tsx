import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Image, FileUp, Save, AlertCircle, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Decimal from 'decimal.js';

interface PriceMarkup {
  id: string;
  category: string | null;
  markup_percentage: number;
}

interface ManualPrice {
  id: string;
  fish_id: string;
  price: number;
}

const AdminDashboard: React.FC = () => {
  const [markups, setMarkups] = useState<PriceMarkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualPrices, setManualPrices] = useState<ManualPrice[]>([]);

  useEffect(() => {
    loadMarkups();
    loadManualPrices();
  }, []);

  const loadMarkups = async () => {
    try {
      const { data, error } = await supabase
        .from('price_markups')
        .select('*')
        .order('category', { ascending: true, nullsFirst: true });

      if (error) throw error;
      setMarkups(data || []);
    } catch (err) {
      setError('Failed to load price markups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadManualPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_prices')
        .select('*');

      if (error) throw error;
      setManualPrices(data || []);
    } catch (err) {
      console.error('Failed to load manual prices:', err);
    }
  };

  const handleMarkupChange = (id: string, value: number) => {
    setMarkups(prev => prev.map(markup => 
      markup.id === id ? { ...markup, markup_percentage: value } : markup
    ));
  };

  const calculateSalePrice = (originalPrice: number, markup: number): string => {
    const price = new Decimal(originalPrice);
    const multiplier = new Decimal(1 + markup / 100);
    const rawPrice = price.times(multiplier);
    
    // Get the whole number part
    const wholeNumber = rawPrice.floor();
    
    // Always use .99 as cents
    return wholeNumber.plus(0.99).toFixed(2);
  };

  const saveMarkups = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase
        .from('price_markups')
        .upsert(markups);

      if (error) throw error;

      // Update all fish prices
      const { data: fishData } = await supabase
        .from('fish_data')
        .select('id, category, original_cost');

      if (fishData) {
        for (const fish of fishData) {
          if (!fish.original_cost) continue;

          // Check for manual price override first
          const manualPrice = manualPrices.find(mp => mp.fish_id === fish.id);
          if (manualPrice) {
            await supabase
              .from('fish_data')
              .update({ sale_cost: manualPrice.price })
              .eq('id', fish.id);
            continue;
          }

          // Apply markup if no manual price exists
          const markup = markups.find(m => 
            m.category === fish.category || m.category === null
          );

          if (markup) {
            const salePrice = calculateSalePrice(
              fish.original_cost,
              markup.markup_percentage
            );

            await supabase
              .from('fish_data')
              .update({ sale_cost: salePrice })
              .eq('id', fish.id);
          }
        }
      }

      setSuccess('Price markups saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save price markups');
      console.error(err);
    }
  };

  const handleManualPriceUpdate = async (fishId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('manual_prices')
        .upsert({
          fish_id: fishId,
          price: price
        });

      if (error) throw error;

      // Update fish_data table
      await supabase
        .from('fish_data')
        .update({ sale_cost: price })
        .eq('id', fishId);

      // Refresh manual prices
      await loadManualPrices();
      setSuccess('Manual price updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update manual price');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 flex items-center text-blue-800">
          <Settings className="h-6 w-6 mr-2" />
          Admin Dashboard
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Percent className="h-5 w-5 mr-2" />
              Category Markups
            </h3>

            <div className="space-y-4">
              {markups.map((markup) => (
                <div key={markup.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {markup.category || 'Default Markup (All Categories)'}
                    </label>
                  </div>
                  <div className="w-32 flex items-center">
                    <input
                      type="number"
                      value={markup.markup_percentage}
                      onChange={(e) => handleMarkupChange(markup.id, parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      min="0"
                      step="1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={saveMarkups}
                className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md">
                {success}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Manual Price Overrides
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set specific prices for individual items that override the category markup.
            </p>
            <div className="space-y-4">
              {/* Manual price override UI will be implemented here */}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Image className="h-5 w-5 mr-2" />
              Image Management
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click on any fish in the list to update its image URL. Changes will be saved automatically.
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FileUp className="h-5 w-5 mr-2" />
              CSV Import
            </h3>
            <p className="text-sm text-gray-600">
              Use the CSV import feature above to update fish data. Make sure to include prices in the correct format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;