import React, { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  savedCards?: SavedCard[];
  onSaveCard?: (data: PaymentFormData) => void;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  showSaveCard?: boolean;
}

export interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  saveCard?: boolean;
}

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  savedCards = [],
  onSaveCard,
  shippingAddress,
  showSaveCard = true
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [selectedCard, setSelectedCard] = useState<string>('new');
  const [saveCard, setSaveCard] = useState(false);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCard === 'new' && saveCard && onSaveCard) {
      onSaveCard(formData);
    }
    onSubmit(formData);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
        <CreditCard className="h-5 w-5" />
        Payment Information
      </div>

      {savedCards.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Saved Cards
          </label>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {savedCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCard(card.id)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedCard === card.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">
                  {card.brand} •••• {card.last4}
                </div>
                <div className="text-sm text-gray-600">
                  Expires {card.expiryMonth}/{card.expiryYear}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCard('new')}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedCard === 'new'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Use a different card</div>
              <div className="text-sm text-gray-600">
                Enter a new card
              </div>
            </button>
          </div>
        </div>
      )}

      {selectedCard === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Card Number
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  cardNumber: formatCardNumber(e.target.value)
                })}
                maxLength={19}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Month
              </label>
              <select
                value={formData.expiryMonth}
                onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {month.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                value={formData.expiryYear}
                onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="">YY</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year.toString().slice(-2)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                CVV
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => setFormData({
                    ...formData,
                    cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                  })}
                  required
                  maxLength={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Billing Address</div>
              <button
                type="button"
                onClick={() => setUseDifferentBilling(!useDifferentBilling)}
                className="text-sm text-orange-600 hover:text-orange-500"
              >
                {useDifferentBilling ? 'Use shipping address' : 'Use different address'}
              </button>
            </div>

            {!useDifferentBilling && (
              <div className="mt-2 text-sm text-gray-600">
                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                <p>{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
              </div>
            )}
          </div>

          {showSaveCard && onSaveCard && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="save-card"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="save-card" className="ml-2 block text-sm text-gray-900">
                Save this card for future purchases
              </label>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Place Order
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;