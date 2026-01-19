import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productApi, bannerApi } from '../api';
import ProductCard from '../components/products/ProductCard';
import BannerCarousel, { BannerCarouselSkeleton } from '../components/home/BannerCarousel';
import OfferCard, { OfferCardSkeleton } from '../components/home/OfferCard';
import MetaTags from '../components/SEO/MetaTags';
import { generateWebSiteSchema, generateOrganizationSchema, generateCombinedSchema } from '../utils/structuredData';

// Loading Skeleton Components
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-100"></div>
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

const CategoryCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-br from-gray-200 to-gray-100 border-2 border-gray-200 rounded-2xl p-8 md:p-10">
      <div className="w-20 h-20 bg-gray-300 rounded-2xl mx-auto mb-5"></div>
      <div className="h-6 bg-gray-300 rounded w-2/3 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
    </div>
  </div>
);

const HeroBannerSkeleton = () => (
  <div className="w-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 border-b border-gray-200">
    <div className="w-full px-4 max-w-7xl mx-auto py-16 md:py-20 lg:py-28">
      <div className="max-w-4xl mx-auto text-center space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded-full w-48 mx-auto mb-6"></div>
        <div className="h-16 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-12 bg-gray-300 rounded w-2/3 mx-auto mb-10"></div>
        <div className="flex gap-4 justify-center">
          <div className="h-14 bg-gray-300 rounded-xl w-48"></div>
          <div className="h-14 bg-gray-300 rounded-xl w-48"></div>
        </div>
      </div>
    </div>
  </div>
);

// Category icon mapping
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';

  if (name.includes('women') || name.includes('female')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  } else if (name.includes('men') || name.includes('male')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  } else if (name.includes('kid') || name.includes('child')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (name.includes('accessor')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  } else if (name.includes('electronic') || name.includes('gadget')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  } else if (name.includes('sport') || name.includes('fitness')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    );
  } else if (name.includes('book') || name.includes('read')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  } else if (name.includes('home') || name.includes('decor')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  } else if (name.includes('fashion') || name.includes('clothing')) {
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    );
  }

  // Default icon
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
};

// Category color schemes
const getCategoryColors = (index) => {
  const colorSchemes = [
    { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
    { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' }
  ];
  return colorSchemes[index % colorSchemes.length];
};

const Home = () => {
  const navigate = useNavigate();

  // State management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ customers: 0, products: 0, rating: 0 });

  // Banner state
  const [heroBanners, setHeroBanners] = useState([]);
  const [promotionalOffers, setPromotionalOffers] = useState([]);

  // Loading states
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    // Fetch featured products
    fetchFeaturedProducts();

    // Fetch trending products
    fetchTrendingProducts();

    // Fetch new arrivals
    fetchNewArrivals();

    // Fetch categories
    fetchCategories();

    // Fetch stats
    fetchStats();

    // Fetch banners
    fetchHeroBanners();
    fetchPromotionalOffers();
  };

  const fetchFeaturedProducts = async () => {
    try {
      setLoadingFeatured(true);
      const response = await productApi.getFeaturedProducts();

      if (response.data && response.data.products) {
        setFeaturedProducts(response.data.products.slice(0, 8));
      } else if (Array.isArray(response.data)) {
        setFeaturedProducts(response.data.slice(0, 8));
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setFeaturedProducts([]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      setLoadingTrending(true);
      // Use dedicated trending endpoint
      const response = await productApi.getTrendingProducts();

      if (response.data && response.data.products) {
        setTrendingProducts(response.data.products.slice(0, 8));
      } else if (Array.isArray(response.data)) {
        setTrendingProducts(response.data.slice(0, 8));
      } else {
        setTrendingProducts([]);
      }
    } catch (err) {
      console.error('Error fetching trending products:', err);
      setTrendingProducts([]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      setLoadingNewArrivals(true);
      // Get products sorted by creation date using backend's 'sort' parameter
      const response = await productApi.getProducts({
        sort: 'newest',
        limit: 8
      });

      if (response.data && response.data.products) {
        setNewArrivals(response.data.products);
      } else if (Array.isArray(response.data)) {
        setNewArrivals(response.data);
      } else {
        setNewArrivals([]);
      }
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      setNewArrivals([]);
    } finally {
      setLoadingNewArrivals(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await productApi.getCategories();

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
      setLoadingCategories(false);
      setLoadingHero(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Try to get actual stats from API
      const productsResponse = await productApi.getProducts({ limit: 1 });

      let totalProducts = 0;
      if (productsResponse.data && productsResponse.data.total) {
        totalProducts = productsResponse.data.total;
      } else if (productsResponse.data && productsResponse.data.pagination) {
        totalProducts = productsResponse.data.pagination.total;
      }

      // Calculate average rating from all featured products
      let avgRating = 4.8; // Default
      if (featuredProducts.length > 0) {
        // Products have ratings.average, not just rating
        const ratings = featuredProducts
          .filter(p => p.ratings && p.ratings.average > 0)
          .map(p => p.ratings.average);

        if (ratings.length > 0) {
          avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        }
      }

      // Estimate customers based on products (you can replace this with actual user count if available)
      const estimatedCustomers = Math.max(50000, Math.floor(totalProducts * 50));

      setStats({
        customers: estimatedCustomers,
        products: totalProducts || 2,
        rating: avgRating
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ customers: 50000, products: 2, rating: 4.8 });
    }
  };

  const fetchHeroBanners = async () => {
    try {
      setLoadingHero(true);
      const response = await bannerApi.getActiveBanners('hero');

      if (response.data && response.data.banners) {
        setHeroBanners(response.data.banners);
      } else if (Array.isArray(response.data)) {
        setHeroBanners(response.data);
      } else {
        setHeroBanners([]);
      }
    } catch (err) {
      console.error('Error fetching hero banners:', err);
      setHeroBanners([]);
    } finally {
      setLoadingHero(false);
    }
  };

  const fetchPromotionalOffers = async () => {
    try {
      setLoadingOffers(true);
      const response = await bannerApi.getActiveBanners('grid');

      if (response.data && response.data.banners) {
        setPromotionalOffers(response.data.banners);
      } else if (Array.isArray(response.data)) {
        setPromotionalOffers(response.data);
      } else {
        setPromotionalOffers([]);
      }
    } catch (err) {
      console.error('Error fetching promotional offers:', err);
      setPromotionalOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    console.log('[Home] handleCategoryClick - categoryId:', categoryId);
    navigate(`/products?category=${categoryId}`);
  };

  const handleShopNowClick = (filter) => {
    navigate(`/products${filter}`);
  };

  // SEO Schema Generation
  const websiteSchema = generateWebSiteSchema({
    name: 'StyleHub',
    description: 'Your one-stop shop for fashion and style. Discover curated collections from top brands.',
  });

  const organizationSchema = generateOrganizationSchema({
    name: 'StyleHub',
    description: 'Leading online fashion retailer offering quality products at great prices'
  });

  const structuredData = generateCombinedSchema(websiteSchema, organizationSchema);

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* SEO Meta Tags */}
      <MetaTags
        title="Home - Shop Latest Fashion & Trending Styles"
        description="Discover curated fashion collections from top brands. Free shipping on orders above ₹999. Shop the latest trends in clothing, accessories, and more at StyleHub."
        keywords="fashion, online shopping, clothing, accessories, trends, StyleHub, free shipping"
        canonicalUrl="/"
        ogType="website"
        ogImage="/icon-512x512.png"
        ogImageAlt="StyleHub - Fashion & Shopping"
        structuredData={structuredData}
      />
      {/* Hero Banner Carousel */}
      {loadingHero ? (
        <BannerCarouselSkeleton />
      ) : heroBanners && heroBanners.length > 0 ? (
        <BannerCarousel
          banners={heroBanners}
          autoPlayInterval={5000}
          enableAutoPlay={true}
          enableSwipe={true}
        />
      ) : (
        // Fallback to static hero if no banners from backend
        <section className="w-full bg-gradient-to-br from-pink-50 via-white to-purple-50 border-b border-gray-200 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-100 rounded-full filter blur-3xl opacity-30 -mr-48 -mt-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-30 -ml-48 -mb-48 animate-pulse"></div>

          <div className="w-full px-4 max-w-7xl mx-auto py-16 md:py-20 lg:py-28 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Trending Fashion Hub
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight animate-fadeInUp">
                Elevate Your
                <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Style Journey
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
                Discover curated collections from top brands. Free shipping on orders above ₹999 with exclusive deals you'll love.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp animation-delay-400">
                <button
                  onClick={() => handleShopNowClick('')}
                  className="group w-full sm:w-auto inline-flex items-center justify-center bg-pink-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Explore Collection
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShopNowClick('?sort=newest')}
                  className="group w-full sm:w-auto inline-flex items-center justify-center bg-white text-gray-900 px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-pink-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  New Arrivals
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto mt-12 md:mt-16 animate-fadeInUp animation-delay-600">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                    {stats.customers >= 1000 ? `${Math.floor(stats.customers / 1000)}K+` : `${stats.customers}+`}
                  </div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                    {stats.products >= 1000 ? `${Math.floor(stats.products / 1000)}K+` : `${stats.products}+`}
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                    {stats.rating.toFixed(1)}★
                  </div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Promotional Offers */}
      <section className="w-full bg-gray-50 py-8 md:py-12">
        <div className="w-full px-4 max-w-7xl mx-auto">
          {loadingOffers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OfferCardSkeleton />
              <OfferCardSkeleton />
            </div>
          ) : promotionalOffers && promotionalOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotionalOffers.slice(0, 4).map((offer) => (
                <OfferCard key={offer._id} offer={offer} />
              ))}
            </div>
          ) : (
            // Fallback to static offers if no promotional banners from backend
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleShopNowClick('?discount=true')}
                className="bg-red-600 rounded-2xl p-8 md:p-10 text-white hover:shadow-2xl transition-all group relative overflow-hidden text-left"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wide">Flash Sale</p>
                      <p className="text-3xl md:text-4xl font-extrabold mb-2">Up to 70% OFF</p>
                      <p className="text-base opacity-90">Limited time offer</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-6 font-semibold group-hover:translate-x-2 transition-transform">
                    Shop Now
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleShopNowClick('?sortBy=createdAt&order=desc')}
                className="bg-pink-600 rounded-2xl p-8 md:p-10 text-white hover:shadow-2xl transition-all group relative overflow-hidden text-left"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wide">New Arrivals</p>
                      <p className="text-3xl md:text-4xl font-extrabold mb-2">Fresh Collections</p>
                      <p className="text-base opacity-90">Just landed</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-6 font-semibold group-hover:translate-x-2 transition-transform">
                    Shop Now
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Category Cards */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.slice(0, 8).map((category, index) => {
                const colors = getCategoryColors(index);
                return (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className="group text-left h-full"
                  >
                    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 md:p-8 text-center hover:shadow-xl transition-all transform hover:-translate-y-1 h-full flex flex-col min-h-[280px] md:min-h-[300px]`}>
                      {/* Category Image or Icon */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 ${colors.text} group-hover:scale-110 transition-transform shadow-md overflow-hidden flex-shrink-0`}>
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `${e.target.parentElement.innerHTML}<div class="w-full h-full flex items-center justify-center">${e.target.parentElement.getAttribute('data-icon')}</div>`;
                            }}
                            data-icon={getCategoryIcon(category.name)}
                          />
                        ) : (
                          getCategoryIcon(category.name)
                        )}
                      </div>

                      {/* Content with flex-grow */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                            {category.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                            {category.description || 'Explore collection'}
                          </p>
                        </div>

                        <div className="flex items-center justify-center text-sm font-semibold text-gray-700 group-hover:text-pink-600 transition-colors mt-auto">
                          Shop Now
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No categories available</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600">Handpicked favorites just for you</p>
            </div>
            <button
              onClick={() => handleShopNowClick('')}
              className="hidden sm:flex items-center text-pink-600 hover:text-pink-700 font-semibold text-base md:text-lg group"
            >
              View All
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
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
              <button
                onClick={() => handleShopNowClick('')}
                className="inline-block text-pink-600 hover:text-pink-700 font-semibold"
              >
                Explore All Products →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Trending Products */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Trending Now
              </h2>
              <p className="text-lg text-gray-600">Most popular items this week</p>
            </div>
            <button
              onClick={() => handleShopNowClick('?sort=rating')}
              className="hidden sm:flex items-center text-pink-600 hover:text-pink-700 font-semibold text-base md:text-lg group"
            >
              View All
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : trendingProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No trending products available</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                New Arrivals
              </h2>
              <p className="text-lg text-gray-600">Fresh from our latest collection</p>
            </div>
            <button
              onClick={() => handleShopNowClick('?sortBy=createdAt&order=desc')}
              className="hidden sm:flex items-center text-pink-600 hover:text-pink-700 font-semibold text-base md:text-lg group"
            >
              View All
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loadingNewArrivals ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No new arrivals available</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full px-4 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Why Shop With Us?
            </h2>
            <p className="text-lg text-gray-600">Experience the best online shopping</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Authentic Products</h3>
              <p className="text-gray-600 leading-relaxed">100% genuine and verified products from trusted brands with quality guarantee</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Best Prices</h3>
              <p className="text-gray-600 leading-relaxed">Competitive prices with regular discounts, seasonal sales and exclusive member offers</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
              <p className="text-gray-600 leading-relaxed">Quick and reliable shipping to your doorstep with real-time tracking</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
