
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import RepositoryDetail from './pages/RepositoryDetail';
import NotFound from './pages/NotFound';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/repository/:owner/:name" element={<RepositoryDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
