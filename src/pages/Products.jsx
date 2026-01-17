import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';

// Product Card Skeleton Component
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-product animate-pulse">
    <div className="aspect-[3/4] bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-5 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

// Filter Section Skeleton
const FilterSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/2 mb-6" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  // Filter section states
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    rating: true,
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

  // Rating options
  const ratingOptions = [
    { label: '4 Stars & Up', value: 4 },
    { label: '3 Stars & Up', value: 3 },
    { label: '2 Stars & Up', value: 2 },
    { label: '1 Star & Up', value: 1 }
  ];

  // Sort options
  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-rating', label: 'Highest Rated' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' }
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await productApi.getCategories();

        // Handle different response structures
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        } else if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: parseInt(searchParams.get('page')) || 1,
          limit: pagination.limit,
          search: searchParams.get('search') || undefined,
          category: searchParams.get('category') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          minRating: searchParams.get('minRating') || undefined,
          sort: searchParams.get('sort') || '-createdAt'
        };

        // Remove undefined params
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await productApi.getProducts(params);
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalProducts: 0
        });
      } catch (err) {
        setError('Failed to load products. Please try again.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, pagination.limit]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('page', '1');
    setSearchParams(params);
    setShowFilters(false);
  }, [filters, setSearchParams]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sort: '-createdAt'
    });
    setSearchParams({});
    setShowFilters(false);
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const getPageTitle = () => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    if (search) return `Search results for "${search}"`;
    if (tag === 'sale') return 'Sale Items';
    if (tag === 'new') return 'New Arrivals';
    if (category) {
      const cat = categories.find(c => c._id === category || c.name.toLowerCase() === category.toLowerCase());
      return cat ? cat.name : category.charAt(0).toUpperCase() + category.slice(1);
    }
    return 'All Products';
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.minRating || filters.search;

  // Filter Section Component
  const FilterSection = ({ isMobile = false }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search within results */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 uppercase mb-2">
          Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search products..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Category Section */}
      <div className="pb-6 border-b">
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
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                  <input
                    type="radio"
                    name={`category-${isMobile ? 'mobile' : 'desktop'}`}
                    checked={filters.category === ''}
                    onChange={() => handleFilterChange('category', '')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">All Categories</span>
                </label>
                {Array.isArray(categories) && categories.map((cat) => (
                  <label
                    key={cat._id}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                  >
                    <input
                      type="radio"
                      name={`category-${isMobile ? 'mobile' : 'desktop'}`}
                      checked={filters.category === cat._id || filters.category === cat.name.toLowerCase()}
                      onChange={() => handleFilterChange('category', cat._id)}
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="pb-6 border-b">
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

      {/* Rating Section */}
      <div className="pb-6 border-b">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="text-sm font-semibold text-gray-900 uppercase">Rating</h3>
          <svg
            className={`w-4 h-4 transition-transform ${openSections.rating ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSections.rating && (
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
              <input
                type="radio"
                name={`rating-${isMobile ? 'mobile' : 'desktop'}`}
                checked={filters.minRating === ''}
                onChange={() => handleFilterChange('minRating', '')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">All Ratings</span>
            </label>
            {ratingOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
              >
                <input
                  type="radio"
                  name={`rating-${isMobile ? 'mobile' : 'desktop'}`}
                  checked={filters.minRating == option.value}
                  onChange={() => handleFilterChange('minRating', option.value.toString())}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-700">{option.label}</span>
                  <div className="flex ml-1">
                    {[...Array(option.value)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort Section */}
      <div>
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
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
              >
                <input
                  type="radio"
                  name={`sort-${isMobile ? 'mobile' : 'desktop'}`}
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
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-4 max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              {pagination.totalProducts > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalProducts} {pagination.totalProducts === 1 ? 'product' : 'products'} found
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>
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

              <FilterSection isMobile={true} />
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
              {categoriesLoading && !categories.length ? (
                <FilterSkeleton />
              ) : (
                <FilterSection isMobile={false} />
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {[...Array(12)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg
                  className="w-16 h-16 mx-auto text-red-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 bg-white p-4 rounded-lg shadow-sm">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex items-center space-x-2">
                      {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (pagination.page <= 3) {
                          pageNumber = index + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + index;
                        } else {
                          pageNumber = pagination.page - 2 + index;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`w-10 h-10 rounded-lg font-medium transition ${
                              pagination.page === pageNumber
                                ? 'bg-pink-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
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
                  We couldn't find any products matching your criteria
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
