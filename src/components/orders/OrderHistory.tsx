import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: any;
  tracking_number?: string;
  shipping_carrier?: string;
  tracking_url?: string;
  order_items: {
    quantity: number;
    price_at_time: number;
    name_at_time: string;
  }[];
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            name_at_time
          )
        `)
        .eq('user_id', supabase.auth.getUser()?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Orders Yet</h3>
        <p className="text-gray-600 mt-2">
          When you place orders, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order.order_number}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-semibold">${order.total_amount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-4">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <div className="font-medium">{item.name_at_time}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.price_at_time.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${(item.quantity * item.price_at_time).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.tracking_number && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-gray-900">
                <Truck className="h-5 w-5" />
                <span className="font-medium">Tracking Information</span>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {order.shipping_carrier} - {order.tracking_number}
                </div>
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                >
                  Track Package
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-gray-900 mb-2">
              <Package className="h-5 w-5" />
              <span className="font-medium">Shipping Address</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
              <p>{order.shipping_address.addressLine1}</p>
              {order.shipping_address.addressLine2 && (
                <p>{order.shipping_address.addressLine2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                {order.shipping_address.postalCode}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;