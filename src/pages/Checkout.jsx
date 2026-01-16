import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCartWithActions } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, addressApi } from '../api';
import { toast } from 'react-toastify';

// Memoized Address Card Component
const AddressCard = memo(({ address, isSelected, onSelect, onEdit, onDelete, isDefault }) => (
  <div
    onClick={() => onSelect(address._id)}
    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
      isSelected
        ? 'border-pink-600 bg-pink-50'
        : 'border-gray-300 hover:border-gray-400'
    }`}
  >
    {/* Radio Button */}
    <div className="flex items-start space-x-3">
      <input
        type="radio"
        checked={isSelected}
        onChange={() => onSelect(address._id)}
        className="mt-1 text-pink-600 focus:ring-pink-500"
      />
      <div className="flex-grow">
        {/* Name and Default Badge */}
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
          {isDefault && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
              Default
            </span>
          )}
        </div>

        {/* Address Details */}
        <p className="text-sm text-gray-700 mb-1">
          {address.addressLine1}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-sm text-gray-700 mb-1">
          {address.city}, {address.state} - {address.zipCode}
        </p>
        <p className="text-sm text-gray-600 mb-2">{address.country}</p>
        <p className="text-sm text-gray-600">Phone: {address.phone}</p>

        {/* Action Buttons */}
        {isSelected && (
          <div className="flex items-center space-x-4 mt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              Edit
            </button>
            {!isDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(address._id);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
));

AddressCard.displayName = 'AddressCard';

// Memoized Payment Method Option
const PaymentOption = memo(({ value, label, icon, checked, onChange }) => (
  <label
    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
      checked ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:bg-gray-50'
    }`}
  >
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
    <p className="text-sm font-semibold text-gray-900">₹{Math.round(item.subtotal)}</p>
  </div>
));

OrderItem.displayName = 'OrderItem';

// Memoized Order Summary Component
const OrderSummary = memo(({ items, subtotal, tax, total, isProcessing }) => (
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
        form="checkout-form"
        disabled={isProcessing}
        className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition ${
          isProcessing ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
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
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const { cart, total, fetchCart } = useCartWithActions();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Address management state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Fetch saved addresses on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await addressApi.getAddresses();
      const addresses = response.data.addresses || [];
      setSavedAddresses(addresses);

      // Auto-select default address if exists
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0]._id);
      } else {
        // No saved addresses, show form
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 404) {
        // No addresses found, show form
        setShowAddressForm(true);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSelectAddress = useCallback((addressId) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);
    setEditingAddress(null);
  }, []);

  const handleAddNewAddress = useCallback(() => {
    setShowAddressForm(true);
    setEditingAddress(null);
    reset({
      fullName: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      phone: user?.phone || '',
      country: 'India'
    });
  }, [user, reset]);

  const handleEditAddress = useCallback((address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
    setValue('fullName', address.fullName);
    setValue('email', address.email || user?.email);
    setValue('phone', address.phone);
    setValue('addressLine1', address.addressLine1);
    setValue('addressLine2', address.addressLine2 || '');
    setValue('city', address.city);
    setValue('state', address.state);
    setValue('zipCode', address.zipCode);
    setValue('country', address.country);
  }, [setValue, user]);

  const handleDeleteAddress = useCallback(async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await addressApi.deleteAddress(addressId);
      toast.success('Address deleted successfully');
      await fetchSavedAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  }, []);

  const handleSaveAddress = useCallback(async (data) => {
    try {
      if (editingAddress) {
        // Update existing address
        await addressApi.updateAddress(editingAddress._id, data);
        toast.success('Address updated successfully');
      } else {
        // Add new address
        const response = await addressApi.addAddress(data);
        toast.success('Address added successfully');
        setSelectedAddressId(response.data.address._id);
      }

      await fetchSavedAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      reset();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  }, [editingAddress, reset]);

  const handlePaymentMethodChange = useCallback((e) => {
    setPaymentMethod(e.target.value);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);

      const orderData = {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country
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
  }, [selectedAddressId, savedAddresses, paymentMethod, fetchCart, navigate]);

  // Payment options
  const paymentOptions = useMemo(
    () => [
      {
        value: 'card',
        label: 'Card Payment',
        icon: (
          <svg className="w-6 h-6 md:w-8 md:h-8 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-6 h-6 md:w-8 md:h-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-6 h-6 md:w-8 md:h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )
      }
    ],
    []
  );

  // Computed values
  const subtotal = useMemo(() => total.toFixed(2), [total]);
  const tax = useMemo(() => (total * 0.1).toFixed(2), [total]);
  const totalAmount = useMemo(() => (total * 1.1).toFixed(2), [total]);

  // Validation rules
  const validationRules = useMemo(
    () => ({
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
    }),
    []
  );

  // Early return if cart is empty
  if (!cart?.items || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="w-full px-4 max-w-7xl mx-auto py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Delivery Address Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Delivery Address</h2>
                  {savedAddresses.length > 0 && !showAddressForm && (
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="text-sm font-medium text-pink-600 hover:text-pink-700"
                    >
                      + Add New
                    </button>
                  )}
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
                  </div>
                ) : (
                  <>
                    {/* Saved Addresses */}
                    {!showAddressForm && savedAddresses.length > 0 && (
                      <div className="space-y-3">
                        {savedAddresses.map((address) => (
                          <AddressCard
                            key={address._id}
                            address={address}
                            isSelected={selectedAddressId === address._id}
                            onSelect={handleSelectAddress}
                            onEdit={handleEditAddress}
                            onDelete={handleDeleteAddress}
                            isDefault={address.isDefault}
                          />
                        ))}
                      </div>
                    )}

                    {/* Address Form */}
                    {showAddressForm && (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Full Name */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              {...register('fullName', validationRules.fullName)}
                              placeholder="John Doe"
                              className={`w-full px-3 py-2.5 border ${
                                errors.fullName ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.fullName && (
                              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              {...register('email', validationRules.email)}
                              placeholder="john@example.com"
                              className={`w-full px-3 py-2.5 border ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                              type="tel"
                              {...register('phone', validationRules.phone)}
                              placeholder="9876543210"
                              className={`w-full px-3 py-2.5 border ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                          </div>

                          {/* Address Line 1 */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              {...register('addressLine1', validationRules.addressLine1)}
                              placeholder="House No., Building Name"
                              className={`w-full px-3 py-2.5 border ${
                                errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.addressLine1 && (
                              <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>
                            )}
                          </div>

                          {/* Address Line 2 */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              {...register('addressLine2')}
                              placeholder="Road Name, Area, Colony"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>

                          {/* City */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input
                              type="text"
                              {...register('city', validationRules.city)}
                              placeholder="Mumbai"
                              className={`w-full px-3 py-2.5 border ${
                                errors.city ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
                          </div>

                          {/* State */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <input
                              type="text"
                              {...register('state', validationRules.state)}
                              placeholder="Maharashtra"
                              className={`w-full px-3 py-2.5 border ${
                                errors.state ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
                          </div>

                          {/* PIN Code */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                            <input
                              type="text"
                              {...register('zipCode', validationRules.zipCode)}
                              placeholder="400001"
                              className={`w-full px-3 py-2.5 border ${
                                errors.zipCode ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
                          </div>

                          {/* Country */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                            <input
                              type="text"
                              {...register('country', validationRules.country)}
                              defaultValue="India"
                              placeholder="India"
                              className={`w-full px-3 py-2.5 border ${
                                errors.country ? 'border-red-500' : 'border-gray-300'
                              } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                            />
                            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
                          </div>
                        </div>

                        {/* Form Action Buttons */}
                        <div className="flex items-center space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={handleSubmit(handleSaveAddress)}
                            className="px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
                          >
                            {editingAddress ? 'Update Address' : 'Save Address'}
                          </button>
                          {savedAddresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                reset();
                              }}
                              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
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
