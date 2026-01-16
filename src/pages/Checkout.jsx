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
  className = 'md:col-span-1'
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      {...register(name, validation)}
      defaultValue={defaultValue}
      className={`w-full px-3 py-2 border ${
        errors[name] ? 'border-red-500' : 'border-gray-300'
      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
    <input
      type="radio"
      name="paymentMethod"
      value={value}
      checked={checked}
      onChange={onChange}
      className="mr-3"
    />
    <div className="flex items-center">
      {icon}
      <span className="font-medium">{label}</span>
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
      className="w-16 h-16 object-cover rounded"
    />
    <div className="flex-grow">
      <p className="text-sm font-medium text-gray-900">
        {item.product.name}
      </p>
      <p className="text-xs text-gray-600">
        Qty: {item.quantity} x ${item.price.toFixed(2)}
      </p>
    </div>
    <p className="text-sm font-semibold text-gray-900">
      ${item.subtotal.toFixed(2)}
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
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <OrderItem key={item._id} item={item} />
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="text-green-600">Free</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span>${tax}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full mt-6 py-3 rounded-lg font-semibold text-white ${
          isProcessing
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secure checkout with SSL encryption</span>
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
      required: 'Zip code is required',
      pattern: {
        value: /^[0-9]{5,6}$/,
        message: 'Invalid zip code'
      }
    },
    country: { required: 'Country is required' }
  }), []);

  // Memoized payment options
  const paymentOptions = useMemo(() => [
    {
      value: 'card',
      label: 'Credit/Debit Card',
      icon: (
        <svg
          className="w-8 h-8 mr-3 text-blue-600"
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
      value: 'cash',
      label: 'Cash on Delivery',
      icon: (
        <svg
          className="w-8 h-8 mr-3 text-green-600"
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Shipping Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Full Name"
                  name="fullName"
                  register={register}
                  errors={errors}
                  validation={validationRules.fullName}
                  className="md:col-span-2"
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  register={register}
                  errors={errors}
                  validation={validationRules.email}
                />

                <FormField
                  label="Phone"
                  name="phone"
                  type="tel"
                  register={register}
                  errors={errors}
                  validation={validationRules.phone}
                />

                <FormField
                  label="Address Line 1"
                  name="addressLine1"
                  register={register}
                  errors={errors}
                  validation={validationRules.addressLine1}
                  className="md:col-span-2"
                />

                <FormField
                  label="Address Line 2 (Optional)"
                  name="addressLine2"
                  register={register}
                  errors={errors}
                  className="md:col-span-2"
                />

                <FormField
                  label="City"
                  name="city"
                  register={register}
                  errors={errors}
                  validation={validationRules.city}
                />

                <FormField
                  label="State"
                  name="state"
                  register={register}
                  errors={errors}
                  validation={validationRules.state}
                />

                <FormField
                  label="Zip Code"
                  name="zipCode"
                  register={register}
                  errors={errors}
                  validation={validationRules.zipCode}
                />

                <FormField
                  label="Country"
                  name="country"
                  register={register}
                  errors={errors}
                  validation={validationRules.country}
                  defaultValue="United States"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>

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
  );
};

export default Checkout;
