import { CartItem } from '../types';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
}

class PayPalService {
  private static instance: PayPalService;
  private config: PayPalConfig;

  private constructor() {
    this.config = {
      clientId: process.env.VITE_PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.VITE_PAYPAL_CLIENT_SECRET || ''
    };
  }

  public static getInstance(): PayPalService {
    if (!PayPalService.instance) {
      PayPalService.instance = new PayPalService();
    }
    return PayPalService.instance;
  }

  public async createOrder(items: CartItem[], total: number): Promise<string> {
    try {
      const response = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAccessToken()}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: total.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: total.toFixed(2)
                  }
                }
              },
              items: items.map(item => ({
                name: item.fish.name,
                unit_amount: {
                  currency_code: 'USD',
                  value: (item.fish.saleCost || 0).toFixed(2)
                },
                quantity: item.quantity.toString()
              }))
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  public async captureOrder(orderId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw error;
    }
  }
}

export default PayPalService; 