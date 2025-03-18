import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';

interface CartHeaderProps {
  items: CartItem[];
  onViewCart: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ items, onViewCart }) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = items.length;

  return (
    <button
      onClick={onViewCart}
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      <div className="text-sm">
        <span className="font-bold">{uniqueItems}</span> types
        {' • '}
        <span className="font-bold">{totalItems}</span> total
      </div>
    </button>
  );
};

export default CartHeader;