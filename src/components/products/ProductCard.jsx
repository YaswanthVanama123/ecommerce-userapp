import { Link } from 'react-router-dom';
import { useState } from 'react';

const ProductCard = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image';
  const displayImageUrl = imageError
    ? 'https://via.placeholder.com/300x400?text=Image+Not+Available'
    : (imageUrl || 'https://via.placeholder.com/300x400?text=No+Image');

  return (
    <Link
      to={`/products/${product._id}`}
      className="block bg-white rounded-lg overflow-hidden shadow-product hover:shadow-product-hover transition-shadow"
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
        )}

        {/* Image */}
        <img
          src={displayImageUrl}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Out of Stock</span>
          </div>
        )}

        {/* Rating Badge - Top Right */}
        {product.rating && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center space-x-1">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-semibold text-gray-900">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Brand/Category */}
        {product.category?.name && (
          <p className="text-xs text-gray-500 uppercase mb-1 font-medium">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-1">
          {hasDiscount ? (
            <>
              <span className="text-base md:text-lg font-bold text-gray-900">
                ₹{Math.round(discountedPrice)}
              </span>
              <span className="text-xs md:text-sm text-gray-400 line-through">
                ₹{Math.round(product.price)}
              </span>
            </>
          ) : (
            <span className="text-base md:text-lg font-bold text-gray-900">
              ₹{Math.round(product.price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.stock > 0 && product.stock <= 10 && (
          <p className="text-xs text-orange-600 font-medium">
            Only {product.stock} left
          </p>
        )}

        {/* Free Delivery Badge (if price > 500) */}
        {product.price >= 500 && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            Free Delivery
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
