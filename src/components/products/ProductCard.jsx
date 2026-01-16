import { Link } from 'react-router-dom';
import { useState, memo, useMemo, useCallback } from 'react';

const ProductCard = memo(({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize expensive calculations
  const hasDiscount = useMemo(() => product.discount > 0, [product.discount]);

  const discountedPrice = useMemo(() => {
    return hasDiscount
      ? product.price - (product.price * product.discount) / 100
      : product.price;
  }, [hasDiscount, product.price, product.discount]);

  const imageUrl = useMemo(
    () => product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image',
    [product.images]
  );

  const categoryName = useMemo(
    () => product.category?.name || 'Uncategorized',
    [product.category?.name]
  );

  const isOutOfStock = useMemo(() => product.stock === 0, [product.stock]);

  const isLowStock = useMemo(
    () => product.stock > 0 && product.stock <= 10,
    [product.stock]
  );

  const formattedRating = useMemo(
    () => product.rating?.toFixed(1),
    [product.rating]
  );

  const formattedPrice = useMemo(
    () => product.price.toFixed(2),
    [product.price]
  );

  const formattedDiscountedPrice = useMemo(
    () => discountedPrice.toFixed(2),
    [discountedPrice]
  );

  // Generate srcset for responsive images
  const srcSet = useMemo(() => {
    if (imageUrl.includes('placeholder')) return '';
    // For actual product images, you would typically have different sizes
    // Format: image-400w.jpg 400w, image-600w.jpg 600w, image-800w.jpg 800w
    return `${imageUrl} 400w, ${imageUrl} 600w, ${imageUrl} 800w`;
  }, [imageUrl]);

  const displayImageUrl = useMemo(() => {
    return imageError ? 'https://via.placeholder.com/400x400?text=Image+Not+Available' : imageUrl;
  }, [imageError, imageUrl]);

  // Memoize event handlers
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <Link
      to={`/products/${product._id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Product Image */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        {/* Blur placeholder - shown while image is loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400"
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
          </div>
        )}

        {/* Actual Image */}
        <img
          src={displayImageUrl}
          srcSet={!imageError && srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={product.name}
          loading="lazy"
          width="400"
          height="400"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover hover:scale-110 transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
          }}
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold z-10">
            {product.discount}% OFF
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <span className="text-white text-lg font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase mb-1">
          {categoryName}
        </p>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            {hasDiscount ? (
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-blue-600">
                  ${formattedDiscountedPrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${formattedPrice}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-blue-600">
                ${formattedPrice}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1">
              <svg
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600">{formattedRating}</span>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2">
          {isLowStock && (
            <p className="text-xs text-orange-600">
              Only {product.stock} left in stock!
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
