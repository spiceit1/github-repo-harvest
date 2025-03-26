import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Fish, Users, AlertCircle, Search, Crown, LogOut, X, Database, ChevronDown, Menu } from 'lucide-react';
import FishList from './components/FishList';
import CartButton from './components/CartButton';
import CSVView from './components/CSVView';
import { initializeSupabase } from './lib/supabase';
import { CartProvider } from './contexts/CartContext';
import { FishDataContext, FishDataProvider } from './contexts/FishDataContext';
import CheckoutPage from './routes/CheckoutPage';
import CartPage from './routes/CartPage';
import OrderHistory from './components/orders/OrderHistory';
import OrderTracking from './components/orders/OrderTracking';
import AdminDashboard from './components/admin/AdminDashboard';
import EbayManagement from './components/admin/EbayManagement';
import { useCart } from './contexts/CartContext';

const AppContent = () => {
  const navigate = useNavigate();
  const { items: cartItems } = useCart();
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [hasAdminAccess, setHasAdminAccess] = useState(() => {
    return localStorage.getItem('hasAdminAccess') === 'true';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCSVView, setShowCSVView] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showEbayManagement, setShowEbayManagement] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Starting database initialization...');
        const success = await initializeSupabase();
        console.log('Database initialization result:', success);
        
        if (success) {
          console.log('Database initialized successfully');
          setDbInitialized(true);
          setDbError(null);
        } else {
          throw new Error('Database initialization failed');
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbError('Unable to connect to the database. Please try again.');
        
        if (initAttempts < 3) {
          const delay = 2000 * (initAttempts + 1);
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => {
            setInitAttempts(prev => prev + 1);
          }, delay);
        }
      }
    };

    if (!dbInitialized && !dbError) {
      console.log('Initializing database...');
      initDb();
    }
  }, [initAttempts, dbInitialized]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term === 'Rangers99') {
      setIsAdmin(true);
      setHasAdminAccess(true);
      setSearchTerm('');
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('hasAdminAccess', 'true');
    }
  };

  const toggleView = () => {
    setIsAdmin(!isAdmin);
    localStorage.setItem('isAdmin', (!isAdmin).toString());
  };

  const exitAdminSession = () => {
    setIsAdmin(false);
    setHasAdminAccess(false);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('hasAdminAccess');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setMobileMenuOpen(false);
    
    if (!category) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(`category-${category}`);
      if (element) {
        const mainHeader = document.querySelector('header');
        const navBar = document.querySelector('nav');
        
        const headerHeight = mainHeader?.offsetHeight || 0;
        const navHeight = navBar?.offsetHeight || 0;
        const totalOffset = headerHeight + navHeight;
        const padding = 16;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const scrollTarget = elementPosition - totalOffset - padding;

        window.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  if (dbError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Connection Error</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{dbError}</p>
          <button
            onClick={() => {
              setDbError(null);
              setInitAttempts(0);
            }}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-20">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                  <Crown className="h-8 w-8 text-yellow-300" />
                  <div className="flex flex-col">
                    <span className="text-xl md:text-2xl font-bold tracking-tight">Anemone King</span>
                    <span className="text-xs text-orange-200 hidden md:block">Premium Saltwater Fish</span>
                  </div>
                </div>

                <div className="flex-1 max-w-3xl ml-4 md:ml-8 hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search for fish, coral, and more..."
                      className="w-full pl-4 pr-10 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-6 ml-4 md:ml-8">
                {hasAdminAccess && (
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={toggleView}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
                    >
                      <Users className="h-5 w-5" />
                      <span className="hidden lg:inline">{isAdmin ? 'Customer View' : 'Admin View'}</span>
                    </button>
                    <button
                      onClick={exitAdminSession}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                      title="Exit Admin Session"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="hidden lg:inline">Exit Admin</span>
                    </button>
                  </div>
                )}
                <CartButton 
                  items={cartItems}
                  isAdmin={isAdmin}
                />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-orange-600 rounded-lg"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden pb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-4 pr-10 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <nav className="bg-gray-800 text-white py-3 shadow-md">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div className="hidden md:flex items-center gap-8">
                  <a href="#featured" className="text-sm hover:text-orange-300 transition-colors font-medium">Featured Fish</a>
                  <a href="#new" className="text-sm hover:text-orange-300 transition-colors font-medium">New Arrivals</a>
                  <a href="#coral" className="text-sm hover:text-orange-300 transition-colors font-medium">Coral</a>
                  <a href="#inverts" className="text-sm hover:text-orange-300 transition-colors font-medium">Invertebrates</a>
                  <a href="#supplies" className="text-sm hover:text-orange-300 transition-colors font-medium">Supplies</a>
                  <a href="#guides" className="text-sm hover:text-orange-300 transition-colors font-medium">Care Guides</a>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => {
                          setShowCSVView(!showCSVView);
                          setShowAdminDashboard(false);
                          setShowEbayManagement(false);
                        }}
                        className="flex items-center gap-2 text-sm hover:text-orange-300 transition-colors font-medium"
                      >
                        <Database className="h-4 w-4" />
                        CSV View
                      </button>
                      <button 
                        onClick={() => {
                          setShowAdminDashboard(!showAdminDashboard);
                          setShowCSVView(false);
                          setShowEbayManagement(false);
                        }}
                        className="flex items-center gap-2 text-sm hover:text-orange-300 transition-colors font-medium"
                      >
                        <Crown className="h-4 w-4" />
                        Dashboard
                      </button>
                      <button 
                        onClick={() => {
                          setShowEbayManagement(!showEbayManagement);
                          setShowCSVView(false);
                          setShowAdminDashboard(false);
                        }}
                        className="flex items-center gap-2 text-sm hover:text-orange-300 transition-colors font-medium"
                      >
                        <Fish className="h-4 w-4" />
                        eBay
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedCategory && (
                    <button
                      onClick={() => handleCategorySelect('')}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 rounded text-sm transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Show All
                    </button>
                  )}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategorySelect(e.target.value)}
                      className="appearance-none bg-transparent text-white border border-gray-600 rounded px-4 py-1 pr-8 focus:outline-none focus:border-orange-300 cursor-pointer"
                    >
                      <option value="" className="text-gray-900">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category} className="text-gray-900">
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gray-800 text-white">
              <div className="container mx-auto px-4 py-4 space-y-4">
                <a href="#featured" className="block hover:text-orange-300 transition-colors">Featured Fish</a>
                <a href="#new" className="block hover:text-orange-300 transition-colors">New Arrivals</a>
                <a href="#coral" className="block hover:text-orange-300 transition-colors">Coral</a>
                <a href="#inverts" className="block hover:text-orange-300 transition-colors">Invertebrates</a>
                <a href="#supplies" className="block hover:text-orange-300 transition-colors">Supplies</a>
                <a href="#guides" className="block hover:text-orange-300 transition-colors">Care Guides</a>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => {
                        setShowCSVView(!showCSVView);
                        setShowAdminDashboard(false);
                        setShowEbayManagement(false);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left hover:text-orange-300 transition-colors"
                    >
                      CSV View
                    </button>
                    <button 
                      onClick={() => {
                        setShowAdminDashboard(!showAdminDashboard);
                        setShowCSVView(false);
                        setShowEbayManagement(false);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left hover:text-orange-300 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => {
                        setShowEbayManagement(!showEbayManagement);
                        setShowCSVView(false);
                        setShowAdminDashboard(false);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left hover:text-orange-300 transition-colors"
                    >
                      eBay
                    </button>
                  </>
                )}
                {hasAdminAccess && (
                  <div className="pt-4 border-t border-gray-700 space-y-4">
                    <button
                      onClick={() => {
                        toggleView();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left hover:text-orange-300 transition-colors"
                    >
                      {isAdmin ? 'Switch to Customer View' : 'Switch to Admin View'}
                    </button>
                    <button
                      onClick={() => {
                        exitAdminSession();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-red-400 hover:text-red-300 transition-colors"
                    >
                      Exit Admin Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>
      </div>

      <main className="container mx-auto p-4">
        <Routes>
          <Route 
            path="/" 
            element={
              !dbInitialized ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                  <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-6"></div>
                  <p className="text-lg text-gray-600 mb-2">Connecting to database...</p>
                  {initAttempts > 0 && (
                    <p className="text-sm text-gray-500">
                      Attempt {initAttempts + 1} of 4...
                    </p>
                  )}
                </div>
              ) : showEbayManagement && isAdmin ? (
                <EbayManagement />
              ) : showAdminDashboard && isAdmin ? (
                <AdminDashboard />
              ) : showCSVView && isAdmin ? (
                <FishList 
                  isAdmin={isAdmin} 
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategorySelect}
                  onCategoriesUpdate={setCategories}
                  renderCustomView={(fishData) => (
                    <CSVView fishData={fishData} />
                  )}
                />
              ) : (
                <FishList 
                  isAdmin={isAdmin} 
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategorySelect}
                  onCategoriesUpdate={setCategories}
                />
              )
            } 
          />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:orderNumber" element={<OrderTracking />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white py-12 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-6 w-6 text-yellow-300" />
                <span className="text-xl font-bold">Anemone King</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted source for premium saltwater fish and aquarium supplies since 2020.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-orange-300">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-orange-300 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-orange-300">Customer Service</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-orange-300 transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Care Guides</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Fish Compatibility</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-orange-300">Connect With Us</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-orange-300 transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>© 2025 Anemone King. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <FishDataProvider>
        <Router>
          <AppContent />
        </Router>
      </FishDataProvider>
    </CartProvider>
  );
}

export default App;