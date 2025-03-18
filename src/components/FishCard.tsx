import React, { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Package, AlertCircle, Check, X, Trash2, ShoppingCart, Share2 } from 'lucide-react';
import { FishData } from '../types';
import QuantityControl from './QuantityControl';
import ImageLoader from './ImageLoader';
import { useCart } from '../contexts/CartContext';
import { formatFishName } from '../utils/formatters';
import EbayService from '../utils/ebayService';

interface FishCardProps {
  fish: FishData;
  onImageClick?: () => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onToggleDisabled?: () => void;
  onUpdateSalePrice?: (price: number) => void;
  onDelete?: () => void;
  onImageUpdate?: (imageUrl: string) => void;
}

const FishCard: React.FC<FishCardProps> = ({ 
  fish,
  onImageClick,
  isAdmin = false,
  isSelected = false,
  onSelect,
  onToggleDisabled,
  onUpdateSalePrice,
  onDelete,
  onImageUpdate
}) => {
  const { items, addItem, updateQuantity } = useCart();
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(fish.saleCost?.toString() || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(fish.imageUrl);
  const [isListingOnEbay, setIsListingOnEbay] = useState(false);
  const [ebayError, setEbayError] = useState<string | null>(null);

  const cartItem = items.find(item => item.fish.uniqueId === fish.uniqueId);
  const quantity = cartItem?.quantity || 0;

  if (fish.disabled && !isAdmin) return null;

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return '';
    if (typeof amount === 'string' && amount.startsWith('$')) return amount;
    return `$${Number(amount).toFixed(2)}`;
  };

  const handleSaveSalePrice = async () => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0 && onUpdateSalePrice) {
      setIsUpdating(true);
      try {
        await onUpdateSalePrice(price);
        setIsEditingPrice(false);
      } catch (error) {
        console.error('Failed to update price:', error);
        alert('Failed to update price. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
    onImageUpdate?.(newImageUrl);
  };

  const handleAddToCart = () => {
    addItem({ fish, quantity: 1 });
  };

  const handleListOnEbay = async () => {
    setIsListingOnEbay(true);
    setEbayError(null);
    
    try {
      const ebayService = EbayService.getInstance();
      if (fish.ebay_listing_id) {
        // Update existing listing
        await ebayService.updateListing(fish, fish.ebay_listing_id);
      } else {
        // Create new listing
        await ebayService.createListing(fish);
      }
    } catch (error) {
      console.error('Error listing on eBay:', error);
      setEbayError('Failed to list on eBay. Please try again.');
    } finally {
      setIsListingOnEbay(false);
    }
  };

  const isLastOne = fish.qtyoh === 1;
  const { displayName, size, gender } = formatFishName(fish.name);

  return (
    <div 
      className={`
        flex flex-col md:flex-row items-start gap-4 md:gap-6 p-4 bg-white rounded-lg 
        ${isLastOne ? 'border-2 border-orange-500' : 'border'} 
        ${fish.disabled ? 'opacity-60' : ''}
        relative
      `}
    >
      {isLastOne && (
        <div className="absolute -top-3 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
          Last One!
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center h-full pt-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
        </div>
      )}
      
      <div className="relative w-full md:w-80 h-64 flex-shrink-0 bg-white rounded-lg overflow-hidden">
        <ImageLoader
          src={currentImageUrl || ''}
          alt={displayName}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
          onClick={isAdmin ? onImageClick : undefined}
        />
      </div>
      
      <div className="flex-1 w-full">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="font-medium text-lg">{displayName}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {size && (
                <span className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  Size: {size}
                </span>
              )}
              {gender && (
                <span className="text-sm px-2 py-1 bg-purple-50 text-purple-700 rounded">
                  {gender}
                </span>
              )}
            </div>
            
            <div className="mt-2 space-y-2">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-2">
                    <span>Cost:</span> {formatCurrency(fish.cost)}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2">
                        <span>Sale Price:</span>
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-24 px-2 py-1 border rounded"
                          step="0.01"
                          min="0"
                          autoFocus
                          disabled={isUpdating}
                        />
                        <button 
                          onClick={handleSaveSalePrice}
                          className={`p-1 text-green-600 hover:bg-green-50 rounded ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isUpdating}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingPrice(false);
                            setNewPrice(fish.saleCost?.toString() || '');
                          }}
                          className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Sale Price:</span> {formatCurrency(fish.saleCost)}
                        <button 
                          onClick={() => {
                            setNewPrice(fish.saleCost?.toString() || '');
                            setIsEditingPrice(true);
                          }}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Price:</span> {formatCurrency(fish.saleCost)}
                </div>
              )}
              
              <div className={`flex items-center gap-2 ${isLastOne ? 'text-orange-600 font-medium' : ''}`}>
                <Package className={`h-4 w-4 ${isLastOne ? 'text-orange-600' : ''}`} />
                QTY Available: <span className={fish.qtyoh === 0 ? 'text-red-600' : isLastOne ? 'text-orange-600' : 'text-green-600'}>
                  {fish.qtyoh || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 mt-4 md:mt-0">
            {!fish.disabled && (
              quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAdmin 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={fish.qtyoh === 0}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isAdmin ? 'Add to Order' : 'Add to Cart'}
                </button>
              ) : (
                <QuantityControl
                  quantity={quantity}
                  onQuantityChange={(newQuantity) => updateQuantity(fish.uniqueId, newQuantity)}
                  maxQuantity={fish.qtyoh}
                  isAdmin={isAdmin}
                />
              )
            )}

            {isAdmin && (
              <button
                onClick={handleListOnEbay}
                disabled={isListingOnEbay}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  fish.ebay_listing_id
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Share2 className="h-5 w-5" />
                {fish.ebay_listing_id ? 'Update eBay Listing' : 'List on eBay'}
              </button>
            )}
          </div>
        </div>

        {ebayError && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {ebayError}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 flex gap-4">
            <button
              onClick={onImageClick}
              className="text-sm text-blue-600 hover:underline"
            >
              Update Image
            </button>
            <button
              onClick={onToggleDisabled}
              className={`text-sm flex items-center gap-1 ${fish.disabled ? 'text-green-600' : 'text-red-600'}`}
            >
              {fish.disabled ? (
                <>
                  <Eye className="h-4 w-4" /> Enable
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" /> Disable
                </>
              )}
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                    onDelete();
                  }
                }}
                className="text-sm flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FishCard;