import axios from 'axios';
import { supabase } from '../lib/supabase';
import { FishData } from '../types';

interface EbayConfig {
  clientId: string;
  clientSecret: string;
  ruName: string;
  environment: 'sandbox' | 'production';
}

class EbayService {
  private static instance: EbayService;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private config: EbayConfig;
  private initialized: boolean = false;

  private readonly API_URLS = {
    sandbox: {
      auth: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      api: 'https://api.sandbox.ebay.com/sell/inventory/v1'
    },
    production: {
      auth: 'https://api.ebay.com/identity/v1/oauth2/token',
      api: 'https://api.ebay.com/sell/inventory/v1'
    }
  };

  private constructor() {
    // Initialize with empty config - will be populated in loadCredentials()
    this.config = {
      clientId: '',
      clientSecret: '',
      ruName: '',
      environment: 'sandbox'
    };
  }

  static getInstance(): EbayService {
    if (!EbayService.instance) {
      EbayService.instance = new EbayService();
    }
    return EbayService.instance;
  }

  private async loadCredentials(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data, error } = await supabase
        .from('ebay_credentials')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        this.config = {
          clientId: data.client_id,
          clientSecret: data.client_secret,
          ruName: data.ru_name,
          environment: data.environment
        };
        this.initialized = true;
      } else {
        throw new Error('No active eBay credentials found');
      }
    } catch (error) {
      console.error('Error loading eBay credentials:', error);
      throw new Error('Failed to load eBay credentials');
    }
  }

  async verifyCredentials(): Promise<boolean> {
    await this.loadCredentials();

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Invalid credentials: Missing client ID or secret');
    }

    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Verification failed:', error);
      throw new Error('Invalid credentials');
    }
  }

  private async getAccessToken(): Promise<string> {
    await this.loadCredentials();

    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Missing eBay credentials');
    }

    try {
      const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory');

      const response = await axios.post(
        this.API_URLS[this.config.environment].auth,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid token response from eBay');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + ((response.data.expires_in || 7200) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw new Error('Failed to get eBay access token');
    }
  }

  async createListing(fish: FishData): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      const sku = `FISH-${fish.id}`;
      const inventoryItem = {
        availability: {
          shipToLocationAvailability: {
            quantity: fish.qtyoh || 1
          }
        },
        condition: "NEW",
        product: {
          title: fish.name,
          description: fish.description || `Beautiful ${fish.name} for sale`,
          aspects: {
            "Type": ["Live Fish"],
            "Size": [fish.size || "Medium"]
          },
          imageUrls: fish.imageUrl ? [fish.imageUrl] : []
        }
      };

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Create inventory item
      await axios.put(
        `${this.API_URLS[this.config.environment].api}/inventory_item/${sku}`,
        inventoryItem,
        { headers }
      );

      // Create offer
      const offer = {
        sku,
        marketplaceId: "EBAY_US",
        format: "FIXED_PRICE",
        availableQuantity: fish.qtyoh || 1,
        categoryId: "20754", // Live Fish category
        listingDescription: fish.description || `Beautiful ${fish.name} for sale`,
        listingPolicies: {
          fulfillmentPolicyId: "78842544000", // Sandbox fulfillment policy
          paymentPolicyId: "78842543000",     // Sandbox payment policy
          returnPolicyId: "78842542000"       // Sandbox return policy
        },
        pricingSummary: {
          price: {
            value: fish.saleCost?.toString() || "0.00",
            currency: "USD"
          }
        },
        quantityLimitPerBuyer: 1
      };

      const offerResponse = await axios.post(
        `${this.API_URLS[this.config.environment].api}/offer`,
        offer,
        { headers }
      );

      const offerId = offerResponse.data.offerId;

      // Publish the offer
      await axios.post(
        `${this.API_URLS[this.config.environment].api}/offer/${offerId}/publish`,
        {},
        { headers }
      );

      // Update database with listing ID
      await supabase
        .from('fish_data')
        .update({ 
          ebay_listing_id: offerId,
          ebay_listing_status: this.config.environment
        })
        .eq('id', fish.id);

      return offerId;
    } catch (error) {
      console.error('Error creating eBay listing:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw new Error('Failed to create eBay listing');
    }
  }

  async updateListing(fish: FishData, listingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const updates = {
        availability: {
          shipToLocationAvailability: {
            quantity: fish.qtyoh || 0
          }
        },
        product: {
          title: fish.name,
          description: fish.description || `Beautiful ${fish.name} for sale`,
          aspects: {
            "Type": ["Live Fish"],
            "Size": [fish.size || "Medium"]
          },
          imageUrls: fish.imageUrl ? [fish.imageUrl] : []
        }
      };

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      await axios.put(
        `${this.API_URLS[this.config.environment].api}/inventory_item/${listingId}`,
        updates,
        { headers }
      );

    } catch (error) {
      console.error('Error updating eBay listing:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw new Error('Failed to update eBay listing');
    }
  }

  async endListing(listingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      await axios.post(
        `${this.API_URLS[this.config.environment].api}/offer/${listingId}/withdraw`,
        {},
        { headers }
      );
    } catch (error) {
      console.error('Error ending eBay listing:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
      }
      throw new Error('Failed to end eBay listing');
    }
  }

  async syncInventory(): Promise<void> {
    try {
      const { data: fishData, error } = await supabase
        .from('fish_data')
        .select('*')
        .eq('disabled', false)
        .eq('archived', false);

      if (error) throw error;

      for (const fish of fishData) {
        if (fish.ebay_listing_id) {
          await this.updateListing(fish, fish.ebay_listing_id);
        } else {
          await this.createListing(fish);
        }
      }
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw new Error('Failed to sync inventory with eBay');
    }
  }
}

export default EbayService;