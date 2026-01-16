import { useMemo, useCallback, memo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';

// Memoized Loading Spinner
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Empty Cart Display
const EmptyCart = memo(({ onContinueShopping }) => (
  <div className="bg-white rounded-lg shadow-md p-12 text-center">
    <svg
      className="w-24 h-24 mx-auto text-gray-400 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
      Your cart is empty
    </h2>
    <p className="text-gray-600 mb-6">
      Add some products to your cart to get started
    </p>
    <button
      onClick={onContinueShopping}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
    >
      Continue Shopping
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
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

      {/* Summary Details */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-medium">${subtotal}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="font-medium text-green-600">Free</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span className="font-medium">${tax}</span>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter promo code"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition font-medium">
          Apply Code
        </button>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold mb-4"
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
      <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-600">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secure Checkout</span>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {isEmpty ? (
        <EmptyCart onContinueShopping={handleContinueShopping} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
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
  );
};

export default Cart;
