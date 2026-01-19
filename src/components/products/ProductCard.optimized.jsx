import { Link } from 'react-router-dom';
import { useState, memo, useMemo, useCallback } from 'react';
import { useCartActions } from '../../context/CartContext';
import { useWishlistActions } from '../../context/WishlistContext';

// Memoized sub-components for better performance
const DiscountBadge = memo(({ discount }) => (
  <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
    {discount}% OFF
  </div>
));

DiscountBadge.displayName = 'DiscountBadge';

const OutOfStockOverlay = memo(() => (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
    <span className="text-white text-sm font-semibold">Out of Stock</span>
  </div>
));

OutOfStockOverlay.displayName = 'OutOfStockOverlay';

const RatingBadge = memo(({ rating }) => (
  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center space-x-1">
    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
    <span className="text-xs font-semibold text-gray-900">
      {rating.toFixed(1)}
    </span>
  </div>
));

RatingBadge.displayName = 'RatingBadge';

const WishlistButton = memo(({ inWishlist, onToggle }) => (
  <button
    onClick={onToggle}
    className={`absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-sm ${
      inWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
    }`}
    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
  >
    {inWishlist ? (
      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    )}
  </button>
));

WishlistButton.displayName = 'WishlistButton';

const QuickAddButton = memo(({ onAdd, isAdding, disabled }) => (
  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={onAdd}
      disabled={disabled || isAdding}
      className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isAdding ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </span>
      ) : (
        'Add to Cart'
      )}
    </button>
  </div>
));

QuickAddButton.displayName = 'QuickAddButton';

const ProductCard = memo(({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addToCart } = useCartActions();
  const { toggleWishlist, isInWishlist } = useWishlistActions();

  // Memoize expensive calculations
  const hasDiscount = useMemo(() => product.discount > 0, [product.discount]);

  const discountedPrice = useMemo(() => {
    return hasDiscount
      ? product.price - (product.price * product.discount) / 100
      : product.price;
  }, [hasDiscount, product.price, product.discount]);

  const displayImageUrl = useMemo(() => {
    const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image';
    return imageError
      ? 'https://via.placeholder.com/300x400?text=Image+Not+Available'
      : imageUrl;
  }, [product.images, imageError]);

  const inWishlist = useMemo(() =>
    isInWishlist(product._id),
    [isInWishlist, product._id]
  );

  const isOutOfStock = useMemo(() => product.stock === 0, [product.stock]);
  const isLowStock = useMemo(() => product.stock > 0 && product.stock <= 10, [product.stock]);
  const hasFreeDelivery = useMemo(() => product.price >= 500, [product.price]);

  // Memoize event handlers
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    setIsAddingToCart(true);
    await addToCart(product._id, 1);
    setIsAddingToCart(false);
  }, [addToCart, product._id, isOutOfStock]);

  const handleToggleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product._id);
  }, [toggleWishlist, product._id]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <div className="relative block bg-white rounded-lg overflow-hidden shadow-product hover:shadow-product-hover transition-shadow group">
      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
          )}

          {/* Image */}
          <img
            src={displayImageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Discount Badge */}
          {hasDiscount && <DiscountBadge discount={product.discount} />}

          {/* Out of Stock Overlay */}
          {isOutOfStock && <OutOfStockOverlay />}

          {/* Rating Badge */}
          {product.rating && !inWishlist && <RatingBadge rating={product.rating} />}

          {/* Wishlist Button */}
          <WishlistButton inWishlist={inWishlist} onToggle={handleToggleWishlist} />

          {/* Quick Add to Cart Button */}
          {!isOutOfStock && (
            <QuickAddButton
              onAdd={handleAddToCart}
              isAdding={isAddingToCart}
              disabled={isOutOfStock}
            />
          )}
        </div>
      </Link>

      {/* Product Info */}
      <Link to={`/products/${product._id}`} className="block p-3">
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
        {isLowStock && (
          <p className="text-xs text-orange-600 font-medium">
            Only {product.stock} left
          </p>
        )}

        {/* Free Delivery Badge */}
        {hasFreeDelivery && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            Free Delivery
          </div>
        )}
      </Link>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific properties change
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.discount === nextProps.product.discount &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.images?.[0] === nextProps.product.images?.[0]
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
