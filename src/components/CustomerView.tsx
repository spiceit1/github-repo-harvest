import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import FishList from './FishList';

const CustomerView: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Saltwater Fish Store</h1>
          <button
            onClick={signOut}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <FishList isAdmin={false} />
      </main>

      <footer className="bg-blue-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center text-sm">
          <p>© 2025 Saltwater Fish Store | Created with React</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerView;