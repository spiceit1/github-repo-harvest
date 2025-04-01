import React from 'react';
import PayPalButton from './PayPalButton';
import { CartItem } from '../../types';
import { ShippingFormData } from './ShippingForm';

export interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  saveCard?: boolean;
  paypalOrderId?: string;  // Optional field for PayPal payments
}

interface PaymentFormProps {
  // PayPal specific props
  items: CartItem[];
  total: number;
  onPayPalSuccess: (details: any) => void;
  onPayPalError: (error: Error) => void;
  
  // Credit card specific props
  onSubmit?: (data: PaymentFormData) => void;
  savedCards?: any[];
  shippingAddress?: ShippingFormData;
  showSaveCard?: boolean;
  onSaveCard?: (data: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  items,
  total,
  onPayPalSuccess,
  onPayPalError,
  onSubmit,
  savedCards = [],
  shippingAddress,
  showSaveCard = false,
  onSaveCard
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Payment Method
      </h2>

      <div className="mt-4">
        <PayPalButton
          items={items}
          total={total}
          onSuccess={onPayPalSuccess}
          onError={onPayPalError}
        />
      </div>
    </div>
  );
};

export default PaymentForm;