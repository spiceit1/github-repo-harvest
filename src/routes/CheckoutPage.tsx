import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutController from '../components/checkout/CheckoutController';
import { useCart } from '../contexts/CartContext';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CheckoutController
            items={items}
            onComplete={() => {
              clearCart();
              navigate('/');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;