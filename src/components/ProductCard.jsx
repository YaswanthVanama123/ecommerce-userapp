import { Link } from 'react-router-dom';

const ProductCard = ({ product, compact = false }) => {
  const discountedPrice = product.discount > 0
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  return (
    <Link
      to={`/products/${product._id}`}
      className={`block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
        compact ? '' : 'group'
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain ${compact ? '' : 'group-hover:scale-105'} transition-transform duration-300`}
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}

        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Out of Stock</span>
          </div>
        )}

        {/* Rating Badge */}
        {product.rating > 0 && (
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
      <div className={compact ? 'p-2' : 'p-3'}>
        {/* Category */}
        {product.category?.name && !compact && (
          <p className="text-xs text-gray-500 uppercase mb-1 font-medium truncate">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <h3 className={`font-semibold text-gray-900 mb-1 line-clamp-2 ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center space-x-2">
          {product.discount > 0 ? (
            <>
              <span className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                ₹{Math.round(discountedPrice)}
              </span>
              <span className={`text-gray-400 line-through ${compact ? 'text-xs' : 'text-sm'}`}>
                ₹{Math.round(product.price)}
              </span>
            </>
          ) : (
            <span className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              ₹{Math.round(product.price)}
            </span>
          )}
        </div>

        {/* Brand */}
        {product.brand && !compact && (
          <p className="text-xs text-gray-500 mt-1 truncate">{product.brand}</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
