import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCartWithActions } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, addressApi, paymentApi } from '../api';
import { toast } from 'react-toastify';

// ============================================================================
// Multi-Step Checkout Component
// Steps: 1. Shipping Address → 2. Payment Method → 3. Review Order → 4. Confirmation
// ============================================================================

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, fetchCart } = useCartWithActions();
  const { user } = useAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');

  // Order confirmation state
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger
  } = useForm();

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Fetch saved addresses on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Fetch saved addresses
  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await addressApi.getAddresses();
      const addresses = response.data.addresses || [];
      setSavedAddresses(addresses);

      // Auto-select default address
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0]._id);
      } else {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 404) {
        setShowAddressForm(true);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle address selection
  const handleSelectAddress = useCallback((addressId) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);
    setEditingAddress(null);
  }, []);

  // Handle add new address
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

  // Handle edit address
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

  // Handle delete address
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

  // Handle save address
  const handleSaveAddress = useCallback(async (data) => {
    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress._id, data);
        toast.success('Address updated successfully');
      } else {
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

  // Validate step and move to next
  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate address selection
      if (!selectedAddressId && !showAddressForm) {
        toast.error('Please select a delivery address');
        return;
      }
      if (showAddressForm) {
        const isValid = await trigger();
        if (!isValid) {
          toast.error('Please fill in all required address fields');
          return;
        }
        // Save address before proceeding
        await handleSubmit(async (data) => {
          await handleSaveAddress(data);
          setCurrentStep(2);
        })();
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate payment method
      if (paymentMethod === 'card') {
        if (!cardDetails.cardNumber || !cardDetails.cardholderName || !cardDetails.expiryDate || !cardDetails.cvv) {
          toast.error('Please fill in all card details');
          return;
        }
        // Basic card validation
        if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
          toast.error('Invalid card number');
          return;
        }
        if (cardDetails.cvv.length !== 3) {
          toast.error('Invalid CVV');
          return;
        }
      } else if (paymentMethod === 'upi') {
        if (!upiId || !upiId.includes('@')) {
          toast.error('Please enter a valid UPI ID');
          return;
        }
      }
      setCurrentStep(3);
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);

      // Prepare payment details based on method
      let paymentDetails = {
        method: paymentMethod,
        status: 'pending'
      };

      if (paymentMethod === 'card') {
        // Simulate card payment processing
        paymentDetails = {
          method: 'card',
          transactionId: `CARD${Date.now()}`,
          status: 'completed',
          cardLast4: cardDetails.cardNumber.slice(-4),
          cardBrand: getCardBrand(cardDetails.cardNumber)
        };
      } else if (paymentMethod === 'upi') {
        // Simulate UPI payment processing
        paymentDetails = {
          method: 'upi',
          transactionId: `UPI${Date.now()}`,
          status: 'completed',
          upiId: upiId
        };
      } else if (paymentMethod === 'cash') {
        // Cash on Delivery
        paymentDetails = {
          method: 'cash',
          transactionId: `COD${Date.now()}`,
          status: 'pending'
        };
      }

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
        paymentDetails
      };

      const response = await orderApi.createOrder(orderData);

      // Set confirmation data
      setOrderConfirmation({
        orderId: response.data._id,
        orderNumber: response.data.orderNumber,
        total: response.data.total,
        estimatedDelivery: response.data.estimatedDeliveryDate,
        paymentMethod: response.data.paymentMethod
      });

      toast.success('Order placed successfully!');
      await fetchCart(); // Clear cart
      setCurrentStep(4); // Move to confirmation step
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get card brand from number
  const getCardBrand = (cardNumber) => {
    const sanitized = cardNumber.replace(/\s/g, '');
    if (sanitized.startsWith('4')) return 'Visa';
    if (sanitized.startsWith('5')) return 'Mastercard';
    if (sanitized.startsWith('3')) return 'Amex';
    return 'Unknown';
  };

  // Handle card number input
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    value = value.substring(0, 16);
    // Add space every 4 digits
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardDetails({ ...cardDetails, cardNumber: value });
  };

  // Handle expiry date input
  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardDetails({ ...cardDetails, expiryDate: value });
  };

  // Handle CVV input
  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 3);
    setCardDetails({ ...cardDetails, cvv: value });
  };

  // Calculate totals
  const subtotal = useMemo(() => total.toFixed(2), [total]);
  const deliveryCharges = 0;
  const tax = useMemo(() => (total * 0.1).toFixed(2), [total]);
  const discount = 0;
  const totalAmount = useMemo(() => (parseFloat(total) + deliveryCharges + parseFloat(tax) - discount).toFixed(2), [total, tax]);

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
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 max-w-7xl mx-auto py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
          {currentStep !== 4 && (
            <p className="text-sm text-gray-600 mt-1">
              Complete your order in a few simple steps
            </p>
          )}
        </div>

        {/* Progress Indicator */}
        {currentStep !== 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { num: 1, label: 'Shipping' },
                { num: 2, label: 'Payment' },
                { num: 3, label: 'Review' }
              ].map((step, index) => (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                        currentStep >= step.num
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.num ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        step.num
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-700 mt-2">
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition ${
                        currentStep > step.num ? 'bg-pink-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                  {savedAddresses.length > 0 && !showAddressForm && (
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New
                    </button>
                  )}
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
                  </div>
                ) : (
                  <>
                    {/* Saved Addresses */}
                    {!showAddressForm && savedAddresses.length > 0 && (
                      <div className="space-y-4">
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
                      <AddressForm
                        register={register}
                        errors={errors}
                        validationRules={validationRules}
                        editingAddress={editingAddress}
                        savedAddresses={savedAddresses}
                        onCancel={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                          reset();
                        }}
                        onSave={handleSubmit(handleSaveAddress)}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

                <div className="space-y-4">
                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    {/* Card Payment */}
                    <label
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'card'
                          ? 'border-pink-600 bg-pink-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex items-center flex-1">
                        <svg className="w-8 h-8 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">Credit / Debit Card</span>
                      </div>
                    </label>

                    {/* Card Details Form */}
                    {paymentMethod === 'card' && (
                      <div className="ml-11 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            value={cardDetails.cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            value={cardDetails.cardholderName}
                            onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Date *
                            </label>
                            <input
                              type="text"
                              value={cardDetails.expiryDate}
                              onChange={handleExpiryDateChange}
                              placeholder="MM/YY"
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                            <input
                              type="text"
                              value={cardDetails.cvv}
                              onChange={handleCvvChange}
                              placeholder="123"
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Payment */}
                    <label
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'upi'
                          ? 'border-pink-600 bg-pink-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex items-center flex-1">
                        <svg className="w-8 h-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">UPI Payment</span>
                      </div>
                    </label>

                    {/* UPI Details Form */}
                    {paymentMethod === 'upi' && (
                      <div className="ml-11 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID *</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@upi"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    )}

                    {/* Cash on Delivery */}
                    <label
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'cash'
                          ? 'border-pink-600 bg-pink-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex items-center flex-1">
                        <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">Cash on Delivery</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Delivery Address Review */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                  {savedAddresses.find(addr => addr._id === selectedAddressId) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {(() => {
                        const addr = savedAddresses.find(addr => addr._id === selectedAddressId);
                        return (
                          <>
                            <p className="font-semibold text-gray-900">{addr.fullName}</p>
                            <p className="text-sm text-gray-700 mt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p className="text-sm text-gray-700">{addr.addressLine2}</p>}
                            <p className="text-sm text-gray-700">
                              {addr.city}, {addr.state} - {addr.zipCode}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Phone: {addr.phone}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Payment Method Review */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {paymentMethod === 'card' && (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Credit / Debit Card</p>
                          <p className="text-sm text-gray-600">
                            {getCardBrand(cardDetails.cardNumber)} ending in {cardDetails.cardNumber.slice(-4)}
                          </p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'upi' && (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">UPI Payment</p>
                          <p className="text-sm text-gray-600">{upiId}</p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'cash' && (
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Cash on Delivery</p>
                          <p className="text-sm text-gray-600">Pay when you receive the order</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Review */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item._id} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                        <img
                          src={item.product.images?.[0] || 'https://via.placeholder.com/80x80'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-grow">
                          <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ₹{Math.round(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">₹{Math.round(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Order Confirmation */}
            {currentStep === 4 && orderConfirmation && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-gray-600">Thank you for your order</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-gray-900">{orderConfirmation.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">₹{Math.round(orderConfirmation.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold text-gray-900 capitalize">{orderConfirmation.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-semibold text-gray-900">
                        {orderConfirmation.estimatedDelivery
                          ? new Date(orderConfirmation.estimatedDelivery).toLocaleDateString()
                          : '5-7 days'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/orders`)}
                    className="w-full py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
                  >
                    View Order Details
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons (for steps 1-3) */}
            {currentStep < 4 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold transition ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                {currentStep < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
                      isProcessing
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 4 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-3">
                      <img
                        src={item.product.images?.[0] || 'https://via.placeholder.com/60x60'}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × ₹{Math.round(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">₹{Math.round(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.items.length} items)</span>
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
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{totalAmount}</span>
                  </div>
                  <p className="text-sm text-green-600">
                    You will save ₹{(parseFloat(subtotal) * 0.1).toFixed(0)} on this order
                  </p>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-4 border-t flex items-center justify-center space-x-2 text-xs text-gray-600">
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
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Address Card Component
// ============================================================================

const AddressCard = ({ address, isSelected, onSelect, onEdit, onDelete, isDefault }) => (
  <div
    onClick={() => onSelect(address._id)}
    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
      isSelected ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-gray-400'
    }`}
  >
    <div className="flex items-start space-x-3">
      <input
        type="radio"
        checked={isSelected}
        onChange={() => onSelect(address._id)}
        className="mt-1 text-pink-600 focus:ring-pink-500"
      />
      <div className="flex-grow">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
          {isDefault && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
              Default
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 mb-1">
          {address.addressLine1}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-sm text-gray-700 mb-1">
          {address.city}, {address.state} - {address.zipCode}
        </p>
        <p className="text-sm text-gray-600 mb-2">{address.country}</p>
        <p className="text-sm text-gray-600">Phone: {address.phone}</p>

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
);

// ============================================================================
// Address Form Component
// ============================================================================

const AddressForm = ({ register, errors, validationRules, editingAddress, savedAddresses, onCancel, onSave }) => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Full Name */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input
          type="text"
          {...register('fullName', validationRules.fullName)}
          placeholder="John Doe"
          className={`w-full px-4 py-2.5 border ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          {...register('email', validationRules.email)}
          placeholder="john@example.com"
          className={`w-full px-4 py-2.5 border ${
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
          className={`w-full px-4 py-2.5 border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      {/* Address Line 1 */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
        <input
          type="text"
          {...register('addressLine1', validationRules.addressLine1)}
          placeholder="House No., Building Name"
          className={`w-full px-4 py-2.5 border ${
            errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
        {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>}
      </div>

      {/* Address Line 2 */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
        <input
          type="text"
          {...register('addressLine2')}
          placeholder="Road Name, Area, Colony"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
        <input
          type="text"
          {...register('city', validationRules.city)}
          placeholder="Mumbai"
          className={`w-full px-4 py-2.5 border ${
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
          className={`w-full px-4 py-2.5 border ${
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
          className={`w-full px-4 py-2.5 border ${
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
          className={`w-full px-4 py-2.5 border ${
            errors.country ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
        {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
      </div>
    </div>

    {/* Form Action Buttons */}
    <div className="flex items-center space-x-3 mt-6">
      <button
        type="button"
        onClick={onSave}
        className="px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
      >
        {editingAddress ? 'Update Address' : 'Save Address'}
      </button>
      {savedAddresses.length > 0 && (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
      )}
    </div>
  </div>
);

export default Checkout;
