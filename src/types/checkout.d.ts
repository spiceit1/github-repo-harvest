
interface PaymentFormData {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvc?: string;
  nameOnCard?: string;
  savedCardId?: string;
  saveCard?: boolean;
  paymentMethod: 'card' | 'paypal';
  paypalOrderId?: string; // Add the missing property
}

interface ShippingFormData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email: string;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onPayPalSuccess: (details: any) => Promise<void>;
  onPayPalError: (error: any) => void;
  savedCards: any[];
  shippingAddress: ShippingFormData;
  showSaveCard: boolean;
  onSaveCard: (data: any) => Promise<void>;
  items: CartItem[]; // Add this missing property
  total: number; // Add this missing property
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
