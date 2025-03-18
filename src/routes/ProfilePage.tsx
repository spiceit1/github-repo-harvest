import React, { useState, useEffect } from 'react';
import { User, CreditCard, MapPin, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ShippingFormData } from '../components/checkout/ShippingForm';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<ShippingFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabase.auth.getUser()?.id)
        .single();

      if (profileError) throw profileError;

      const { data: addressData, error: addressError } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', supabase.auth.getUser()?.id)
        .order('created_at', { ascending: false });

      if (addressError) throw addressError;

      setProfile(profileData);
      setAddresses(addressData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', supabase.auth.getUser()?.id);

      if (error) throw error;
      setProfile({ ...profile, ...data });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">My Account</h1>

      <div className="grid gap-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={profile.first_name || ''}
                onChange={(e) => updateProfile({ first_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={profile.last_name || ''}
                onChange={(e) => updateProfile({ last_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Email Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="order-confirmation"
                checked={profile.email_preferences?.order_confirmation ?? true}
                onChange={(e) => updateProfile({
                  email_preferences: {
                    ...profile.email_preferences,
                    order_confirmation: e.target.checked
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="order-confirmation" className="ml-2 block text-sm text-gray-900">
                Order confirmations
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="shipping-updates"
                checked={profile.email_preferences?.shipping_updates ?? true}
                onChange={(e) => updateProfile({
                  email_preferences: {
                    ...profile.email_preferences,
                    shipping_updates: e.target.checked
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="shipping-updates" className="ml-2 block text-sm text-gray-900">
                Shipping updates
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="marketing"
                checked={profile.email_preferences?.marketing ?? false}
                onChange={(e) => updateProfile({
                  email_preferences: {
                    ...profile.email_preferences,
                    marketing: e.target.checked
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="marketing" className="ml-2 block text-sm text-gray-900">
                Marketing emails
              </label>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
            </div>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              Add New Address
            </button>
          </div>

          <div className="grid gap-4">
            {addresses.map((address) => (
              <div key={address.addressLine1} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {address.firstName} {address.lastName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>{address.addressLine1}</div>
                      {address.addressLine2 && <div>{address.addressLine2}</div>}
                      <div>
                        {address.city}, {address.state} {address.postalCode}
                      </div>
                      {address.phone && <div>{address.phone}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-orange-600 hover:text-orange-700">
                      Edit
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;