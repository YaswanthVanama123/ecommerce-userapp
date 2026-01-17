import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthWithActions } from '../context/AuthContext';
import { authApi, orderApi, addressApi } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateUser } = useAuthWithActions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Password change states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Orders states
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  // Address form
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    formState: { errors: addressErrors }
  } = useForm();

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === 'addresses' && addresses.length === 0) {
      fetchAddresses();
    }
  }, [activeTab]);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getMe({ skipCache: true });
      if (response.success) {
        updateUser(response.data);
        reset({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: response.data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await orderApi.getMyOrders({ skipCache: true });
      if (response.success) {
        setOrders(response.data.orders || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setIsLoadingOrderDetails(true);
    try {
      const response = await orderApi.getOrderById(orderId, { skipCache: true });
      if (response.success) {
        setSelectedOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const response = await addressApi.getAddresses({ skipCache: true });
      if (response.success) {
        setAddresses(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const onSubmitProfile = async (data) => {
    setIsUpdating(true);
    try {
      const response = await authApi.updateProfile(data);
      if (response.success) {
        updateUser(response.data);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, number and special character';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      toast.success('Password changed successfully! Please login again.');
      setShowChangePasswordModal(false);

      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowChangePasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await orderApi.cancelOrder(orderId, 'Cancelled by user');
      if (response.success) {
        toast.success('Order cancelled successfully');
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      toast.error(errorMessage);
    }
  };

  const handleTrackOrder = (orderId) => {
    toast.info('Order tracking feature coming soon!');
  };

  const onSubmitAddress = async (data) => {
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        const response = await addressApi.updateAddress(editingAddress._id, data);
        if (response.success) {
          toast.success('Address updated successfully');
          fetchAddresses();
          setShowAddressModal(false);
          setEditingAddress(null);
          resetAddress();
        }
      } else {
        const response = await addressApi.addAddress(data);
        if (response.success) {
          toast.success('Address added successfully');
          fetchAddresses();
          setShowAddressModal(false);
          resetAddress();
        }
      }
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save address';
      toast.error(errorMessage);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await addressApi.deleteAddress(addressId);
      if (response.success) {
        toast.success('Address deleted successfully');
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete address';
      toast.error(errorMessage);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await addressApi.setDefaultAddress(addressId);
      if (response.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to set default address';
      toast.error(errorMessage);
    }
  };

  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      resetAddress({
        label: address.label || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India'
      });
    } else {
      setEditingAddress(null);
      resetAddress({
        label: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
    }
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    resetAddress();
  };

  const getFilteredOrders = () => {
    if (orderFilter === 'all') return orders;
    return orders.filter(order => {
      const status = order.status?.toLowerCase();
      if (orderFilter === 'pending') return status === 'pending' || status === 'processing';
      if (orderFilter === 'delivered') return status === 'delivered';
      if (orderFilter === 'cancelled') return status === 'cancelled';
      return true;
    });
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'addresses',
      label: 'Addresses',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      {...register('firstName', {
                        required: 'First name is required'
                      })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      {...register('lastName', {
                        required: 'Last name is required'
                      })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      disabled={!isEditing}
                      {...register('phone', {
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Phone must be 10 digits'
                        }
                      })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition ${
                        isUpdating
                          ? 'bg-pink-400 cursor-not-allowed'
                          : 'bg-pink-600 hover:bg-pink-700'
                      }`}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                      }}
                      className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
                <p className="text-sm text-gray-500 mt-1">Your account information</p>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600">Member Since</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(user?.createdAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600">Account Status</dt>
                    <dd>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-600">Email Verified</dt>
                    <dd>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        );

      case 'orders':
        if (selectedOrder) {
          return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Order Details Header */}
              <div className="p-6 border-b border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex items-center text-pink-600 hover:text-pink-700 mb-4"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Orders
                </button>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h2>
                    <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.size && `Size: ${item.size}`} {item.size && item.color && '|'} {item.color && `Color: ${item.color}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.discountPrice || item.price)}</p>
                        {item.discountPrice && item.price !== item.discountPrice && (
                          <p className="text-sm text-gray-500 line-through">{formatCurrency(item.price)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Total</span>
                    <span>{formatCurrency(selectedOrder.itemsTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{formatCurrency(selectedOrder.shippingPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.taxPrice || 0)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.totalPrice || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                {selectedOrder.shippingAddress && (
                  <div className="text-gray-600">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                <p className="text-gray-600">Payment Method: {selectedOrder.paymentMethod || 'Cash on Delivery'}</p>
                {selectedOrder.isPaid && (
                  <p className="text-green-600 mt-2">Paid on {formatDate(selectedOrder.paidAt)}</p>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
              <p className="text-sm text-gray-500 mt-1">View and track your orders</p>
            </div>

            {/* Order Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    orderFilter === 'all'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    orderFilter === 'pending'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    orderFilter === 'delivered'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Delivered
                </button>
                <button
                  onClick={() => setOrderFilter('cancelled')}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    orderFilter === 'cancelled'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>

            {/* Orders List */}
            {isLoadingOrders ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : getFilteredOrders().length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
                <button
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
                >
                  Start Shopping
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {getFilteredOrders().map((order) => (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => fetchOrderDetails(order._id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {order.items?.[0]?.image && (
                            <img
                              src={order.items[0].image}
                              alt={order.items[0].name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => { e.target.src = '/placeholder.png'; }}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            <p className="text-sm text-gray-600 mt-1">{order.items?.length} item(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">{formatCurrency(order.totalPrice)}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchOrderDetails(order._id);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                        >
                          View Details
                        </button>
                        {(order.status === 'Pending' || order.status === 'pending') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order._id);
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackOrder(order._id);
                          }}
                          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium text-sm"
                        >
                          Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'addresses':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
                </div>
                <button
                  onClick={() => openAddressModal()}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium text-sm"
                >
                  Add Address
                </button>
              </div>
            </div>

            {isLoadingAddresses ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                <p className="mt-4 text-gray-600">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Addresses Saved</h3>
                <p className="text-gray-600">Add an address for faster checkout</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition relative"
                    >
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Default
                        </span>
                      )}
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900">{address.label}</h3>
                        <p className="text-sm text-gray-600 mt-2">{address.street}</p>
                        <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openAddressModal(address)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                        >
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your password and security preferences</p>
              </div>
              <div className="p-6">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-500">Update your password regularly for security</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security</p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Not Enabled</p>
                      <p className="text-sm text-gray-500">Enable 2FA for enhanced security</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info('2FA feature coming soon!')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-1">Manage your profile and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-pink-600 font-semibold text-2xl">
                      {user?.firstName?.charAt(0).toUpperCase()}
                      {user?.lastName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="p-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedOrder(null);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium mb-2 transition ${
                      activeTab === item.id
                        ? 'text-pink-600 bg-pink-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <button
                  onClick={closePasswordModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitPasswordChange}>
                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition ${
                      isChangingPassword
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={closeAddressModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitAddress(onSubmitAddress)}>
                {/* Label */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label (e.g., Home, Work)
                  </label>
                  <input
                    type="text"
                    {...registerAddress('label', { required: 'Label is required' })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      addressErrors.label ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Home"
                  />
                  {addressErrors.label && (
                    <p className="mt-1 text-sm text-red-600">{addressErrors.label.message}</p>
                  )}
                </div>

                {/* Street */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    {...registerAddress('street', { required: 'Street address is required' })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      addressErrors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123 Main Street"
                  />
                  {addressErrors.street && (
                    <p className="mt-1 text-sm text-red-600">{addressErrors.street.message}</p>
                  )}
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      {...registerAddress('city', { required: 'City is required' })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        addressErrors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mumbai"
                    />
                    {addressErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      {...registerAddress('state', { required: 'State is required' })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        addressErrors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Maharashtra"
                    />
                    {addressErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.state.message}</p>
                    )}
                  </div>
                </div>

                {/* Postal Code and Country */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      {...registerAddress('postalCode', {
                        required: 'Postal code is required',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Invalid postal code'
                        }
                      })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        addressErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="400001"
                    />
                    {addressErrors.postalCode && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.postalCode.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      {...registerAddress('country', { required: 'Country is required' })}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        addressErrors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="India"
                    />
                    {addressErrors.country && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.country.message}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition ${
                      isSavingAddress
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isSavingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
