import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, Copy, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import QuantityControl from '../components/QuantityControl';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCart();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const price = isAdmin 
      ? parseFloat(item.fish.cost?.replace('$', '') || '0')
      : item.fish.saleCost || 0;
    return sum + (price * item.quantity);
  }, 0);

  // Only calculate tax and shipping for customer view
  const tax = isAdmin ? 0 : subtotal * 0.07;
  const shipping = isAdmin ? 0 : (subtotal > 200 ? 0 : 15);
  const totalAmount = subtotal + tax + shipping;

  const copyToClipboard = () => {
    const orderText = items.map(item => {
      const cost = parseFloat(item.fish.cost?.replace('$', '') || '0');
      return `${item.quantity}x ${item.fish.name} @ $${cost.toFixed(2)} each`;
    }).join('\n');

    const totalCost = items.reduce((sum, item) => {
      const cost = parseFloat(item.fish.cost?.replace('$', '') || '0');
      return sum + (cost * item.quantity);
    }, 0);

    const fullText = `ORDER REQUEST:\n\n${orderText}\n\nTotal Cost: $${totalCost.toFixed(2)}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Continue Shopping
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Shopping Cart</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 order-2 lg:order-1">
              <div className="space-y-4">
                {items.map((item) => {
                  const itemPrice = isAdmin 
                    ? parseFloat(item.fish.cost?.replace('$', '') || '0')
                    : item.fish.saleCost || 0;
                  const itemTotal = itemPrice * item.quantity;
                  
                  return (
                    <div
                      key={item.fish.uniqueId}
                      className="bg-white rounded-lg shadow-sm border-l-4 border-l-orange-500"
                    >
                      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                        {item.fish.imageUrl && (
                          <div className="w-full md:w-48 h-48 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                            <img
                              src={item.fish.imageUrl}
                              alt={item.fish.name}
                              className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-lg">{item.fish.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Available: {item.fish.qtyoh}
                              </p>
                              <p className="text-gray-700 font-medium mt-1">
                                ${itemPrice.toFixed(2)} each
                              </p>
                            </div>
                            <div className="text-lg font-medium">
                              ${itemTotal.toFixed(2)}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-4">
                            <QuantityControl
                              quantity={item.quantity}
                              onQuantityChange={(quantity) => updateQuantity(item.fish.uniqueId, quantity)}
                              maxQuantity={item.fish.qtyoh}
                              isAdmin={isAdmin}
                            />
                            <button
                              onClick={() => removeItem(item.fish.uniqueId)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden md:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-96 order-1 lg:order-2 sticky top-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {!isAdmin && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax (7%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-lg font-semibold pt-4 border-t">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {isAdmin ? (
                  <button
                    onClick={copyToClipboard}
                    className={`w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      copySuccess 
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="h-5 w-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copy Order
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full mt-6 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Proceed to Checkout
                  </button>
                )}

                {!isAdmin && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    {subtotal < 200 ? (
                      <>
                        Add ${(200 - subtotal).toFixed(2)} more to get free shipping!
                      </>
                    ) : (
                      'You got free shipping!'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;