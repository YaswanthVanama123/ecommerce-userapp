import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthWithActions } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCenter from '../notifications/NotificationCenter';
import GlobalSearch from './GlobalSearch';

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuthWithActions();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Keyboard shortcut for global search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle notification close
  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

  return (
    <>
      {/* Top Header - Desktop/Tablet */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm w-full">
        <div className="w-full px-4 max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden py-4 flex items-center justify-between w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-pink-600">
                StyleHub
              </span>
            </Link>

            {/* Mobile Icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setGlobalSearchOpen(true)}
                className="text-gray-700 hover:text-pink-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => setNotificationOpen(true)}
                  className="relative text-gray-700 hover:text-pink-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              <Link to="/wishlist" className="relative">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop/Tablet Header */}
          <div className="hidden lg:flex items-center justify-between py-9">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-3xl font-bold text-pink-600">
                StyleHub
              </span>
            </Link>

            {/* Search Bar with Global Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div
                onClick={() => setGlobalSearchOpen(true)}
                className="relative cursor-pointer"
              >
                <div className="w-full px-4 py-2.5 pl-10 pr-20 border border-gray-300 rounded-lg bg-white hover:border-pink-400 transition-colors">
                  <span className="text-gray-500">Search for clothing, shoes, accessories...</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <kbd className="absolute right-3 top-2.5 px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
                  Ctrl+K
                </kbd>
              </div>
            </div>

            {/* Right Menu */}
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="text-gray-700 hover:text-pink-600 font-medium">
                    Profile
                  </Link>
                  <Link to="/orders" className="text-gray-700 hover:text-pink-600 font-medium">
                    Orders
                  </Link>
                  <Link to="/shipments" className="text-gray-700 hover:text-pink-600 font-medium">
                    Track
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-700 hover:text-pink-600 font-medium"
                  >
                    Logout
                  </button>

                  {/* Notification Bell */}
                  <button
                    onClick={() => setNotificationOpen(true)}
                    className="relative text-gray-700 hover:text-pink-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/track" className="text-gray-700 hover:text-pink-600 font-medium">
                    Track Order
                  </Link>
                  <Link to="/login" className="text-gray-700 hover:text-pink-600 font-medium">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              <Link to="/wishlist" className="relative">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Search Dropdown */}
          {searchOpen && (
            <div className="lg:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for clothing..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
            </div>
          )}
        </div>

        {/* Category Navigation - Desktop/Tablet */}
        <div className="hidden lg:block border-t border-gray-200 w-full">
          <div className="w-full px-4 max-w-7xl mx-auto">
            <nav className="flex items-center space-x-8 py-4">
              <Link to="/products?category=women" className="text-gray-700 hover:text-pink-600 font-medium">
                Women
              </Link>
              <Link to="/products?category=men" className="text-gray-700 hover:text-pink-600 font-medium">
                Men
              </Link>
              <Link to="/products?category=kids" className="text-gray-700 hover:text-pink-600 font-medium">
                Kids
              </Link>
              <Link to="/products?category=accessories" className="text-gray-700 hover:text-pink-600 font-medium">
                Accessories
              </Link>
              <Link to="/products?category=footwear" className="text-gray-700 hover:text-pink-600 font-medium">
                Footwear
              </Link>
              <Link to="/products?tag=sale" className="text-pink-600 hover:text-pink-700 font-bold">
                Sale 🔥
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Link to="/" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link to="/products" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Explore</span>
          </Link>

          {isAuthenticated ? (
            <Link to="/shipments" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Track</span>
            </Link>
          ) : (
            <Link to="/track" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Track</span>
            </Link>
          )}

          <Link to="/wishlist" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600 relative">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-pink-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
            <span className="text-xs font-medium">Wishlist</span>
          </Link>

          {isAuthenticated ? (
            <Link to="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-pink-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          ) : (
            <Link to="/login" className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-pink-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-xs font-medium">Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={handleNotificationClose}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
    </>
  );
};

export default Header;
