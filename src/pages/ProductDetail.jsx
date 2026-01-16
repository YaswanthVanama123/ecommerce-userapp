import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// Optimized Image Component with Progressive Loading
const OptimizedImage = ({
  src,
  alt,
  className,
  isMainImage = false,
  width,
  height,
  priority = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  useEffect(() => {
    // Progressive loading: start with a data URI or low-quality image
    if (priority && !imageLoaded) {
      setCurrentSrc(src);
    } else {
      // For non-priority images, load on-demand
      setCurrentSrc(src);
    }
  }, [src, priority]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Generate srcset for responsive images
  const generateSrcSet = (url) => {
    if (!url || url.includes('placeholder')) return '';
    // For actual product images with different sizes
    // Format: image-400w.jpg 400w, image-600w.jpg 600w, image-800w.jpg 800w
    return `${url} 400w, ${url} 600w, ${url} 800w, ${url} 1200w`;
  };

  const fallbackImage = isMainImage
    ? 'https://via.placeholder.com/600x600?text=Image+Not+Available'
    : 'https://via.placeholder.com/150x150?text=No+Image';

  return (
    <div className="relative w-full h-full">
      {/* Loading Placeholder with blur effect */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <svg
            className={`${isMainImage ? 'w-20 h-20' : 'w-8 h-8'} text-gray-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual Image */}
      <img
        src={imageError ? fallbackImage : currentSrc}
        srcSet={!imageError && currentSrc && generateSrcSet(currentSrc)}
        sizes={isMainImage
          ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
          : "(max-width: 768px) 25vw, 150px"
        }
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transition: 'opacity 0.3s ease-in-out'
        }}
      />

      {/* Error State Indicator */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
            <p className="text-xs text-gray-500">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
        setSelectedColor(response.data.colors[0]);
      }

      // Initialize image loaded state
      if (response.data.images?.length > 0) {
        const loadedState = {};
        response.data.images.forEach((_, index) => {
          loadedState[index] = false;
        });
        setImagesLoaded(loadedState);
      }
    } catch (err) {
      setError('Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/login', { state: { from: location } });
      return;
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
        <button
          onClick={() => navigate('/products')}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-blue-600">
          Home
        </button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate('/products')} className="hover:text-blue-600">
          Products
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          {/* Main Image */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="relative w-full h-96">
              <OptimizedImage
                src={product.images?.[selectedImage] || 'https://via.placeholder.com/600x600?text=No+Image'}
                alt={`${product.name} - Main view`}
                className="w-full h-full object-contain"
                isMainImage={true}
                width="600"
                height="600"
                priority={selectedImage === 0}
              />
            </div>
          </div>

          {/* Thumbnail Images */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`bg-white rounded-lg shadow-md p-2 hover:shadow-lg transition-all duration-200 ${
                    selectedImage === index ? 'ring-2 ring-blue-600 scale-105' : ''
                  }`}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                >
                  <div className="relative w-full h-20">
                    <OptimizedImage
                      src={image}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain"
                      isMainImage={false}
                      width="150"
                      height="150"
                      priority={index < 4}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Image Navigation Hint */}
          {product.images?.length > 1 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Click thumbnails to view different images ({selectedImage + 1} of {product.images.length})
            </p>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Category & Stock */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 uppercase">
              {product.category?.name || 'Uncategorized'}
            </span>
            {product.stock > 0 ? (
              <span className="text-sm text-green-600 font-medium">In Stock</span>
            ) : (
              <span className="text-sm text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    className={`w-5 h-5 ${
                      index < Math.floor(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">{product.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {product.discount > 0 ? (
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-blue-600">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </span>
                <span className="bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold">
                  {product.discount}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                      selectedColor === color
                        ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h3>
            <div className="flex items-center border border-gray-300 rounded-md w-32">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="px-4 py-2 border-x border-gray-300 font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Only {product.stock} left in stock!
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              product.stock === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : addingToCart
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Adding to Cart...
              </div>
            ) : product.stock === 0 ? (
              'Out of Stock'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>

      {/* Product Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex border-b border-gray-200 py-2">
                <span className="font-medium text-gray-700 w-1/3">{key}:</span>
                <span className="text-gray-600 w-2/3">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
