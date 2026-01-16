import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, memo, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// Memoized sub-components for better performance
const Logo = memo(() => (
  <Link to="/" className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xl">S</span>
    </div>
    <span className="text-xl font-bold text-gray-900">ShopHub</span>
  </Link>
));

Logo.displayName = 'Logo';

const SearchBar = memo(({ value, onChange, onSubmit, className = '' }) => (
  <form onSubmit={onSubmit} className={className}>
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search products..."
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Search
      </button>
    </div>
  </form>
));

SearchBar.displayName = 'SearchBar';

const CartIcon = memo(({ totalItems }) => {
  const hasItems = useMemo(() => totalItems > 0, [totalItems]);

  return (
    <Link to="/cart" className="relative">
      <svg
        className="w-6 h-6 text-gray-700 hover:text-blue-600 transition"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {hasItems && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
});

CartIcon.displayName = 'CartIcon';

const UserMenu = memo(({ user, showMenu, onToggleMenu, onLogout, onCloseMenu }) => {
  const userInitial = useMemo(
    () => user?.firstName?.charAt(0).toUpperCase() || 'U',
    [user?.firstName]
  );

  const fullName = useMemo(
    () => `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    [user?.firstName, user?.lastName]
  );

  return (
    <div className="relative">
      <button
        onClick={onToggleMenu}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {userInitial}
          </span>
        </div>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">
              {fullName}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Link
            to="/profile"
            onClick={onCloseMenu}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            My Profile
          </Link>
          <Link
            to="/orders"
            onClick={onCloseMenu}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Order History
          </Link>
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        setSearchQuery('');
      }
    },
    [searchQuery, navigate]
  );

  const handleToggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setShowUserMenu(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  }, [logout, navigate]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Search Bar - Desktop */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg mx-8"
          />

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/products"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Products
            </Link>

            {/* Cart Icon */}
            <CartIcon totalItems={totalItems} />

            {/* User Menu */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                showMenu={showUserMenu}
                onToggleMenu={handleToggleUserMenu}
                onLogout={handleLogout}
                onCloseMenu={handleCloseUserMenu}
              />
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Login
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleSearch}
          className="md:hidden pb-4"
        />
      </div>
    </header>
  );
};

export default Header;
