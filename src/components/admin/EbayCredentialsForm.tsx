import React, { useState, useEffect } from 'react';
import { Save, Key, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EbayService from '../../utils/ebayService';

interface EbayCredentials {
  environment: 'sandbox' | 'production';
  client_id: string;
  client_secret: string;
  ru_name: string;
  is_active: boolean;
  last_verified_at: string | null;
}

const EbayCredentialsForm: React.FC = () => {
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [credentials, setCredentials] = useState<EbayCredentials>({
    environment: 'sandbox',
    client_id: '',
    client_secret: '',
    ru_name: '',
    is_active: false,
    last_verified_at: null
  });
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials(environment);
  }, [environment]);

  const loadCredentials = async (env: 'sandbox' | 'production') => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('ebay_credentials')
        .select('*')
        .eq('environment', env)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw error;
      }

      if (data) {
        setCredentials({
          environment: env,
          client_id: data.client_id,
          client_secret: data.client_secret,
          ru_name: data.ru_name,
          is_active: data.is_active,
          last_verified_at: data.last_verified_at
        });
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
      setError('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('ebay_credentials')
        .upsert({
          environment: environment,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          ru_name: credentials.ru_name,
          is_active: false,
          last_verified_at: null
        });

      if (error) throw error;

      setSuccess('Credentials saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving credentials:', err);
      setError('Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const verifyConnection = async () => {
    try {
      setVerifying(true);
      setError(null);
      setSuccess(null);

      const ebayService = EbayService.getInstance();
      await ebayService.verifyCredentials();

      // Update credentials status in database
      const { error: updateError } = await supabase
        .from('ebay_credentials')
        .update({
          is_active: true,
          last_verified_at: new Date().toISOString()
        })
        .eq('environment', environment);

      if (updateError) throw updateError;

      setCredentials(prev => ({
        ...prev,
        is_active: true,
        last_verified_at: new Date().toISOString()
      }));

      setSuccess('Connection verified successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error verifying connection:', err);
      setError('Failed to verify connection. Please check your credentials.');
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (field: keyof EbayCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Key className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">eBay API Credentials</h2>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <button
            onClick={() => setEnvironment('sandbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              environment === 'sandbox'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sandbox
          </button>
          <button
            onClick={() => setEnvironment('production')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              environment === 'production'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Production
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client ID
            </label>
            <input
              type="text"
              value={credentials.client_id}
              onChange={(e) => handleInputChange('client_id', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Enter your eBay Client ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client Secret
            </label>
            <input
              type="password"
              value={credentials.client_secret}
              onChange={(e) => handleInputChange('client_secret', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Enter your eBay Client Secret"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              RuName
            </label>
            <input
              type="text"
              value={credentials.ru_name}
              onChange={(e) => handleInputChange('ru_name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Enter your eBay RuName"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="h-5 w-5" />
            {success}
          </div>
        )}

        {credentials.last_verified_at && (
          <div className="text-sm text-gray-600">
            Last verified: {new Date(credentials.last_verified_at).toLocaleString()}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${loading
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'}
              transition-colors
            `}
          >
            <Save className="h-5 w-5" />
            Save Credentials
          </button>

          <button
            onClick={verifyConnection}
            disabled={verifying || !credentials.client_id || !credentials.client_secret || !credentials.ru_name}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${verifying || !credentials.client_id || !credentials.client_secret || !credentials.ru_name
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'}
              transition-colors
            `}
          >
            <RefreshCw className={`h-5 w-5 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Verify Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EbayCredentialsForm;