import React from 'react';
import { Package, Mail } from 'lucide-react';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  initialData?: ShippingFormData;
  savedAddresses?: ShippingFormData[];
  onSaveAddress?: (data: ShippingFormData) => void;
  requireEmail?: boolean;
}

export interface ShippingFormData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email?: string;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  onSubmit,
  initialData,
  savedAddresses = [],
  onSaveAddress,
  requireEmail = false
}) => {
  const [formData, setFormData] = React.useState<ShippingFormData>(initialData || {
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    email: ''
  });

  const [selectedAddress, setSelectedAddress] = React.useState<number>(-1);
  const [saveAddress, setSaveAddress] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveAddress && onSaveAddress) {
      onSaveAddress(formData);
    }
    onSubmit(formData);
  };

  const handleAddressSelect = (index: number) => {
    if (index === -1) {
      setFormData({
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        email: ''
      });
    } else {
      setFormData(savedAddresses[index]);
    }
    setSelectedAddress(index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
        <Package className="h-5 w-5" />
        Shipping Information
      </div>

      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Saved Addresses
          </label>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {savedAddresses.map((address, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAddressSelect(index)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedAddress === index
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">
                  {address.firstName} {address.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {address.addressLine1}
                  {address.addressLine2 && <>, {address.addressLine2}</>}
                </div>
                <div className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.postalCode}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAddressSelect(-1)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedAddress === -1
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Use a different address</div>
              <div className="text-sm text-gray-600">
                Enter a new shipping address
              </div>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {requireEmail && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-10"
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address Line 1
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              required
              pattern="[0-9]{5}"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>

        {onSaveAddress && selectedAddress === -1 && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="save-address"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="save-address" className="ml-2 block text-sm text-gray-900">
              Save this address for future orders
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingForm;