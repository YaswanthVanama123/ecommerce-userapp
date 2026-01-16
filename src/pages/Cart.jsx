import { useMemo, useCallback, memo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';

// Memoized Loading Spinner
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Empty Cart Display
const EmptyCart = memo(({ onContinueShopping }) => (
  <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
    <svg
      className="w-20 h-20 md:w-24 md:h-24 mx-auto text-gray-400 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
      Your Shopping Bag is Empty
    </h2>
    <p className="text-sm md:text-base text-gray-600 mb-6">
      Add some trendy items to your bag to get started!
    </p>
    <button
      onClick={onContinueShopping}
      className="bg-pink-600 text-white px-6 md:px-8 py-3 rounded-lg hover:bg-pink-700 transition font-medium"
    >
      Start Shopping
    </button>
  </div>
));

EmptyCart.displayName = 'EmptyCart';

// Memoized Order Summary
const OrderSummary = memo(({
  itemCount,
  subtotal,
  tax,
  total,
  onCheckout,
  onContinueShopping
}) => (
  <div className="lg:col-span-1">
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-20">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Price Details</h2>

      {/* Summary Details */}
      <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
        <div className="flex justify-between text-sm md:text-base text-gray-600">
          <span>Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-medium">₹{subtotal}</span>
        </div>

        <div className="flex justify-between text-sm md:text-base text-gray-600">
          <span>Delivery Charges</span>
          <span className="font-medium text-green-600">Free</span>
        </div>

        <div className="flex justify-between text-sm md:text-base text-gray-600">
          <span>Tax (10%)</span>
          <span className="font-medium">₹{tax}</span>
        </div>

        <div className="border-t pt-3 md:pt-4">
          <div className="flex justify-between text-base md:text-lg font-bold text-gray-900">
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
          <p className="text-xs md:text-sm text-green-600 mt-2">
            You will save ₹{(parseFloat(subtotal) * 0.1).toFixed(2)} on this order
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition font-semibold mb-3"
      >
        Proceed to Checkout
      </button>

      {/* Continue Shopping */}
      <button
        onClick={onContinueShopping}
        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        Continue Shopping
      </button>

      {/* Security Badge */}
      <div className="mt-4 md:mt-6 flex items-center justify-center space-x-2 text-xs md:text-sm text-gray-600">
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>Safe and Secure Payments</span>
      </div>
    </div>
  </div>
));

OrderSummary.displayName = 'OrderSummary';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, total, loading } = useCart();

  // Memoize navigation callbacks
  const handleCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  const handleContinueShopping = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  // Memoize computed values
  const isEmpty = useMemo(
    () => !cart?.items || cart.items.length === 0,
    [cart?.items]
  );

  const itemCount = useMemo(
    () => cart?.items?.length || 0,
    [cart?.items]
  );

  const subtotal = useMemo(
    () => total.toFixed(2),
    [total]
  );

  const tax = useMemo(
    () => (total * 0.1).toFixed(2),
    [total]
  );

  const totalAmount = useMemo(
    () => (total * 1.1).toFixed(2),
    [total]
  );

  // Early return for loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="w-full px-4 max-w-7xl mx-auto py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
          Shopping Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        {isEmpty ? (
          <EmptyCart onContinueShopping={handleContinueShopping} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {cart.items.map((item) => (
                <CartItem key={item._id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <OrderSummary
              itemCount={itemCount}
              subtotal={subtotal}
              tax={tax}
              total={totalAmount}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
