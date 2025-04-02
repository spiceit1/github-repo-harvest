
import React, { useState } from 'react';
import FishList from './FishList';

const CustomerView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Fish</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search fish..."
          className="border p-2 rounded w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <FishList 
        isAdmin={false} 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onCategoriesUpdate={() => {}} // Empty function as placeholder
      />
    </div>
  );
};

export default CustomerView;
