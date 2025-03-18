import React from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { CartItem } from '../../types';

interface CheckoutLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  items: CartItem[];
  onBack?: () => void;
}

const CheckoutLayout: React.FC<CheckoutLayoutProps> = ({
  children,
  step,
  totalSteps,
  items,
  onBack
}) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.fish.saleCost || 0;
    return sum + (price * item.quantity);
  }, 0);

  const tax = subtotal * 0.07; // 7% tax
  const shipping = subtotal > 200 ? 0 : 15; // Free shipping over $200
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
                  <div className="text-sm text-gray-600">
                    Step {step} of {totalSteps}
                  </div>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {children}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </div>

              <div className="space-y-4 mb-6">
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

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (7%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutLayout;