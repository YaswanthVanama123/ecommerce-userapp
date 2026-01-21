import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    products: [],
    orders: [],
    categories: []
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search from parent
        }
      }

      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle search with debounce
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ products: [], orders: [], categories: [] });
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const [searchResults, searchSuggestions] = await Promise.all([
        searchApi.globalSearch(searchQuery),
        searchApi.getSearchSuggestions(searchQuery)
      ]);

      if (searchResults.success) {
        console.log('[GlobalSearch] Search results:', searchResults.data);
        setResults({
          products: searchResults.data.products || [],
          orders: searchResults.data.orders || [],
          categories: searchResults.data.categories || []
        });
      }

      if (searchSuggestions.success) {
        setSuggestions(searchSuggestions.data.suggestions || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ products: [], orders: [], categories: [] });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults({ products: [], orders: [], categories: [] });
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Save to recent searches
  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    const updated = [
      searchTerm,
      ...recentSearches.filter(s => s !== searchTerm)
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Helper function to get product ID safely
  const getProductId = (product) => {
    // Handle different possible structures
    if (!product) return null;

    // Direct _id field
    if (product._id) return String(product._id);

    // Direct id field
    if (product.id) return String(product.id);

    // Nested product object
    if (product.product?._id) return String(product.product._id);
    if (product.product?.id) return String(product.product.id);

    console.error('[GlobalSearch] Product missing ID:', product);
    return null;
  };

  // Handle navigation
  const handleNavigate = (path, searchTerm) => {
    if (searchTerm) {
      saveRecentSearch(searchTerm);
    }
    navigate(path);
    onClose();
    setQuery('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const allResults = [
      ...suggestions.map(s => ({ type: 'suggestion', value: s })),
      ...results.products.map(p => ({ type: 'product', value: p })),
      ...results.orders.map(o => ({ type: 'order', value: o })),
      ...results.categories.map(c => ({ type: 'category', value: c }))
    ];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const selected = allResults[activeIndex];

      if (selected.type === 'suggestion') {
        setQuery(selected.value);
      } else if (selected.type === 'product') {
        const productId = getProductId(selected.value);
        if (productId) {
          handleNavigate(`/product/${productId}`, query);
        }
      } else if (selected.type === 'order') {
        handleNavigate(`/orders/${selected.value._id}`, query);
      } else if (selected.type === 'category') {
        handleNavigate(`/products?category=${selected.value.slug}`, query);
      }
    }
  };

  // Clear recent search
  const clearRecentSearch = (searchTerm) => {
    const updated = recentSearches.filter(s => s !== searchTerm);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.categories.length > 0;
  const showRecentSearches = !query && recentSearches.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Search Modal - Mobile: Full screen, Desktop: Centered modal */}
      <div className="fixed inset-x-0 top-0 lg:top-20 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-2xl z-50 lg:px-4 h-full lg:h-auto">
        <div className="bg-white lg:rounded-lg shadow-2xl overflow-hidden h-full lg:h-auto flex flex-col">
          {/* Header with Close Button - Mobile optimized */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 lg:px-4 lg:py-3 flex-shrink-0">
            <div className="flex items-center flex-1 mr-3">
              <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, orders..."
                className="flex-1 outline-none text-base lg:text-lg"
              />
              {loading && (
                <div className="ml-3 flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Close Button - Always visible on mobile, optional on desktop */}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
              aria-label="Close search"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ESC key hint - Desktop only */}
            <kbd className="hidden lg:block ml-3 px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300 flex-shrink-0">
              ESC
            </kbd>
          </div>

          {/* Search Results - Scrollable */}
          <div className="overflow-y-auto flex-1 lg:max-h-[60vh]">
            {/* Recent Searches */}
            {showRecentSearches && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Searches</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 lg:p-2 hover:bg-gray-50 active:bg-gray-100 rounded cursor-pointer group transition-colors"
                      onClick={() => setQuery(search)}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <svg className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{search}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecentSearch(search);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-2 -mr-2 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Suggestions</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(suggestion)}
                      className="px-4 py-2 lg:px-3 lg:py-1 text-sm bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 active:bg-pink-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Products</h3>
                <div className="space-y-2">
                  {results.products.slice(0, 5).map((product) => {
                    const productId = getProductId(product);
                    console.log('[GlobalSearch] Product item:', { product, productId });
                    return (
                      <div
                        key={productId || `product-${Math.random()}`}
                        onClick={() => {
                          if (productId) {
                            handleNavigate(`/product/${productId}`, query);
                          } else {
                            console.error('[GlobalSearch] Cannot navigate - missing product ID');
                          }
                        }}
                        className="flex items-center p-3 lg:p-2 hover:bg-gray-50 active:bg-gray-100 rounded cursor-pointer transition-colors"
                      >
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        className="w-14 h-14 lg:w-12 lg:h-12 object-cover rounded mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-pink-600 font-semibold">₹{product.price}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders */}
            {results.orders.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Orders</h3>
                <div className="space-y-2">
                  {results.orders.slice(0, 3).map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleNavigate(`/orders/${order._id}`, query)}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.status}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">₹{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {results.categories.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {results.categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleNavigate(`/products?category=${category.slug}`, query)}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-sm"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && !loading && !hasResults && (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-sm text-gray-500">Try searching with different keywords</p>
              </div>
            )}

            {/* Empty State */}
            {!query && !showRecentSearches && (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search StyleHub</h3>
                <p className="text-sm text-gray-500">Find products, orders, and more</p>
                {/* Desktop only keyboard shortcut hint */}
                <div className="mt-4 hidden lg:flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 mr-1">Ctrl</kbd> +
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 ml-1">K</kbd>
                  </span>
                  <span>to open/close</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
