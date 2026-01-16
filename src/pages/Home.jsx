import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';

// Memoized Category Card Component
const CategoryCard = memo(({ to, gradient, icon, title }) => (
  <Link
    to={to}
    className="relative h-64 rounded-lg overflow-hidden shadow-lg group"
  >
    <div className={`absolute inset-0 ${gradient} group-hover:scale-105 transition-transform duration-300`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          {icon}
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
      </div>
    </div>
  </Link>
));

CategoryCard.displayName = 'CategoryCard';

// Memoized Feature Card Component
const FeatureCard = memo(({ icon, title, description }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// Memoized Loading Spinner
const LoadingSpinner = memo(() => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Error Display
const ErrorDisplay = memo(({ error, onRetry }) => (
  <div className="text-center py-12">
    <p className="text-red-600">{error}</p>
    <button
      onClick={onRetry}
      className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
    >
      Try Again
    </button>
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

// Memoized Empty State
const EmptyState = memo(() => (
  <div className="text-center py-12">
    <p className="text-gray-600">No featured products available at the moment.</p>
    <Link
      to="/products"
      className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-semibold"
    >
      Browse All Products
    </Link>
  </div>
));

EmptyState.displayName = 'EmptyState';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized fetch function
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getFeaturedProducts();
      setFeaturedProducts(response.data);
    } catch (err) {
      setError('Failed to load featured products');
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  // Memoize sliced products
  const displayedProducts = useMemo(
    () => featuredProducts.slice(0, 8),
    [featuredProducts]
  );

  // Memoize category data
  const categories = useMemo(() => [
    {
      to: '/products?category=electronics',
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
      title: 'Electronics',
      icon: (
        <svg
          className="w-16 h-16 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      )
    },
    {
      to: '/products?category=fashion',
      gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
      title: 'Fashion',
      icon: (
        <svg
          className="w-16 h-16 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      )
    },
    {
      to: '/products?category=home',
      gradient: 'bg-gradient-to-br from-green-500 to-green-700',
      title: 'Home & Living',
      icon: (
        <svg
          className="w-16 h-16 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      )
    }
  ], []);

  // Memoize features data
  const features = useMemo(() => [
    {
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      title: 'Quality Products',
      description: 'We ensure all products meet our high quality standards'
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Best Prices',
      description: 'Competitive pricing and regular discounts'
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to your doorstep'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to ShopHub
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Discover amazing products at unbeatable prices. Your satisfaction is our priority.
            </p>
            <Link
              to="/products"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.to}
                to={category.to}
                gradient={category.gradient}
                icon={category.icon}
                title={category.title}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link
              to="/products"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorDisplay error={error} onRetry={fetchFeaturedProducts} />
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Why Choose ShopHub
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
