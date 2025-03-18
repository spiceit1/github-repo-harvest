import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';
import { useNavigate } from 'react-router-dom';

interface CartButtonProps {
  items: CartItem[];
  isAdmin?: boolean;
}

const CartButton: React.FC<CartButtonProps> = ({ items, isAdmin = false }) => {
  const navigate = useNavigate();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    const price = isAdmin
      ? parseFloat(item.fish.cost?.replace('$', '') || '0')
      : item.fish.saleCost || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <button
      onClick={() => navigate('/cart')}
      className="flex items-center gap-2 md:gap-3 hover:bg-orange-600 px-2 md:px-3 py-2 rounded transition-colors relative"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        {totalQuantity > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-300 text-gray-900 text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
            {totalQuantity}
          </span>
        )}
      </div>
      <div className="text-sm hidden md:block">
        <div className="font-medium">Cart</div>
        <div className="text-yellow-300">
          {totalQuantity > 0 ? `$${totalAmount.toFixed(2)}` : 'Empty'}
        </div>
      </div>
    </button>
  );
};

export default CartButton;