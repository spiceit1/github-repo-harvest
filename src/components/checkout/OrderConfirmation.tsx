import React from 'react';
import { CheckCircle, Package, Truck, CreditCard } from 'lucide-react';
import { CartItem } from '../../types';

interface OrderConfirmationProps {
  orderNumber: string;
  items: CartItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: {
    last4: string;
    brand: string;
  };
  total: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  isGuest?: boolean;
  guestEmail?: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderNumber,
  items,
  shippingAddress,
  paymentMethod,
  total,
  isGuest,
  guestEmail
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Order Confirmed!
          </h2>
          <p className="text-gray-600">
            Order #{orderNumber}
          </p>
        </div>
      </div>

      {isGuest && guestEmail && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800">
            Order confirmation and updates will be sent to: <strong>{guestEmail}</strong>
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Package className="h-5 w-5" />
              Order Details
            </div>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.fish.uniqueId} className="flex justify-between">
                  <div>
                    <div className="font-medium">{item.fish.name}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.fish.saleCost?.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${(item.quantity * (item.fish.saleCost || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Truck className="h-5 w-5" />
              Shipping Address
            </div>
            <div className="text-gray-600">
              <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </div>
            <div className="text-gray-600">
              {paymentMethod.brand} •••• {paymentMethod.last4}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${total.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {total.shipping === 0 ? 'Free' : `$${total.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${total.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              You will receive an email confirmation shortly at your {isGuest ? 'provided' : 'registered'} email address.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;