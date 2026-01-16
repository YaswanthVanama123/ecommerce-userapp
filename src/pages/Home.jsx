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
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Men',
      subtitle: 'Trendy Styles',
      link: '/products?category=men',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Kids',
      subtitle: 'Fun & Comfort',
      link: '/products?category=kids',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Accessories',
      subtitle: 'Complete Look',
      link: '/products?category=accessories',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
  ];

  const offers = [
    {
      title: 'Flash Sale',
      description: 'Up to 70% OFF',
      subtext: 'Limited time offer',
      bg: 'bg-red-600',
      link: '/products?tag=sale'
    },
    {
      title: 'New Arrivals',
      description: 'Fresh Collections',
      subtext: 'Just landed',
      bg: 'bg-pink-600',
      link: '/products?tag=new'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Hero Banner */}
      <section className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-4 max-w-7xl mx-auto py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Discover Your Style
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Shop the latest trends in fashion with exclusive deals and free shipping
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition shadow-sm"
              >
                Shop Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/products?tag=new"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-gray-300"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Banner */}
      <section className="w-full bg-gray-50 py-6 md:py-8">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <Link
                key={offer.title}
                to={offer.link}
                className={`${offer.bg} rounded-xl p-6 md:p-8 text-white hover:shadow-lg transition group`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1 opacity-90">{offer.title}</p>
                    <p className="text-2xl md:text-3xl font-bold mb-1">{offer.description}</p>
                    <p className="text-sm opacity-75">{offer.subtext}</p>
                  </div>
                  <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="w-full py-8 md:py-12 bg-white">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Shop by Category
            </h2>
            <p className="text-gray-600">Find what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.title}
                to={category.link}
                className="group"
              >
                <div className={`${category.bgColor} ${category.borderColor} border-2 rounded-xl p-6 md:p-8 text-center hover:shadow-md transition-all`}>
                  <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 ${category.textColor} group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="w-full py-8 md:py-12 bg-gray-50">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Trending Now
              </h2>
              <p className="text-gray-600">Popular items this week</p>
            </div>
            <Link
              to="/products"
              className="text-pink-600 hover:text-pink-700 font-semibold text-sm md:text-base flex items-center"
            >
              View All
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-64 md:h-80 animate-pulse border border-gray-200" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-600 text-lg mb-4">No products available</p>
              <Link
                to="/products"
                className="inline-block text-pink-600 hover:text-pink-700 font-semibold"
              >
                Explore All Products →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-12 md:py-16 bg-white border-t border-gray-200">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Authentic Products</h3>
              <p className="text-gray-600">100% genuine and verified products from trusted brands</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive prices with regular discounts and offers</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping to your doorstep</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
