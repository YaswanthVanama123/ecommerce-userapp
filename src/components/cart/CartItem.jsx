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
    () => item.price.toFixed(2),
    [item.price]
  );

  const formattedSubtotal = useMemo(
    () => item.subtotal.toFixed(2),
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
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
      {/* Product Image */}
      <div className="w-24 h-24 flex-shrink-0">
        <img
          src={imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover rounded-md"
        />
      </div>

      {/* Product Details */}
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {categoryName}
        </p>

        {/* Size and Color */}
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
          {item.size && (
            <span>
              Size: <span className="font-medium">{item.size}</span>
            </span>
          )}
          {item.color && (
            <span>
              Color: <span className="font-medium">{item.color}</span>
            </span>
          )}
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-blue-600 mt-2">
          ${formattedPrice} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={handleDecrement}
            disabled={isAtMinQuantity}
            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="px-4 py-1 border-x border-gray-300 font-semibold">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isAtMaxStock}
            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        {isAtMaxStock && (
          <p className="text-xs text-orange-600">Max available</p>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex flex-col items-end space-y-2 w-32">
        <p className="text-xl font-bold text-gray-900">
          ${formattedSubtotal}
        </p>
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
