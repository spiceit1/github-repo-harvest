import React from 'react';
import { X, Trash2, Copy, Check } from 'lucide-react';
import { CartItem } from '../types';
import QuantityControl from './QuantityControl';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (uniqueId: string, quantity: number) => void;
  onRemoveItem: (uniqueId: string) => void;
  isAdmin?: boolean;
}

const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  isAdmin = false
}) => {
  const [copySuccess, setCopySuccess] = React.useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const price = isAdmin 
      ? parseFloat(item.fish.cost?.replace('$', '') || '0')
      : item.fish.saleCost || 0;
    return sum + (price * item.quantity);
  }, 0);

  const copyToClipboard = () => {
    const orderText = items.map(item => {
      const cost = item.fish.cost?.replace('$', '') || '0';
      return `${item.quantity}x ${item.fish.name} @ $${cost} each`;
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

  const handleCheckout = () => {
    onClose();
    setTimeout(() => {
      navigate('/checkout');
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center">
      <div className="bg-white w-full max-w-4xl mt-20 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-medium">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your Cart is Empty</h3>
              <p className="text-gray-600">
                Browse our collection to add some fish to your cart
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {items.map((item) => {
                  const itemPrice = isAdmin 
                    ? parseFloat(item.fish.cost?.replace('$', '') || '0')
                    : item.fish.saleCost || 0;
                  const itemTotal = itemPrice * item.quantity;
                  
                  return (
                    <div
                      key={item.fish.uniqueId}
                      className="flex gap-6 pb-6 border-b"
                    >
                      {item.fish.imageUrl && (
                        <img
                          src={item.fish.imageUrl}
                          alt={item.fish.name}
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{item.fish.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.fish.qtyoh !== undefined && (
                                <span className="block">Available: {item.fish.qtyoh}</span>
                              )}
                              <span className="block text-gray-700 font-medium">
                                {isAdmin ? `Cost: $${itemPrice.toFixed(2)}` : `$${itemPrice.toFixed(2)}`} each
                              </span>
                            </p>
                          </div>
                          <div className="text-lg font-medium">
                            ${itemTotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center">
                          <div className="flex-1">
                            <QuantityControl
                              quantity={item.quantity}
                              onQuantityChange={(quantity) => onUpdateQuantity(item.fish.uniqueId, quantity)}
                              maxQuantity={item.fish.qtyoh}
                              isAdmin={isAdmin}
                            />
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.fish.uniqueId)}
                            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 ml-6"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between items-center border-t pt-6">
                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={copyToClipboard}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        copySuccess 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {copySuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Order
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg">
                    Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):
                    <span className="font-bold ml-2">${subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                  >
                    Proceed to checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;