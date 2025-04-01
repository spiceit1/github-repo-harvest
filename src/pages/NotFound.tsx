
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center max-w-3xl">
      <AlertCircle size={64} className="text-red-500 mb-6" />
      <h1 className="text-4xl font-bold text-center mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 text-center mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
