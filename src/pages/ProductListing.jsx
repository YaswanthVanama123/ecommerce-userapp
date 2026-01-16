import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalProducts: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  // Filter section states
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    sort: true
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Price ranges
  const priceRanges = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 - ₹1000', min: 500, max: 1000 },
    { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
    { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
    { label: 'Above ₹5000', min: 5000, max: '' }
  ];

  const selectPriceRange = (range) => {
    setFilters(prev => ({
      ...prev,
      minPrice: range.min,
      maxPrice: range.max
    }));
  };

  const isRangeSelected = (range) => {
    return filters.minPrice == range.min && filters.maxPrice == range.max;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: parseInt(searchParams.get('page')) || 1,
          limit: pagination.limit,
          search: searchParams.get('search') || undefined,
          category: searchParams.get('category') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          sort: searchParams.get('sort') || '-createdAt'
        };

        const response = await productApi.getProducts(params);
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalProducts: 0
        });
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('page', '1');
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: '-createdAt'
    });
    setSearchParams({});
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = () => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    if (search) return `"${search}"`;
    if (tag === 'sale') return 'Sale';
    if (tag === 'new') return 'New Arrivals';
    if (category) return category.charAt(0).toUpperCase() + category.slice(1);
    return 'All Products';
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-4 max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
          {pagination.totalProducts > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {pagination.totalProducts} {pagination.totalProducts === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Category Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('category')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Category</h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${openSections.category ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.category && (
                  <div className="space-y-2">
                    {['All Categories', 'Women', 'Men', 'Kids', 'Accessories', 'Footwear'].map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === (cat === 'All Categories' ? '' : cat.toLowerCase())}
                          onChange={() => handleFilterChange('category', cat === 'All Categories' ? '' : cat.toLowerCase())}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="mb-6 pb-6 border-b">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Price Range</h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${openSections.price ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.price && (
                  <div className="space-y-2">
                    {priceRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => selectPriceRange(range)}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                          isRangeSelected(range)
                            ? 'border-pink-600 bg-pink-50 text-pink-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-sm">{range.label}</span>
                      </button>
                    ))}
                    {/* Custom Range */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Custom Range</p>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          placeholder="Min"
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          placeholder="Max"
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('sort')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Sort By</h3>
                  <svg
                    className={`w-5 h-5 transition-transform ${openSections.sort ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.sort && (
                  <div className="space-y-2">
                    {[
                      { value: '-createdAt', label: 'Newest First' },
                      { value: 'price', label: 'Price: Low to High' },
                      { value: '-price', label: 'Price: High to Low' },
                      { value: 'name', label: 'Name: A to Z' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="radio"
                          name="sort"
                          checked={filters.sort === option.value}
                          onChange={() => handleFilterChange('sort', option.value)}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-2 mt-6">
                <button
                  onClick={applyFilters}
                  className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition font-medium shadow-sm"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters + Products */}
      <div className="w-full px-4 max-w-7xl mx-auto py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {(filters.category || filters.minPrice || filters.maxPrice) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Section */}
              <div className="mb-6 pb-6 border-b">
                <button
                  onClick={() => toggleSection('category')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Category</h3>
                  <svg
                    className={`w-4 h-4 transition-transform ${openSections.category ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.category && (
                  <div className="space-y-2">
                    {['All Categories', 'Women', 'Men', 'Kids', 'Accessories', 'Footwear'].map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                      >
                        <input
                          type="radio"
                          name="category-desktop"
                          checked={filters.category === (cat === 'All Categories' ? '' : cat.toLowerCase())}
                          onChange={() => {
                            handleFilterChange('category', cat === 'All Categories' ? '' : cat.toLowerCase());
                          }}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="mb-6 pb-6 border-b">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Price Range</h3>
                  <svg
                    className={`w-4 h-4 transition-transform ${openSections.price ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.price && (
                  <div className="space-y-2">
                    {priceRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => selectPriceRange(range)}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                          isRangeSelected(range)
                            ? 'border-pink-600 bg-pink-50 text-pink-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-sm">{range.label}</span>
                      </button>
                    ))}
                    {/* Custom Range */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Custom Range</p>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          placeholder="Min"
                          className="w-1/2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          placeholder="Max"
                          className="w-1/2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('sort')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Sort By</h3>
                  <svg
                    className={`w-4 h-4 transition-transform ${openSections.sort ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.sort && (
                  <div className="space-y-2">
                    {[
                      { value: '-createdAt', label: 'Newest First' },
                      { value: 'price', label: 'Price: Low to High' },
                      { value: '-price', label: 'Price: High to Low' },
                      { value: 'name', label: 'Name: A to Z' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                      >
                        <input
                          type="radio"
                          name="sort-desktop"
                          checked={filters.sort === option.value}
                          onChange={() => handleFilterChange('sort', option.value)}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                onClick={applyFilters}
                className="w-full bg-pink-600 text-white py-2.5 rounded-lg hover:bg-pink-700 transition font-medium shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-grow">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : products.length > 0 ? (
              <>
                {/* Products Grid - 2 cols mobile, 3 cols tablet, 4 cols desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-24 h-24 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
