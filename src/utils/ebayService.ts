import axios from 'axios';
import { supabase } from '../lib/supabase';

interface EbayCredential {
  client_id: string;
  client_secret: string;
  ru_name: string;
  environment: string;
}

export const getEbayCredentials = async (): Promise<EbayCredential | null> => {
  try {
    const { data, error } = await supabase
      .from('ebay_credentials')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting eBay credentials:', error);
    return null;
  }
};

export const getEbayAuthUrl = async (): Promise<string> => {
  try {
    const credentials = await getEbayCredentials();
    
    if (!credentials) {
      throw new Error('No active eBay credentials found');
    }
    
    const { client_id, ru_name, environment } = credentials;
    
    // Determine the correct eBay environment URL
    const baseUrl = environment === 'production' 
      ? 'https://auth.ebay.com/oauth2/authorize'
      : 'https://auth.sandbox.ebay.com/oauth2/authorize';
    
    // Define the scopes needed for the app
    const scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.marketing',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment'
    ];
    
    // Build the authorization URL
    const params = new URLSearchParams({
      client_id,
      response_type: 'code',
      redirect_uri: ru_name,
      scope: scopes.join(' ')
    });
    
    return `${baseUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Error generating eBay auth URL:', error);
    return '';
  }
};

export const getEbayToken = async (authCode: string): Promise<any> => {
  try {
    const credentials = await getEbayCredentials();
    
    if (!credentials) {
      throw new Error('No active eBay credentials found');
    }
    
    const { client_id, client_secret, ru_name, environment } = credentials;
    
    // Determine the correct eBay environment URL
    const tokenUrl = environment === 'production' 
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
    
    // Base64 encode the client ID and secret
    const base64Auth = btoa(`${client_id}:${client_secret}`);
    
    // Request the token
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: ru_name
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw error;
  }
};

export const refreshEbayToken = async (refreshToken: string): Promise<any> => {
  try {
    const credentials = await getEbayCredentials();
    
    if (!credentials) {
      throw new Error('No active eBay credentials found');
    }
    
    const { client_id, client_secret, environment } = credentials;
    
    // Determine the correct eBay environment URL
    const tokenUrl = environment === 'production' 
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
    
    // Base64 encode the client ID and secret
    const base64Auth = btoa(`${client_id}:${client_secret}`);
    
    // Request the token
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing eBay token:', error);
    throw error;
  }
};

export const createEbayListing = async (
  accessToken: string,
  fishData: any
): Promise<string> => {
  try {
    const credentials = await getEbayCredentials();
    
    if (!credentials) {
      throw new Error('No active eBay credentials found');
    }
    
    const { environment } = credentials;
    
    // Use empty string as a fallback if null (TypeScript fix)
    const imageUrl = fishData.imageUrl || '';
    
    // Determine API endpoints based on environment
    const baseUrl = environment === 'production'
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
    
    // Create inventory item
    const inventoryResponse = await axios.post(
      `${baseUrl}/sell/inventory/v1/inventory_item`,
      {
        availability: {
          shipToLocationAvailability: {
            quantity: fishData.qtyoh || 1
          }
        },
        condition: 'NEW',
        product: {
          title: fishData.name,
          description: fishData.description || `${fishData.name} - ${fishData.size || 'Various sizes'}`,
          imageUrls: imageUrl ? [imageUrl] : [],
          aspects: {
            Category: [fishData.category || 'Fish'],
            Size: [fishData.size || 'Medium']
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // More eBay API calls would go here to complete the listing process
    
    return 'mock-listing-id'; // Replace with actual listing ID from eBay
  } catch (error) {
    console.error('Error creating eBay listing:', error);
    throw error;
  }
};
