import { memo, useCallback, useMemo, useState } from 'react';
import { useCartActions } from '../../context/CartContext';

const CartItem = memo(({ item }) => {
  const { updateQuantity, removeItem } = useCartActions();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Memoize computed values
  const imageUrl = useMemo(
    () => item.product.images?.[0] || 'https://via.placeholder.com/100x100?text=No+Image',
    [item.product.images]
  );

  const categoryName = useMemo(
    () => item.product.category?.name || 'Uncategorized',
    [item.product.category?.name]
  );

  const formattedPrice = useMemo(
    () => {
      const price = item.price || item.product?.price || 0;
      return Math.round(price);
    },
    [item.price, item.product?.price]
  );

  const formattedSubtotal = useMemo(
    () => {
      const price = item.price || item.product?.price || 0;
      const subtotal = item.subtotal || (price * item.quantity);
      return Math.round(subtotal);
    },
    [item.subtotal, item.price, item.product?.price, item.quantity]
  );

  const stock = useMemo(
    () => item.product?.stock || 999,
    [item.product?.stock]
  );

  const isAtMaxStock = useMemo(
    () => item.quantity >= stock,
    [item.quantity, stock]
  );

  const isAtMinQuantity = useMemo(
    () => item.quantity <= 1,
    [item.quantity]
  );

  const isLowStock = useMemo(
    () => stock < 5,
    [stock]
  );

  const isOutOfStock = useMemo(
    () => stock === 0,
    [stock]
  );

  // Memoize event handlers
  const handleQuantityChange = useCallback(
    async (newQuantity) => {
      if (newQuantity > 0 && newQuantity <= stock && !isUpdating) {
        setIsUpdating(true);
        try {
          await updateQuantity(item._id, newQuantity);
        } finally {
          setIsUpdating(false);
        }
      }
    },
    [item._id, stock, updateQuantity, isUpdating]
  );

  const handleIncrement = useCallback(() => {
    handleQuantityChange(item.quantity + 1);
  }, [handleQuantityChange, item.quantity]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(item.quantity - 1);
  }, [handleQuantityChange, item.quantity]);

  const handleRemove = useCallback(async () => {
    if (!isRemoving) {
      setIsRemoving(true);
      try {
        await removeItem(item._id);
      } finally {
        setIsRemoving(false);
      }
    }
  }, [item._id, removeItem, isRemoving]);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-3 md:p-4 transition-opacity ${isRemoving ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-start space-x-3 md:space-x-4">
        {/* Product Image */}
        <div className="w-20 h-24 md:w-24 md:h-32 flex-shrink-0 relative">
          <img
            src={imageUrl}
            alt={item.product.name}
            className="w-full h-full object-contain rounded-md"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
              <span className="text-white text-xs font-bold">OUT OF STOCK</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-grow pr-2">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                {item.product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {categoryName}
              </p>
            </div>

            {/* Remove Button - Top Right on Mobile */}
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-gray-400 hover:text-red-600 transition flex-shrink-0 md:hidden disabled:opacity-50"
              aria-label="Remove item"
            >
              {isRemoving ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Size and Color */}
          {(item.size || item.color) && (
            <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600 mb-2">
              {item.size && (
                <span className="flex items-center">
                  Size: <span className="font-medium ml-1">{item.size}</span>
                </span>
              )}
              {item.color && (
                <span className="flex items-center">
                  Color: <span className="font-medium ml-1">{item.color}</span>
                </span>
              )}
            </div>
          )}

          {/* Stock Warning */}
          {isOutOfStock && (
            <div className="mb-2 flex items-center gap-1.5 text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Out of stock</span>
            </div>
          )}
          {!isOutOfStock && isLowStock && (
            <div className="mb-2 flex items-center gap-1.5 text-orange-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium">Only {stock} left in stock</span>
            </div>
          )}

          {/* Price and Quantity - Mobile Layout */}
          <div className="flex items-center justify-between mt-3">
            {/* Price */}
            <div>
              <p className="text-base md:text-lg font-bold text-gray-900">
                ₹{formattedSubtotal}
              </p>
              <p className="text-xs text-gray-500">
                ₹{formattedPrice} each
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={handleDecrement}
                  disabled={isAtMinQuantity || isUpdating || isOutOfStock}
                  className="px-2 md:px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium transition"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 md:px-4 py-1 border-x border-gray-300 font-semibold text-sm min-w-[40px] text-center">
                  {isUpdating ? (
                    <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    item.quantity
                  )}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={isAtMaxStock || isUpdating || isOutOfStock}
                  className="px-2 md:px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium transition"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {isAtMaxStock && !isOutOfStock && (
                <p className="text-xs text-orange-600 font-medium">Max stock reached</p>
              )}
            </div>
          </div>

          {/* Remove Button - Desktop */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="hidden md:flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 font-medium mt-3 disabled:opacity-50"
          >
            {isRemoving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Removing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Remove</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
