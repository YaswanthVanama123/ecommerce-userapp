import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';

// Memoized filter sidebar component
const FilterSidebar = memo(({ filters, onFilterChange, onApplyFilters, onClearFilters }) => {
  return (
    <aside className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search products..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home & Living</option>
            <option value="sports">Sports</option>
            <option value="books">Books</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              placeholder="Min"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              placeholder="Max"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Newest</option>
            <option value="-createdAt">Oldest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="-name">Name: Z to A</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={onApplyFilters}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={onClearFilters}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </aside>
  );
});

FilterSidebar.displayName = 'FilterSidebar';

// Memoized pagination component
const Pagination = memo(({ pagination, onPageChange }) => {
  const pageNumbers = useMemo(() => {
    return [...Array(pagination.totalPages)].map((_, index) => index + 1);
  }, [pagination.totalPages]);

  const visiblePages = useMemo(() => {
    return pageNumbers.filter((pageNum) => {
      return (
        pageNum === 1 ||
        pageNum === pagination.totalPages ||
        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
      );
    });
  }, [pageNumbers, pagination.page, pagination.totalPages]);

  const showEllipsisBefore = useMemo(
    () => pagination.page > 3,
    [pagination.page]
  );

  const showEllipsisAfter = useMemo(
    () => pagination.page < pagination.totalPages - 2,
    [pagination.page, pagination.totalPages]
  );

  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {visiblePages.map((pageNum, index) => {
        const showEllipsis =
          (index > 0 && pageNum - visiblePages[index - 1] > 1);

        return (
          <div key={pageNum} className="flex items-center space-x-2">
            {showEllipsis && <span>...</span>}
            <button
              onClick={() => onPageChange(pageNum)}
              className={`px-4 py-2 border rounded-md ${
                pagination.page === pageNum
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          </div>
        );
      })}

      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
});

Pagination.displayName = 'Pagination';

// Memoized loading component
const LoadingSpinner = memo(() => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized empty state component
const EmptyState = memo(({ onClearFilters }) => (
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
      Try adjusting your filters or search terms
    </p>
    <button
      onClick={onClearFilters}
      className="text-blue-600 hover:text-blue-800 font-semibold"
    >
      Clear all filters
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized error component
const ErrorState = memo(({ error, onRetry }) => (
  <div className="text-center py-12">
    <p className="text-red-600 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="text-blue-600 hover:text-blue-800 font-semibold"
    >
      Try Again
    </button>
  </div>
));

ErrorState.displayName = 'ErrorState';

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalProducts: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'createdAt'
  });

  // Memoize API parameters to prevent unnecessary fetches
  const apiParams = useMemo(() => ({
    page: parseInt(searchParams.get('page')) || 1,
    limit: pagination.limit,
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    sort: searchParams.get('sort') || 'createdAt'
  }), [searchParams, pagination.limit]);

  // Memoize fetch function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts(apiParams);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Memoize filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('page', '1');
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'createdAt'
    });
    setSearchParams({});
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (newPage) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, setSearchParams]
  );

  // Memoize header title
  const pageTitle = useMemo(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    if (search) {
      return `Search results for "${search}"`;
    } else if (category) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
    return 'All Products';
  }, [searchParams]);

  // Memoize product count text
  const productCountText = useMemo(() => {
    const count = pagination.totalProducts;
    return `${count} ${count === 1 ? 'product' : 'products'}`;
  }, [pagination.totalProducts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />

        {/* Products Grid */}
        <main className="flex-grow">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <p className="text-gray-600">
              {productCountText}
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchProducts} />
          ) : products.length > 0 ? (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </>
          ) : (
            <EmptyState onClearFilters={clearFilters} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
