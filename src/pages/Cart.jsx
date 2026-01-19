import { useMemo, useCallback, memo, Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCartActions } from '../context/CartContext';
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
      Your Shopping Bag is not even Empty
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
  shipping,
  tax,
  total,
  onCheckout,
  onContinueShopping,
  onClearCart,
  isAuthenticated,
  hasLowStockItems,
  isLoading
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onClearCart();
    setShowClearConfirm(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
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
            {parseFloat(shipping) === 0 ? (
              <span className="font-medium text-green-600">Free</span>
            ) : (
              <span className="font-medium">₹{shipping}</span>
            )}
          </div>

          <div className="flex justify-between text-sm md:text-base text-gray-600">
            <span>Tax (GST 18%)</span>
            <span className="font-medium">₹{tax}</span>
          </div>

          <div className="border-t pt-3 md:pt-4">
            <div className="flex justify-between text-base md:text-lg font-bold text-gray-900">
              <span>Total Amount</span>
              <span>₹{total}</span>
            </div>
            {parseFloat(shipping) === 0 && (
              <p className="text-xs md:text-sm text-green-600 mt-2">
                You saved ₹50 on delivery charges
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {hasLowStockItems && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-900">Limited Stock Alert</p>
                <p className="text-xs text-orange-700 mt-0.5">Some items in your cart have limited stock</p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          disabled={isLoading || hasLowStockItems}
          className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition font-semibold mb-3 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
        </button>

        {/* Continue Shopping */}
        <button
          onClick={onContinueShopping}
          disabled={isLoading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue Shopping
        </button>

        {/* Clear Cart Button */}
        {!showClearConfirm ? (
          <button
            onClick={handleClearClick}
            disabled={isLoading}
            className="w-full bg-white border border-red-300 text-red-600 py-2.5 rounded-lg hover:bg-red-50 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Cart
          </button>
        ) : (
          <div className="border border-red-300 rounded-lg p-3 bg-red-50">
            <p className="text-sm text-red-900 font-medium mb-3">Clear all items from cart?</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmClear}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition text-sm font-medium"
              >
                Yes, Clear
              </button>
              <button
                onClick={handleCancelClear}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
  );
});

OrderSummary.displayName = 'OrderSummary';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, total, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCartActions();
  const [isClearing, setIsClearing] = useState(false);

  // Memoize navigation callbacks
  const handleCheckout = useCallback(() => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      // Redirect to login with return URL
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  }, [navigate, isAuthenticated]);

  const handleContinueShopping = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  // Handle clear cart
  const handleClearCart = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } finally {
      setIsClearing(false);
    }
  }, [clearCart]);

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
    () => isNaN(total) ? '0.00' : total.toFixed(2),
    [total]
  );

  // Calculate shipping (free for orders above 500, else 50)
  const shipping = useMemo(() => {
    if (isNaN(total) || total === 0) return '0.00';
    return total >= 500 ? '0.00' : '50.00';
  }, [total]);

  // Calculate tax (18% GST)
  const tax = useMemo(() => {
    if (isNaN(total)) return '0.00';
    const shippingCost = parseFloat(shipping);
    return ((total + shippingCost) * 0.18).toFixed(2);
  }, [total, shipping]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (isNaN(total)) return '0.00';
    const shippingCost = parseFloat(shipping);
    const taxAmount = parseFloat(tax);
    return (total + shippingCost + taxAmount).toFixed(2);
  }, [total, shipping, tax]);

  // Check for low stock items
  const hasLowStockItems = useMemo(() => {
    if (!cart?.items) return false;
    return cart.items.some(item => {
      const stock = item.product?.stock || 999;
      return stock < 5 && item.quantity >= stock;
    });
  }, [cart?.items]);

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

        {/* Guest User Banner */}
        {!isAuthenticated && !isEmpty && (
          <div className="mb-6 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-4 md:p-6 flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Sign in to complete your purchase</h3>
              <p className="text-sm text-gray-600">
                Your cart items are saved. Login or create an account to proceed to checkout and place your order.
              </p>
            </div>
          </div>
        )}

        {/* Free Shipping Banner */}
        {!isEmpty && parseFloat(subtotal) < 500 && parseFloat(subtotal) > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Add ₹{(500 - parseFloat(subtotal)).toFixed(2)} more to get FREE delivery!
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((parseFloat(subtotal) / 500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

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
              shipping={shipping}
              tax={tax}
              total={totalAmount}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
              onClearCart={handleClearCart}
              isAuthenticated={isAuthenticated}
              hasLowStockItems={hasLowStockItems}
              isLoading={isClearing}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
