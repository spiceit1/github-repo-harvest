
import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OrderHistory from '../components/orders/OrderHistory';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email_preferences?: {
    marketing: boolean;
    order_confirmation: boolean;
    shipping_updates: boolean;
  };
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
          }

          if (data) {
            setProfile(data);
          } else {
            // Create a new profile if none exists
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              const newProfile = {
                id: currentUser.id,
                email_preferences: {
                  marketing: false,
                  order_confirmation: true,
                  shipping_updates: true
                }
              };
              
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert([newProfile]);
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
              } else {
                setProfile(newProfile);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-2 mb-6">
        <User className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Account</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        {profile ? (
          <div className="space-y-4">
            <div>
              <p className="text-gray-500">Name</p>
              <p>{profile.first_name || ''} {profile.last_name || ''}</p>
              {!profile.first_name && !profile.last_name && (
                <p className="text-gray-400 italic">Not provided</p>
              )}
            </div>
            
            <div>
              <p className="text-gray-500">Email Preferences</p>
              <div className="space-y-2 mt-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="marketing"
                    className="mr-2" 
                    checked={profile.email_preferences?.marketing || false}
                    readOnly
                  />
                  <label htmlFor="marketing">Marketing emails</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="order_confirmation" 
                    className="mr-2"
                    checked={profile.email_preferences?.order_confirmation || false}
                    readOnly
                  />
                  <label htmlFor="order_confirmation">Order confirmations</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="shipping_updates" 
                    className="mr-2"
                    checked={profile.email_preferences?.shipping_updates || false}
                    readOnly
                  />
                  <label htmlFor="shipping_updates">Shipping updates</label>
                </div>
              </div>
            </div>
            
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Edit Profile
            </button>
          </div>
        ) : (
          <p>Please log in to view your profile</p>
        )}
      </div>

      <OrderHistory />
    </div>
  );
};

export default ProfilePage;
