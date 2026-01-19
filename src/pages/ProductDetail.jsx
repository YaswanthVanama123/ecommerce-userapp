import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, reviewApi } from '../api';
import { useCartActions } from '../context/CartContext';
import { useWishlistActions } from '../context/WishlistContext';
import { useAuth, useAuthActions } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PincodeChecker from '../components/PincodeChecker';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartActions();
  const { toggleWishlist, isInWishlist: checkIsInWishlist } = useWishlistActions();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();

  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const imageScrollRef = useRef(null);

  // Wishlist state - use API response if available, otherwise check context
  const isInWishlist = product?.isInWishlist ?? checkIsInWishlist(id);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsSortBy, setReviewsSortBy] = useState('recent');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [reviewsSortBy, reviewsPage]);

  // Memoized image load handler
  const handleImageLoad = useCallback((index) => {
    setLoadedImages(prev => {
      if (prev.has(index)) return prev; // Prevent unnecessary updates
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  }, []);

  // Scroll handling for image gallery
  const handleImageScroll = (e) => {
    if (!imageScrollRef.current) return;

    const scrollLeft = e.target.scrollLeft;
    const imageWidth = e.target.offsetWidth;
    const newIndex = Math.round(scrollLeft / imageWidth);

    if (newIndex !== selectedImage && newIndex >= 0 && newIndex < product.images.length) {
      setSelectedImage(newIndex);
    }
  };

  const scrollToImage = (index) => {
    if (!imageScrollRef.current) return;

    setSelectedImage(index);

    const imageWidth = imageScrollRef.current.offsetWidth;
    imageScrollRef.current.scrollTo({
      left: imageWidth * index,
      behavior: 'smooth'
    });
  };

  // Fetch product data
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProductById(id);
      setProduct(response.data);

      // Reset loaded images when product changes
      setLoadedImages(new Set());

      // Set default selections
      if (response.data.sizes?.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      if (response.data.colors?.length > 0) {
        setSelectedColor(response.data.colors[0].name);
      }
    } catch (err) {
      setError('Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const [reviewsResponse, statsResponse] = await Promise.all([
        reviewApi.getReviews(id, {
          page: reviewsPage,
          limit: 10,
          sortBy: reviewsSortBy
        }),
        reviewApi.getReviewStats(id)
      ]);

      setReviews(reviewsResponse.data.reviews || []);
      setReviewsTotal(reviewsResponse.data.total || 0);
      setReviewStats(statsResponse.data || null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Toggle wishlist - using context for guest support
  const handleToggleWishlist = async () => {
    setWishlistLoading(true);
    try {
      await toggleWishlist(id);
    } catch (err) {
      console.error('Error updating wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product.colors?.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(product._id, quantity, selectedSize, selectedColor);
    setAddingToCart(false);

    if (result.success) {
      setQuantity(1);
    }
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Please login to write a review');
      setShowReviewModal(false);
      return;
    }

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewApi.submitReview(id, reviewForm);
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
      fetchProduct(); // Refresh product to update rating
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Mark review as helpful
  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.info('Please login to mark reviews as helpful');
      return;
    }

    try {
      await reviewApi.markReviewHelpful(id, reviewId);
      toast.success('Thanks for your feedback!');
      fetchReviews();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to mark as helpful';
      toast.error(errorMessage);
    }
  };

  const discountedPrice = product?.discount > 0
    ? product.price - (product.price * product.discount) / 100
    : product?.price;

  // Calculate total available stock
  const getAvailableStock = () => {
    if (!product) return 0;

    if (typeof product.stock === 'number') {
      return product.stock;
    }

    if (Array.isArray(product.stock)) {
      return product.stock.reduce((total, item) => total + (item.quantity || 0), 0);
    }

    return 0;
  };

  const availableStock = getAvailableStock();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 text-lg mb-4">{error || 'Product not found'}</p>
        <button
          onClick={() => navigate('/products')}
          className="text-pink-600 hover:text-pink-700 font-semibold"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      {/* Header - Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="ml-2 font-medium">Back</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isInWishlist ? (
              <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-8 lg:px-4 lg:py-8">
        {/* Image Gallery */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          {/* Main Image - Horizontal Scroll */}
          <div
            ref={imageScrollRef}
            onScroll={handleImageScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide bg-gray-50 lg:rounded-lg"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((image, index) => {
                const isLoaded = loadedImages.has(index);

                return (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-full aspect-[3/4] snap-center bg-gray-50"
                  >
                    <img
                      src={image || 'https://via.placeholder.com/600x800?text=No+Image'}
                      alt={`${product.name} - Image ${index + 1}`}
                      loading={index <= 1 ? 'eager' : 'lazy'}
                      onLoad={() => handleImageLoad(index)}
                      ref={(img) => {
                        // For cached images, mark as loaded immediately
                        if (img?.complete && img?.naturalHeight > 0 && !isLoaded) {
                          handleImageLoad(index);
                        }
                      }}
                      className="w-full h-full object-contain transition-opacity duration-200"
                      style={{ opacity: isLoaded ? 1 : 0 }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="relative flex-shrink-0 w-full aspect-[3/4] snap-center bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No image available</p>
                </div>
              </div>
            )}

            {/* Image Counter */}
            {product.images?.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none">
                {selectedImage + 1}/{product.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Dots - Mobile */}
          {product.images?.length > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4 lg:hidden">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToImage(index)}
                  className={`transition-all duration-200 rounded-full ${
                    selectedImage === index
                      ? 'w-8 h-2 bg-pink-600'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Desktop Thumbnails */}
          {product.images?.length > 1 && (
            <div className="hidden lg:grid grid-cols-5 gap-2 mt-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => scrollToImage(index)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-pink-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="px-4 py-4 lg:px-0">
          {/* Category & Stock Badge */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {product.category?.name || 'Uncategorized'}
            </span>
            {availableStock === 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                ₹{Math.round(discountedPrice)}
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    ₹{Math.round(product.price)}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="inline-flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 text-sm"
              >
                −
              </button>
              <span className="px-4 py-1.5 border-x border-gray-300 font-medium text-gray-900 text-sm min-w-[45px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Stock Warning */}
          {availableStock > 0 && availableStock <= 10 && (
            <p className="text-xs text-orange-600 mb-4">
              Only {availableStock} left in stock!
            </p>
          )}

          {/* Rating Summary */}
          {reviewStats && (
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
              <div className="flex items-center bg-green-600 text-white px-2 py-0.5 rounded space-x-1">
                <span className="text-xs font-semibold">{reviewStats.averageRating?.toFixed(1) || '0.0'}</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {reviewStats.totalReviews || 0} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Size</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[40px] px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                      selectedSize === size
                        ? 'border-pink-600 bg-pink-600 text-white shadow-sm'
                        : 'border-gray-300 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                Color: <span className="font-normal text-gray-900">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color._id || color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.name
                        ? 'border-pink-600 ring-2 ring-pink-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hexCode }}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Brand & Material - Compact Display */}
          {(product.brand || product.material) && (
            <div className="flex items-center gap-6 mb-4 pb-4 border-b text-sm">
              {product.brand && (
                <div>
                  <span className="text-xs text-gray-500 block">Brand</span>
                  <span className="font-medium text-gray-900">{product.brand}</span>
                </div>
              )}
              {product.material && (
                <div>
                  <span className="text-xs text-gray-500 block">Material</span>
                  <span className="font-medium text-gray-900">{product.material}</span>
                </div>
              )}
            </div>
          )}

          {/* Delivery Check */}
          <div className="mb-6">
            <PincodeChecker productId={product._id} compact={true} />
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={availableStock === 0 || addingToCart}
              className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                availableStock === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : addingToCart
                  ? 'bg-pink-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 shadow-lg'
              }`}
            >
              {addingToCart ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding to Cart...
                </div>
              ) : availableStock === 0 ? (
                'Out of Stock'
              ) : (
                'Add to Cart'
              )}
            </button>

            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="px-6 py-3 border-2 border-pink-600 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all disabled:opacity-50"
            >
              {isInWishlist ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ratings & Reviews</h2>
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-sm font-semibold text-pink-600 hover:text-pink-700"
              >
                Write a Review
              </button>
            </div>

            {/* Rating Breakdown */}
            {reviewStats && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-8">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {reviewStats.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(reviewStats.averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {reviewStats.totalReviews || 0} reviews
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewStats.ratingDistribution?.[rating] || 0;
                      const percentage = reviewStats.totalReviews > 0
                        ? (count / reviewStats.totalReviews) * 100
                        : 0;

                      return (
                        <div key={rating} className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm font-medium text-gray-700">{rating}</span>
                            <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sort Reviews */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={reviewsSortBy}
                onChange={(e) => setReviewsSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="recent">Most Recent</option>
                <option value="rating_high">Highest Rated</option>
                <option value="rating_low">Lowest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-gray-500 mb-4">No reviews yet</p>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Be the first to review
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-6 last:border-b-0">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {review.user?.name || 'Anonymous'}
                            </span>
                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified Purchase
                              </span>
                            )}
                          </div>

                          {/* Rating Stars */}
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>

                          <div className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {review.title}
                      </h4>
                    )}

                    {/* Review Text */}
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {review.comment}
                    </p>

                    {/* Review Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleMarkHelpful(review._id)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>Helpful ({review.helpfulCount || 0})</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {reviewsTotal > reviews.length && (
                  <button
                    onClick={() => setReviewsPage(reviewsPage + 1)}
                    className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-pink-600 hover:text-pink-600 transition-colors"
                  >
                    Load More Reviews
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 lg:hidden z-[60] shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className="px-4 py-3 border-2 border-pink-600 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all disabled:opacity-50"
          >
            {isInWishlist ? (
              <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleAddToCart}
            disabled={availableStock === 0 || addingToCart}
            className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
              availableStock === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : addingToCart
                ? 'bg-pink-400 cursor-not-allowed'
                : 'bg-pink-600 hover:bg-pink-700 shadow-lg'
            }`}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : availableStock === 0 ? (
              'Out of Stock'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/60'}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.category?.name}</p>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= reviewForm.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {reviewForm.rating} {reviewForm.rating === 1 ? 'Star' : 'Stars'}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Sum up your experience in one line"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  maxLength={100}
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your thoughts about this product..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {reviewForm.comment.length}/1000
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview || !reviewForm.comment.trim()}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                  submittingReview || !reviewForm.comment.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {submittingReview ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
