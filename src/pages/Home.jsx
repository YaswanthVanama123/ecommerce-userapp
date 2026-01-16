import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getFeaturedProducts();
        setFeaturedProducts(response.data.slice(0, 8));
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const categories = [
    {
      title: 'Women',
      subtitle: 'Latest Fashion',
      link: '/products?category=women',
      gradient: 'from-pink-500 to-rose-500',
      icon: '👗'
    },
    {
      title: 'Men',
      subtitle: 'Trendy Styles',
      link: '/products?category=men',
      gradient: 'from-blue-500 to-cyan-500',
      icon: '👔'
    },
    {
      title: 'Kids',
      subtitle: 'Fun & Comfort',
      link: '/products?category=kids',
      gradient: 'from-yellow-400 to-orange-500',
      icon: '🧸'
    },
    {
      title: 'Accessories',
      subtitle: 'Complete Look',
      link: '/products?category=accessories',
      gradient: 'from-purple-500 to-indigo-500',
      icon: '👜'
    }
  ];

  const offers = [
    {
      title: 'Flash Sale',
      description: 'Up to 70% OFF',
      bg: 'bg-gradient-to-r from-red-500 to-pink-500',
      link: '/products?tag=sale'
    },
    {
      title: 'New Arrivals',
      description: 'Fresh Collections',
      bg: 'bg-gradient-to-r from-teal-500 to-green-500',
      link: '/products?tag=new'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Hero Banner */}
      <section className="w-full bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 text-white">
        <div className="w-full px-4 max-w-7xl mx-auto py-12 md:py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Your Style,
              <br />
              Your Way
            </h1>
            <p className="text-lg md:text-xl mb-6 text-white/90">
              Discover the latest trends in fashion
            </p>
            <Link
              to="/products"
              className="inline-block bg-white text-pink-600 px-8 py-3 md:py-4 rounded-lg font-bold hover:shadow-lg transition text-sm md:text-base"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Offers Banner - Mobile Optimized */}
      <section className="w-full bg-white py-4 md:py-6">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {offers.map((offer) => (
              <Link
                key={offer.title}
                to={offer.link}
                className={`${offer.bg} rounded-lg p-4 md:p-6 text-white text-center hover:scale-105 transition`}
              >
                <p className="text-xs md:text-sm font-medium mb-1 opacity-90">{offer.title}</p>
                <p className="text-lg md:text-2xl font-bold">{offer.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Cards - Mobile Optimized Grid */}
      <section className="w-full py-6 md:py-8">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                to={category.link}
                className="group"
              >
                <div className={`bg-gradient-to-br ${category.gradient} rounded-xl p-6 md:p-8 text-white text-center hover:shadow-lg transition-all group-hover:scale-105`}>
                  <div className="text-4xl md:text-5xl mb-3">{category.icon}</div>
                  <h3 className="text-lg md:text-xl font-bold mb-1">{category.title}</h3>
                  <p className="text-xs md:text-sm opacity-90">{category.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="w-full py-6 md:py-8 bg-white">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Trending Now
            </h2>
            <Link
              to="/products"
              className="text-pink-600 hover:text-pink-700 font-semibold text-sm md:text-base"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 md:h-80 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No products available</p>
              <Link
                to="/products"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-semibold"
              >
                Explore All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features - Mobile Optimized */}
      <section className="w-full py-8 md:py-12 bg-gray-50">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2">Authentic Products</h3>
              <p className="text-sm text-gray-600">100% genuine products</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2">Best Prices</h3>
              <p className="text-sm text-gray-600">Lowest prices guaranteed</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Quick shipping nationwide</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
