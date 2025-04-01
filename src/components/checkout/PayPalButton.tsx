import React, { useEffect, useRef, useState } from 'react';
import { CartItem } from '../../types';

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonProps {
  items: CartItem[];
  total: number;
  onSuccess: (details: any) => void;
  onError: (error: Error) => void;
}

// Keep track of script loading state globally
let scriptLoading: Promise<void> | null = null;

const loadPayPalScript = async () => {
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve, reject) => {
    // Remove any existing PayPal scripts
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      existingScript.remove();
      delete window.paypal;
    }

    const isProduction = import.meta.env.PROD;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    
    if (!clientId) {
      reject(new Error('PayPal client ID is not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${isProduction ? 'www' : 'www.sandbox'}.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;

    script.onload = () => {
      // Wait for PayPal SDK to be fully initialized
      const checkPayPal = () => {
        if (window.paypal?.Buttons) {
          resolve();
        } else if (window.paypal?.loadScript) {
          // If loadScript is available, use it to load the buttons
          window.paypal.loadScript({ 'client-id': clientId })
            .then(() => resolve())
            .catch(reject);
        } else {
          setTimeout(checkPayPal, 100);
        }
      };
      checkPayPal();
    };
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));

    document.body.appendChild(script);
  });

  return scriptLoading;
};

const PayPalButton: React.FC<PayPalButtonProps> = ({
  items,
  total,
  onSuccess,
  onError
}) => {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const buttonInstance = useRef<any>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initializePayPal = async () => {
      try {
        if (!mounted || isInitialized.current) return;
        setIsLoading(true);

        await loadPayPalScript();

        if (!mounted || !window.paypal?.Buttons) {
          throw new Error('PayPal SDK did not load correctly');
        }

        // Clean up any existing button
        if (buttonInstance.current) {
          buttonInstance.current.close();
          buttonInstance.current = null;
        }

        if (paypalButtonRef.current) {
          paypalButtonRef.current.innerHTML = '';
        }

        const PayPalButton = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: async () => {
            try {
              const itemTotal = items.reduce((sum, item) => 
                sum + ((item.fish.saleCost || 0) * item.quantity), 0
              );
              const taxTotal = itemTotal * 0.07;
              const shippingTotal = itemTotal > 200 ? 0 : 15;
              const orderTotal = itemTotal + taxTotal + shippingTotal;

              const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  purchase_units: [{
                    amount: {
                      currency_code: 'USD',
                      value: orderTotal.toFixed(2),
                      breakdown: {
                        item_total: {
                          currency_code: 'USD',
                          value: itemTotal.toFixed(2)
                        },
                        tax_total: {
                          currency_code: 'USD',
                          value: taxTotal.toFixed(2)
                        },
                        shipping: {
                          currency_code: 'USD',
                          value: shippingTotal.toFixed(2)
                        }
                      }
                    },
                    items: items.map(item => ({
                      name: item.fish.name,
                      unit_amount: {
                        currency_code: 'USD',
                        value: (item.fish.saleCost || 0).toFixed(2)
                      },
                      quantity: item.quantity,
                      category: 'PHYSICAL_GOODS'
                    }))
                  }]
                })
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create PayPal order');
              }

              const orderData = await response.json();
              return orderData.id;
            } catch (error) {
              console.error('Error creating PayPal order:', error);
              throw error;
            }
          },
          onApprove: async (data: any, actions: any) => {
            if (!mounted) return;
            try {
              const details = await actions.order.capture();
              console.log('Payment completed successfully:', details);
              onSuccess(details);
            } catch (error) {
              console.error('Error capturing order:', error);
              onError(error instanceof Error ? error : new Error('Failed to capture order'));
            }
          },
          onError: (error: Error) => {
            if (!mounted) return;
            console.error('PayPal error:', error);
            onError(error);
          },
          onCancel: () => {
            if (!mounted) return;
            console.log('Payment cancelled by user');
          }
        });

        if (!PayPalButton.isEligible()) {
          throw new Error('PayPal button is not eligible for rendering');
        }

        if (mounted && paypalButtonRef.current) {
          await PayPalButton.render(paypalButtonRef.current);
          buttonInstance.current = PayPalButton;
          isInitialized.current = true;
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in PayPal initialization:', error);
        if (mounted) {
          setIsLoading(false);
          onError(error instanceof Error ? error : new Error('Failed to initialize PayPal'));
        }
      }
    };

    initializePayPal();

    return () => {
      mounted = false;
      if (buttonInstance.current) {
        try {
          buttonInstance.current.close();
        } catch (err) {
          console.log('Error closing PayPal button:', err);
        }
        buttonInstance.current = null;
      }
    };
  }, [items, total, onSuccess, onError]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className="w-full h-[45px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      )}
      <div 
        ref={paypalButtonRef}
        className={`w-full min-h-[45px] bg-gray-50 rounded-lg overflow-hidden ${isLoading ? 'hidden' : ''}`}
      />
    </div>
  );
};

export default PayPalButton; 