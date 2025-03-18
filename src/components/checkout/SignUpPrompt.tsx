import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';

interface SignUpPromptProps {
  shippingData: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  onContinue: (createAccount: boolean, email?: string, password?: string) => void;
  email?: string;
}

const SignUpPrompt: React.FC<SignUpPromptProps> = ({ shippingData, onContinue, email = '' }) => {
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createAccount) {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    onContinue(createAccount, email, password);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
        <User className="h-5 w-5" />
        Create an Account?
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Hi {shippingData.firstName}, would you like to create an account? This will make it easier to:
        </p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-gray-700">
            <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
            Track your orders
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
            Save your shipping addresses
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
            Get order updates and shipping notifications
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
            Save payment methods for faster checkout
          </li>
        </ul>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreateAccount(true)}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              createAccount
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setCreateAccount(false);
              onContinue(false);
            }}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              !createAccount
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Continue as Guest
          </button>
        </div>

        {createAccount && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUpPrompt;