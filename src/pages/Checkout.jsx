import { useState, useEffect, useMemo, useCallback, memo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api';
import { toast } from 'react-toastify';

// Memoized Form Field Component
const FormField = memo(({
  label,
  name,
  type = 'text',
  register,
  errors,
  validation,
  defaultValue,
  className = 'md:col-span-1',
  placeholder
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      {...register(name, validation)}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 border ${
        errors[name] ? 'border-red-500' : 'border-gray-300'
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
    />
    {errors[name] && (
      <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>
    )}
  </div>
));

FormField.displayName = 'FormField';

// Memoized Payment Method Option
const PaymentOption = memo(({
  value,
  label,
  icon,
  checked,
  onChange
}) => (
  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
    checked ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:bg-gray-50'
  }`}>
    <input
      type="radio"
      name="paymentMethod"
      value={value}
      checked={checked}
      onChange={onChange}
      className="mr-3 text-pink-600 focus:ring-pink-500"
    />
    <div className="flex items-center">
      {icon}
      <span className="font-medium text-gray-900">{label}</span>
    </div>
  </label>
));

PaymentOption.displayName = 'PaymentOption';

// Memoized Order Item Component
const OrderItem = memo(({ item }) => (
  <div className="flex items-center space-x-3">
    <img
      src={item.product.images?.[0] || 'https://via.placeholder.com/60x60'}
      alt={item.product.name}
      loading="lazy"
      className="w-14 h-14 md:w-16 md:h-16 object-cover rounded"
    />
    <div className="flex-grow min-w-0">
      <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">
        {item.product.name}
      </p>
      <p className="text-xs text-gray-600">
        Qty: {item.quantity} × ₹{Math.round(item.price)}
      </p>
    </div>
    <p className="text-sm font-semibold text-gray-900">
      ₹{Math.round(item.subtotal)}
    </p>
  </div>
));

OrderItem.displayName = 'OrderItem';

// Memoized Order Summary Component
const OrderSummary = memo(({
  items,
  subtotal,
  tax,
  total,
  isProcessing
}) => (
  <div className="lg:col-span-1">
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-20">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <OrderItem key={item._id} item={item} />
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="border-t pt-4 space-y-2 text-sm md:text-base">
        <div className="flex justify-between text-gray-600">
          <span>Price ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery Charges</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span>₹{tax}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-base md:text-lg font-bold text-gray-900">
          <span>Total Amount</span>
          <span>₹{total}</span>
        </div>
        <p className="text-xs md:text-sm text-green-600">
          You will save ₹{(parseFloat(subtotal) * 0.1).toFixed(0)} on this order
        </p>
      </div>

      {/* Place Order Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition ${
          isProcessing
            ? 'bg-pink-400 cursor-not-allowed'
            : 'bg-pink-600 hover:bg-pink-700'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Processing...
          </div>
        ) : (
          'Place Order'
        )}
      </button>

      {/* Security Info */}
      <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-600">
        <svg
          className="w-4 h-4 text-green-600"
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

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, fetchCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      phone: user?.phone || '',
      country: 'United States'
    }
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Memoized form validation rules
  const validationRules = useMemo(() => ({
    fullName: { required: 'Full name is required' },
    email: {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      }
    },
    phone: {
      required: 'Phone is required',
      pattern: {
        value: /^[0-9]{10}$/,
        message: 'Phone must be 10 digits'
      }
    },
    addressLine1: { required: 'Address is required' },
    city: { required: 'City is required' },
    state: { required: 'State is required' },
    zipCode: {
      required: 'PIN code is required',
      pattern: {
        value: /^[0-9]{6}$/,
        message: 'Invalid PIN code (6 digits)'
      }
    },
    country: { required: 'Country is required' }
  }), []);

  // Memoized payment options
  const paymentOptions = useMemo(() => [
    {
      value: 'card',
      label: 'Card Payment',
      icon: (
        <svg
          className="w-6 h-6 md:w-8 md:h-8 mr-3 text-pink-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      )
    },
    {
      value: 'upi',
      label: 'UPI Payment',
      icon: (
        <svg
          className="w-6 h-6 md:w-8 md:h-8 mr-3 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      )
    },
    {
      value: 'cash',
      label: 'Cash on Delivery',
      icon: (
        <svg
          className="w-6 h-6 md:w-8 md:h-8 mr-3 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      )
    }
  ], []);

  // Memoized computed values
  const subtotal = useMemo(() => total.toFixed(2), [total]);
  const tax = useMemo(() => (total * 0.1).toFixed(2), [total]);
  const totalAmount = useMemo(() => (total * 1.1).toFixed(2), [total]);

  // Memoized payment method change handler
  const handlePaymentMethodChange = useCallback((e) => {
    setPaymentMethod(e.target.value);
  }, []);

  // Memoized submit handler
  const onSubmit = useCallback(async (data) => {
    setIsProcessing(true);

    try {
      const orderData = {
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country
        },
        paymentMethod,
        paymentDetails: {
          transactionId: `TXN${Date.now()}`,
          status: 'completed'
        }
      };

      const response = await orderApi.createOrder(orderData);
      toast.success('Order placed successfully!');
      await fetchCart();
      navigate(`/orders`, { state: { orderId: response.data._id } });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  }, [paymentMethod, fetchCart, navigate]);

  // Early return if cart is empty
  if (!cart?.items || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="w-full px-4 max-w-7xl mx-auto py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  Delivery Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Full Name *"
                    name="fullName"
                    register={register}
                    errors={errors}
                    validation={validationRules.fullName}
                    className="md:col-span-2"
                    placeholder="John Doe"
                  />

                  <FormField
                    label="Email *"
                    name="email"
                    type="email"
                    register={register}
                    errors={errors}
                    validation={validationRules.email}
                    placeholder="john@example.com"
                  />

                  <FormField
                    label="Phone *"
                    name="phone"
                    type="tel"
                    register={register}
                    errors={errors}
                    validation={validationRules.phone}
                    placeholder="9876543210"
                  />

                  <FormField
                    label="Address Line 1 *"
                    name="addressLine1"
                    register={register}
                    errors={errors}
                    validation={validationRules.addressLine1}
                    className="md:col-span-2"
                    placeholder="House No., Building Name"
                  />

                  <FormField
                    label="Address Line 2 (Optional)"
                    name="addressLine2"
                    register={register}
                    errors={errors}
                    className="md:col-span-2"
                    placeholder="Road Name, Area, Colony"
                  />

                  <FormField
                    label="City *"
                    name="city"
                    register={register}
                    errors={errors}
                    validation={validationRules.city}
                    placeholder="Mumbai"
                  />

                  <FormField
                    label="State *"
                    name="state"
                    register={register}
                    errors={errors}
                    validation={validationRules.state}
                    placeholder="Maharashtra"
                  />

                  <FormField
                    label="PIN Code *"
                    name="zipCode"
                    register={register}
                    errors={errors}
                    validation={validationRules.zipCode}
                    placeholder="400001"
                  />

                  <FormField
                    label="Country *"
                    name="country"
                    register={register}
                    errors={errors}
                    validation={validationRules.country}
                    defaultValue="India"
                    placeholder="India"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Payment Method</h2>

                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <PaymentOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      icon={option.icon}
                      checked={paymentMethod === option.value}
                      onChange={handlePaymentMethodChange}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <OrderSummary
              items={cart.items}
              subtotal={subtotal}
              tax={tax}
              total={totalAmount}
              isProcessing={isProcessing}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
