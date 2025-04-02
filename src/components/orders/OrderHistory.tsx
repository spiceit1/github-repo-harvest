
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          fetchOrders(user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your orders...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to view your orders</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center py-8">You haven't placed any orders yet</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Order #{order.order_number}</h3>
              <span className={`px-2 py-1 rounded text-xs text-white ${
                order.status === 'completed' ? 'bg-green-500' : 
                order.status === 'shipped' ? 'bg-blue-500' : 
                order.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>
                Date: {new Date(order.created_at).toLocaleDateString()}
              </span>
              <span>
                Total: ${order.total_amount.toFixed(2)}
              </span>
            </div>
            <div className="mt-2">
              <a href={`/orders/${order.id}`} className="text-blue-500 text-sm hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
