import React from 'react';
import { ShippingFormData } from './ShippingForm';

export interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  saveCard?: boolean;
}

interface PaymentFormProps {
  // Credit card specific props
  onSubmit?: (data: PaymentFormData) => void;
  savedCards?: any[];
  shippingAddress?: ShippingFormData;
  showSaveCard?: boolean;
  onSaveCard?: (data: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Payment Method
      </h2>
      <div className="mt-4">
        {/* TODO: Implement credit card form */}
        <p className="text-gray-600">Credit card payment form coming soon...</p>
      </div>
    </div>
  );
};

export default PaymentForm;