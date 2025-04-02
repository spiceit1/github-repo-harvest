
import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, BarChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import OrderManagement from './OrderManagement';
import EbayManagement from './EbayManagement';

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b mb-4">
      <button
        className={`px-4 py-2 ${activeTab === 'orders' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        onClick={() => setActiveTab('orders')}
      >
        Orders
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'inventory' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        onClick={() => setActiveTab('inventory')}
      >
        Inventory
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'ebay' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        onClick={() => setActiveTab('ebay')}
      >
        eBay
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        onClick={() => setActiveTab('analytics')}
      >
        Analytics
      </button>
    </div>
  );
};

interface DashboardStatsProps {
  stats: {
    pendingOrders: number;
    totalInventory: number;
    lowStock: number;
    totalSales: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-gray-500 text-sm">Pending Orders</h3>
        <p className="text-2xl font-bold">{stats.pendingOrders}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-gray-500 text-sm">Total Inventory</h3>
        <p className="text-2xl font-bold">{stats.totalInventory}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-gray-500 text-sm">Low Stock Items</h3>
        <p className="text-2xl font-bold">{stats.lowStock}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-gray-500 text-sm">Total Sales</h3>
        <p className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</p>
      </div>
    </div>
  );
};

const InventoryManagement: React.FC = () => {
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const { data, error } = await supabase
          .from('fish_data')
          .select('category, count(*)')
          .not('category', 'is', null)
          .group('category');

        if (error) throw error;
        setCategoryStats(data || []);
      } catch (err) {
        console.error('Error fetching category stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryStats();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Category Breakdown</h3>
          <div className="space-y-2">
            {categoryStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{stat.category}</span>
                <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                  {stat.count} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <div className="bg-white rounded-lg shadow p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Analytics data will appear here</p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [dashboardStats, setDashboardStats] = useState({
    pendingOrders: 0,
    totalInventory: 0,
    lowStock: 0,
    totalSales: 0
  });
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch pending orders count
        const { count: pendingOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        // Fetch inventory stats
        const { data: inventoryData } = await supabase
          .from('fish_data')
          .select('qtyoh');
        
        const totalInventory = inventoryData?.reduce((sum, item) => sum + (item.qtyoh || 0), 0) || 0;
        
        const { count: lowStock } = await supabase
          .from('fish_data')
          .select('*', { count: 'exact', head: true })
          .lt('qtyoh', 5)
          .gt('qtyoh', 0);
        
        // Fetch total sales
        const { data: salesData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'completed');
        
        const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        
        setDashboardStats({
          pendingOrders: pendingOrders || 0,
          totalInventory,
          lowStock: lowStock || 0,
          totalSales
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    
    fetchDashboardStats();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Users className="h-8 w-8 mr-2" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
      
      <DashboardStats stats={dashboardStats} />
      
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'orders' && <OrderManagement />}
      {activeTab === 'inventory' && <InventoryManagement />}
      {activeTab === 'ebay' && <EbayManagement />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
    </div>
  );
};

export default AdminDashboard;
