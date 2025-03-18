import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderStatus {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
}

const OrderTracking: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderNumber]);

  const loadOrderDetails = async () => {
    try {
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            name_at_time
          )
        `)
        .eq('order_number', orderNumber)
        .single();

      if (orderError) throw orderError;

      // Get status history
      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;

      setOrder(orderData);
      setStatusHistory(historyData || []);
    } catch (err) {
      console.error('Error loading order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'processing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center text-red-600 p-4">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Order #{order.order_number}
            </h2>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-xl font-semibold">${order.total_amount.toFixed(2)}</div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="relative">
          <div className="absolute left-8 top-0 h-full w-px bg-gray-200"></div>
          <div className="space-y-8">
            {statusHistory.map((status, index) => (
              <div key={status.id} className="relative flex items-start">
                <div className="absolute left-0 rounded-full bg-white">
                  {getStatusIcon(status.status)}
                </div>
                <div className="ml-16">
                  <div className="font-medium text-gray-900">
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </div>
                  {status.notes && (
                    <p className="text-gray-600 mt-1">{status.notes}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(status.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.tracking_number && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Tracking Information</div>
                <div className="text-gray-600 mt-1">
                  {order.shipping_carrier} - {order.tracking_number}
                </div>
              </div>
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Track Package
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.order_items.map((item: any, index: number) => (
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
      </div>
    </div>
  );
};

export default OrderTracking;