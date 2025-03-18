import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Image, FileUp, Save, AlertCircle, Percent, Package, ChevronDown, ChevronUp, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Decimal from 'decimal.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import EbaySync from './EbaySync';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

interface SalesData {
  date: string;
  total: number;
  orders: number;
}

interface CategorySales {
  category: string;
  total: number;
  quantity: number;
}

const AdminDashboard: React.FC = () => {
  const [markups, setMarkups] = useState<PriceMarkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualPrices, setManualPrices] = useState<ManualPrice[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    markups: true,
    sales: true,
    categories: true,
    ebay: true
  });

  useEffect(() => {
    loadMarkups();
    loadManualPrices();
    loadSalesData();
    loadCategorySales();
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

  const loadSalesData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedData = data.reduce((acc: { [key: string]: SalesData }, order) => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { date, total: 0, orders: 0 };
        }
        acc[date].total += order.total_amount;
        acc[date].orders += 1;
        return acc;
      }, {});

      setSalesData(Object.values(groupedData));
    } catch (err) {
      console.error('Failed to load sales data:', err);
    }
  };

  const loadCategorySales = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price_at_time,
          fish_data (
            category
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const categoryTotals = data.reduce((acc: { [key: string]: CategorySales }, item) => {
        const category = item.fish_data?.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { category, total: 0, quantity: 0 };
        }
        acc[category].total += item.price_at_time * item.quantity;
        acc[category].quantity += item.quantity;
        return acc;
      }, {});

      setCategorySales(Object.values(categoryTotals));
    } catch (err) {
      console.error('Failed to load category sales:', err);
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
    const wholeNumber = rawPrice.floor();
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

      const { data: fishData } = await supabase
        .from('fish_data')
        .select('id, category, original_cost');

      if (fishData) {
        for (const fish of fishData) {
          if (!fish.original_cost) continue;

          const manualPrice = manualPrices.find(mp => mp.fish_id === fish.id);
          if (manualPrice) {
            await supabase
              .from('fish_data')
              .update({ sale_cost: manualPrice.price })
              .eq('id', fish.id);
            continue;
          }

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        {/* eBay Integration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">eBay Integration</h2>
            </div>
            <button
              onClick={() => toggleSection('ebay')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.ebay ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {expandedSections.ebay && (
            <EbaySync />
          )}
        </div>

        {/* Sales Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Sales Overview</h2>
            </div>
            <button
              onClick={() => toggleSection('sales')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.sales ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {expandedSections.sales && (
            <div className="space-y-6">
              <div className="h-80">
                <Line
                  data={{
                    labels: salesData.map(d => format(new Date(d.date), 'MMM d')),
                    datasets: [
                      {
                        label: 'Daily Sales',
                        data: salesData.map(d => d.total),
                        borderColor: 'rgb(249, 115, 22)',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}`
                        }
                      }
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <Bar
                    data={{
                      labels: salesData.map(d => format(new Date(d.date), 'MMM d')),
                      datasets: [
                        {
                          label: 'Orders',
                          data: salesData.map(d => d.orders),
                          backgroundColor: 'rgb(249, 115, 22)',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        }
                      }
                    }}
                  />
                </div>

                <div className="h-64">
                  <Bar
                    data={{
                      labels: categorySales.map(c => c.category),
                      datasets: [
                        {
                          label: 'Category Sales',
                          data: categorySales.map(c => c.total),
                          backgroundColor: 'rgb(249, 115, 22)',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${value}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Price Management</h2>
            </div>
            <button
              onClick={() => toggleSection('markups')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.markups ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {expandedSections.markups && (
            <>
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
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                  className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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
            </>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Category Performance</h2>
            </div>
            <button
              onClick={() => toggleSection('categories')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.categories ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {expandedSections.categories && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySales.map((category) => (
                <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{category.category}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Sales:</span>
                      <span className="font-medium">${category.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Units Sold:</span>
                      <span className="font-medium">{category.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg. Price:</span>
                      <span className="font-medium">
                        ${(category.total / category.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;