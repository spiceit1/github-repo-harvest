import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  maxQuantity?: number;
  isAdmin?: boolean;
}

const QuantityControl: React.FC<QuantityControlProps> = ({ 
  quantity, 
  onQuantityChange, 
  maxQuantity = 0,
  isAdmin = false
}) => {
  const isAtMax = maxQuantity !== undefined && quantity >= maxQuantity;

  return (
    <div className="flex flex-col items-start gap-2 w-full md:w-auto">
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <div className="inline-flex items-center justify-between w-full md:w-auto rounded border border-gray-300 bg-white">
          <button
            onClick={() => onQuantityChange(quantity - 1)}
            className="flex-1 md:flex-none w-14 md:w-12 h-12 md:h-10 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Decrease quantity"
          >
            {quantity === 1 ? (
              <Trash2 className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              const newQuantity = Math.max(0, Math.min(value, maxQuantity || value));
              onQuantityChange(newQuantity);
            }}
            className={`
              flex-1 md:flex-none w-14 md:w-12 h-12 md:h-10 text-center border-x border-gray-300 
              focus:outline-none text-base md:text-sm font-medium
              ${isAtMax ? 'bg-gray-50' : 'bg-white'}
            `}
            min="0"
            max={maxQuantity}
          />
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className={`
              flex-1 md:flex-none w-14 md:w-12 h-12 md:h-10 flex items-center justify-center
              transition-colors
              ${isAtMax 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'hover:bg-gray-100 active:bg-gray-200'
              }
            `}
            disabled={isAtMax}
            aria-label="Increase quantity"
          >
            <Plus className={`h-5 w-5 ${isAtMax ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
        {isAtMax && (
          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-center w-full">
            Max quantity reached
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityControl;