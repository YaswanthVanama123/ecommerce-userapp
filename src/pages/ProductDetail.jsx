import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../api';
import { useCartActions } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartActions();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageScrollRef = useRef(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    // Reset image loaded state when selected image changes
    setImageLoaded(false);
  }, [selectedImage]);

  // Handle scroll for image gallery
  const handleImageScroll = (e) => {
    if (!imageScrollRef.current) return;

    const scrollLeft = e.target.scrollLeft;
    const imageWidth = e.target.offsetWidth;
    const newIndex = Math.round(scrollLeft / imageWidth);

    if (newIndex !== selectedImage && newIndex >= 0 && newIndex < product.images.length) {
      setSelectedImage(newIndex);
    }
  };

  // Scroll to specific image
  const scrollToImage = (index) => {
    if (!imageScrollRef.current) return;

    const imageWidth = imageScrollRef.current.offsetWidth;
    imageScrollRef.current.scrollTo({
      left: imageWidth * index,
      behavior: 'smooth'
    });
    setSelectedImage(index);
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProductById(id);
      setProduct(response.data);

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

  const discountedPrice = product?.discount > 0
    ? product.price - (product.price * product.discount) / 100
    : product?.price;

  // Calculate total available stock
  const getAvailableStock = () => {
    if (!product) return 0;

    // If stock is a number, use it directly
    if (typeof product.stock === 'number') {
      return product.stock;
    }

    // If stock is an array, calculate total
    if (Array.isArray(product.stock)) {
      return product.stock.reduce((total, item) => total + (item.quantity || 0), 0);
    }

    return 0;
  };

  const availableStock = getAvailableStock();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

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
      {/* Header - Only Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="ml-2 font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-8 lg:px-4 lg:py-8">
        {/* Image Gallery - Full width on mobile */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          {/* Main Image - Horizontal Scroll Container */}
          <div
            ref={imageScrollRef}
            onScroll={handleImageScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide bg-gray-50 lg:rounded-lg"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((image, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-full aspect-[3/4] snap-center"
                >
                  {index === selectedImage && !imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <img
                    src={image || 'https://via.placeholder.com/600x800?text=No+Image'}
                    alt={`${product.name} - Image ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onLoad={() => index === selectedImage && setImageLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      index === selectedImage && imageLoaded ? 'opacity-100' : index === selectedImage ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                </div>
              ))
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

            {/* Image Counter - Overlay */}
            {product.images?.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none">
                {selectedImage + 1}/{product.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Dots */}
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
                    className="w-full h-full object-cover"
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

          {/* Price */}
          <div className="flex items-baseline space-x-2 mb-4">
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

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
              <div className="flex items-center bg-green-600 text-white px-2 py-0.5 rounded space-x-1">
                <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {product.reviewCount || 0} ratings
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
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedSize === size
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
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
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color._id || color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedColor === color.name
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: selectedColor === color.name ? color.hexCode + '20' : 'transparent'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <span>{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantity</h3>
            <div className="inline-flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-semibold"
              >
                −
              </button>
              <span className="px-6 py-2 border-x-2 border-gray-300 font-semibold text-gray-900 min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                className="px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-semibold"
              >
                +
              </button>
            </div>
            {availableStock > 0 && availableStock <= 10 && (
              <p className="text-xs text-orange-600 mt-2">
                Only {availableStock} left in stock!
              </p>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-3 mb-6">
            {product.brand && (
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-24">Brand</span>
                <span className="font-medium text-gray-900">{product.brand}</span>
              </div>
            )}
            {product.material && (
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-24">Material</span>
                <span className="font-medium text-gray-900">{product.material}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-24">Delivery</span>
              <span className="font-medium text-green-600">Free delivery available</span>
            </div>
          </div>

          {/* Desktop Add to Cart Button */}
          <div className="hidden lg:block">
            <button
              onClick={handleAddToCart}
              disabled={availableStock === 0 || addingToCart}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
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
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 lg:hidden z-[60] shadow-lg">
        <button
          onClick={handleAddToCart}
          disabled={availableStock === 0 || addingToCart}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
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
  );
};

export default ProductDetail;
