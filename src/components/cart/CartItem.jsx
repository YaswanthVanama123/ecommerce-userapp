import { memo, useCallback, useMemo } from 'react';
import { useCart } from '../../context/CartContext';

const CartItem = memo(({ item }) => {
  const { updateQuantity, removeItem } = useCart();

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
    () => Math.round(item.price),
    [item.price]
  );

  const formattedSubtotal = useMemo(
    () => Math.round(item.subtotal),
    [item.subtotal]
  );

  const isAtMaxStock = useMemo(
    () => item.quantity >= item.product.stock,
    [item.quantity, item.product.stock]
  );

  const isAtMinQuantity = useMemo(
    () => item.quantity <= 1,
    [item.quantity]
  );

  // Memoize event handlers
  const handleQuantityChange = useCallback(
    async (newQuantity) => {
      if (newQuantity > 0 && newQuantity <= item.product.stock) {
        await updateQuantity(item._id, newQuantity);
      }
    },
    [item._id, item.product.stock, updateQuantity]
  );

  const handleIncrement = useCallback(() => {
    handleQuantityChange(item.quantity + 1);
  }, [handleQuantityChange, item.quantity]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(item.quantity - 1);
  }, [handleQuantityChange, item.quantity]);

  const handleRemove = useCallback(async () => {
    await removeItem(item._id);
  }, [item._id, removeItem]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
      <div className="flex items-start space-x-3 md:space-x-4">
        {/* Product Image */}
        <div className="w-20 h-24 md:w-24 md:h-32 flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.product.name}
            className="w-full h-full object-cover rounded-md"
          />
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
              className="text-gray-400 hover:text-red-600 transition flex-shrink-0 md:hidden"
              aria-label="Remove item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                  disabled={isAtMinQuantity}
                  className="px-2 md:px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 md:px-4 py-1 border-x border-gray-300 font-semibold text-sm min-w-[40px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={isAtMaxStock}
                  className="px-2 md:px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {isAtMaxStock && (
                <p className="text-xs text-orange-600">Max stock</p>
              )}
            </div>
          </div>

          {/* Remove Button - Desktop */}
          <button
            onClick={handleRemove}
            className="hidden md:flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 font-medium mt-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
