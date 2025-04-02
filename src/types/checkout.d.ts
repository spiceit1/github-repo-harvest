
interface PaymentFormData {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvc?: string;
  nameOnCard?: string;
  savedCardId?: string;
  saveCard?: boolean;
  paymentMethod: 'card' | 'paypal';
  paypalOrderId?: string;
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
  items: CartItem[];
  total: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
