import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../types';
import CheckoutLayout from './CheckoutLayout';
import ShippingForm, { ShippingFormData } from './ShippingForm';
import PaymentForm, { PaymentFormData } from './PaymentForm';
import OrderConfirmation from './OrderConfirmation';
import SignUpPrompt from './SignUpPrompt';

interface CheckoutControllerProps {
  items: CartItem[];
  onComplete: () => void;
}

type CheckoutStep = 'shipping' | 'account' | 'payment' | 'confirmation';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const CheckoutController: React.FC<CheckoutControllerProps> = ({ items, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ShippingFormData[]>([]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<{ brand: string; last4: string; } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingFormData | null>(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsGuest(false);
        const { data: addresses, error: addressError } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (addressError) throw addressError;

        if (addresses) {
          setSavedAddresses(addresses.map(addr => ({
            firstName: addr.first_name,
            lastName: addr.last_name,
            addressLine1: addr.address_line1,
            addressLine2: addr.address_line2,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code,
            phone: addr.phone,
            email: addr.email
          })));
        }

        const { data: cards, error: cardsError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (cardsError) throw cardsError;

        if (cards) {
          setSavedCards(cards.map(card => ({
            id: card.id,
            brand: card.card_brand,
            last4: card.last_four,
            expiryMonth: card.expiry_month,
            expiryYear: card.expiry_year
          })));
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      setError('Failed to load saved data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSubmit = async (data: ShippingFormData) => {
    setShippingData(data);
    setGuestEmail(data.email || '');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentStep('payment');
    } else {
      setCurrentStep('account');
    }
  };

  const handleAccountDecision = async (createAccount: boolean, email?: string, password?: string) => {
    if (createAccount && email && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: shippingData?.firstName,
              last_name: shippingData?.lastName
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          await supabase
            .from('shipping_addresses')
            .insert({
              user_id: data.user.id,
              first_name: shippingData?.firstName,
              last_name: shippingData?.lastName,
              address_line1: shippingData?.addressLine1,
              address_line2: shippingData?.addressLine2,
              city: shippingData?.city,
              state: shippingData?.state,
              postal_code: shippingData?.postalCode,
              phone: shippingData?.phone,
              email: email
            });
        }

        setIsGuest(false);
      } catch (error) {
        console.error('Error creating account:', error);
        setError('Failed to create account. Please try again.');
        return;
      }
    } else {
      setIsGuest(true);
    }

    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || GUEST_USER_ID,
          status: data.paypalOrderId ? 'completed' : 'pending',
          payment_provider: data.paypalOrderId ? 'paypal' : 'credit_card',
          payment_id: data.paypalOrderId || null,
          shipping_address: {
            ...shippingData,
            email: isGuest ? guestEmail : user?.email
          },
          billing_address: useSameAddress ? {
            ...shippingData,
            email: isGuest ? guestEmail : user?.email
          } : billingAddress,
          total_amount: calculateTotal().total,
          shipping_option_id: null,
          guest_email: isGuest ? guestEmail : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        fish_id: item.fish.id,
        quantity: item.quantity,
        price_at_time: item.fish.saleCost || 0,
        name_at_time: item.fish.name
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (!data.paypalOrderId && data.saveCard && user) {
        const { error: cardError } = await supabase
          .from('payment_methods')
          .insert({
            user_id: user.id,
            card_brand: 'Visa',
            last_four: data.cardNumber.slice(-4),
            expiry_month: parseInt(data.expiryMonth),
            expiry_year: parseInt(data.expiryYear)
          });

        if (cardError) throw cardError;
      }

      setOrderNumber(order.order_number);
      
      // Clear the cart after successful order creation
      onComplete();
      
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process order. Please try again.');
    }
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.fish.saleCost || 0;
      return sum + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.07;
    const shipping = subtotal > 200 ? 0 : 15;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep(isGuest ? 'account' : 'shipping');
    } else if (currentStep === 'account') {
      setCurrentStep('shipping');
    } else {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'shipping':
        return (
          <ShippingForm
            onSubmit={handleShippingSubmit}
            savedAddresses={savedAddresses}
            requireEmail={true}
            onSaveAddress={async (data) => {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase
                  .from('shipping_addresses')
                  .insert({
                    user_id: user.id,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    address_line1: data.addressLine1,
                    address_line2: data.addressLine2,
                    city: data.city,
                    state: data.state,
                    postal_code: data.postalCode,
                    phone: data.phone,
                    email: data.email
                  });
                await loadSavedData();
              } catch (error) {
                console.error('Error saving address:', error);
              }
            }}
          />
        );

      case 'account':
        return (
          <SignUpPrompt
            shippingData={shippingData!}
            onContinue={handleAccountDecision}
            email={guestEmail}
          />
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="same-address"
                    checked={useSameAddress}
                    onChange={(e) => setUseSameAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="same-address" className="ml-2 block text-sm text-gray-900">
                    Same as shipping address
                  </label>
                </div>

                {!useSameAddress && (
                  <ShippingForm
                    onSubmit={setBillingAddress}
                    savedAddresses={savedAddresses}
                    requireEmail={false}
                  />
                )}
              </div>
            </div>

            <PaymentForm
              items={items}
              total={calculateTotal().total}
              onPayPalSuccess={async (details) => {
                try {
                  console.log('PayPal payment completed:', details);
                  
                  // Set payment method for PayPal
                  setPaymentMethod({
                    brand: 'PayPal',
                    last4: details.purchase_units?.[0]?.payee?.email_address || 'PayPal'
                  });

                  // Create order in database
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                      user_id: user?.id || GUEST_USER_ID,
                      status: 'completed',
                      payment_provider: 'paypal',
                      payment_id: details.id,
                      shipping_address: {
                        ...shippingData,
                        email: isGuest ? guestEmail : user?.email
                      },
                      billing_address: useSameAddress ? {
                        ...shippingData,
                        email: isGuest ? guestEmail : user?.email
                      } : billingAddress,
                      total_amount: calculateTotal().total,
                      shipping_option_id: null,
                      guest_email: isGuest ? guestEmail : null
                    })
                    .select()
                    .single();

                  if (orderError) throw orderError;

                  const orderItems = items.map(item => ({
                    order_id: order.id,
                    fish_id: item.fish.id,
                    quantity: item.quantity,
                    price_at_time: item.fish.saleCost || 0,
                    name_at_time: item.fish.name
                  }));

                  const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                  if (itemsError) throw itemsError;

                  // Set order details and move to confirmation
                  setOrderNumber(order.order_number);
                  onComplete();
                  setCurrentStep('confirmation');
                } catch (error) {
                  console.error('Error processing PayPal payment:', error);
                  setError('Failed to process PayPal payment. Please try again.');
                }
              }}
              onPayPalError={(error) => {
                console.error('PayPal error:', error);
                setError('Failed to process PayPal payment. Please try again.');
              }}
              onSubmit={handlePaymentSubmit}
              savedCards={!isGuest ? savedCards : []}
              shippingAddress={shippingData!}
              showSaveCard={!isGuest}
              onSaveCard={async (data) => {
                console.log('Saving card:', data);
              }}
            />
          </div>
        );

      case 'confirmation':
        return (
          <OrderConfirmation
            orderNumber={orderNumber}
            items={items}
            shippingAddress={shippingData!}
            paymentMethod={paymentMethod!}
            total={calculateTotal()}
            isGuest={isGuest}
            guestEmail={guestEmail}
          />
        );
    }
  };

  return (
    <CheckoutLayout
      step={
        currentStep === 'shipping' ? 1 :
        currentStep === 'account' ? 2 :
        currentStep === 'payment' ? 3 : 4
      }
      totalSteps={4}
      items={items}
      onBack={currentStep !== 'confirmation' ? handleBack : undefined}
    >
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      {renderStep()}
    </CheckoutLayout>
  );
};

export default CheckoutController;