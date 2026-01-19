import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { returnApi, orderApi } from '../api';
import { useAuthWithActions } from '../context/AuthContext';

const Returns = () => {
  const navigate = useNavigate();
  const { user } = useAuthWithActions();
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    items: [],
    type: 'refund',
    reason: '',
    description: '',
    preferredResolution: 'refund'
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchOrders();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await returnApi.getUserReturns({ skipCache: true });
      console.log('[Returns] API Response:', response); // Debug log
      if (response.success) {
        // API returns response.data which contains { success, returns, pagination }
        // So we access response.returns directly, not response.data.returns
        setReturns(response.returns || []);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getMyOrders({ skipCache: true });
      console.log('[Returns] Orders Response:', response); // Debug log
      if (response.success) {
        // API returns response.data which contains { success, orders, pagination }
        // Filter only delivered orders that can be returned
        const eligibleOrders = (response.orders || []).filter(
          order => order.status?.toLowerCase() === 'delivered'
        );
        setOrders(eligibleOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();

    if (!formData.orderId) {
      toast.error('Please select an order');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!formData.reason) {
      toast.error('Please provide a reason for return');
      return;
    }

    setIsSubmitting(true);
    try {
      const returnData = {
        order: formData.orderId,
        items: formData.items,
        type: formData.type,
        reason: formData.reason,
        description: formData.description,
        preferredResolution: formData.preferredResolution
      };

      const response = await returnApi.createReturnRequest(returnData);
      if (response.success) {
        toast.success('Return request created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchReturns();
      }
    } catch (error) {
      console.error('Error creating return:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create return request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReturn = async (returnId) => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) {
      return;
    }

    try {
      const response = await returnApi.cancelReturnRequest(returnId, 'Cancelled by user');
      if (response.success) {
        toast.success('Return request cancelled successfully');
        fetchReturns();
      }
    } catch (error) {
      console.error('Error cancelling return:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel return';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      items: [],
      type: 'refund',
      reason: '',
      description: '',
      preferredResolution: 'refund'
    });
    setSelectedOrder(null);
  };

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    const order = orders.find(o => o._id === orderId);
    setSelectedOrder(order);
    setFormData({ ...formData, orderId, items: [] });
  };

  const handleItemToggle = (item) => {
    const isSelected = formData.items.some(i => i.product === item.product?._id);

    if (isSelected) {
      setFormData({
        ...formData,
        items: formData.items.filter(i => i.product !== item.product?._id)
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            product: item.product?._id,
            name: item.product?.name || item.name,
            quantity: item.quantity,
            price: item.price
          }
        ]
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-200',
      received: 'bg-purple-100 text-purple-800 border-purple-200',
      inspected: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      refund_initiated: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      refund_completed: 'bg-green-100 text-green-800 border-green-200',
      exchange_initiated: 'bg-orange-100 text-orange-800 border-orange-200',
      exchange_completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.cancelled;
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

  const getFilteredReturns = () => {
    if (activeTab === 'all') return returns;
    return returns.filter(ret => {
      if (activeTab === 'pending') return ret.status === 'pending';
      if (activeTab === 'approved') return ret.status === 'approved' || ret.status === 'picked_up' || ret.status === 'received';
      if (activeTab === 'completed') return ret.status === 'refund_completed' || ret.status === 'exchange_completed';
      if (activeTab === 'cancelled') return ret.status === 'cancelled' || ret.status === 'rejected';
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Returns & Exchanges</h1>
              <p className="text-gray-600 mt-2">Manage your return and exchange requests</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Return Request
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { id: 'all', label: 'All Returns' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Returns List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
              <p className="text-gray-600">Loading returns...</p>
            </div>
          </div>
        ) : getFilteredReturns().length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No returns found</h3>
            <p className="text-gray-600 mb-6">You haven't created any return requests yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
            >
              Create Return Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredReturns().map((returnItem) => (
              <div key={returnItem._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Return #{returnItem.returnNumber || returnItem._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(returnItem.status)}`}>
                        {returnItem.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        returnItem.type === 'refund' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {returnItem.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Order: <span className="font-medium">#{returnItem.order?.orderNumber || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested on: {formatDate(returnItem.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Refund Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(returnItem.refundAmount || 0)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                  <div className="flex flex-wrap gap-2">
                    {returnItem.items?.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                        {item.name || item.product?.name || 'Item'} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                {returnItem.reason && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-sm text-gray-600 mt-1">{returnItem.reason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedReturn(returnItem)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                  >
                    View Details
                  </button>
                  {returnItem.status === 'pending' && (
                    <button
                      onClick={() => handleCancelReturn(returnItem._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Return Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Return Request</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateReturn}>
                {/* Select Order */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.orderId}
                    onChange={handleOrderSelect}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Choose an order...</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        #{order.orderNumber} - {formatDate(order.createdAt)} - {formatCurrency(order.totalPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Items */}
                {selectedOrder && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Items <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {selectedOrder.items?.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={formData.items.some(i => i.product === item.product?._id)}
                            onChange={() => handleItemToggle(item)}
                            className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product?.name || item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-300">
                      <input
                        type="radio"
                        value="refund"
                        checked={formData.type === 'refund'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-4 h-4 text-pink-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Refund</p>
                        <p className="text-sm text-gray-600">Get money back</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-300">
                      <input
                        type="radio"
                        value="exchange"
                        checked={formData.type === 'exchange'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-4 h-4 text-pink-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Exchange</p>
                        <p className="text-sm text-gray-600">Replace with another item</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Return <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="defective">Defective Product</option>
                    <option value="wrong_item">Wrong Item Received</option>
                    <option value="not_as_described">Not as Described</option>
                    <option value="size_issue">Size Issue</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="changed_mind">Changed Mind</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Provide additional details about your return..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition ${
                      isSubmitting
                        ? 'bg-pink-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Return Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Return Details Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Return Details</h3>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Return #{selectedReturn.returnNumber || selectedReturn._id.slice(-8).toUpperCase()}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedReturn.status)}`}>
                      {selectedReturn.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Order Number</p>
                      <p className="font-medium text-gray-900">#{selectedReturn.order?.orderNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Return Type</p>
                      <p className="font-medium text-gray-900">{selectedReturn.type.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Requested On</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedReturn.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Refund Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedReturn.refundAmount || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Returned Items</h4>
                  <div className="space-y-2">
                    {selectedReturn.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name || item.product?.name || 'Item'}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason & Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Return Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason</p>
                      <p className="text-gray-900">{selectedReturn.reason}</p>
                    </div>
                    {selectedReturn.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Additional Details</p>
                        <p className="text-gray-900">{selectedReturn.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedReturn.adminNotes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes</p>
                    <p className="text-blue-800">{selectedReturn.adminNotes}</p>
                  </div>
                )}

                {/* Timeline */}
                {selectedReturn.timeline && selectedReturn.timeline.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Status Timeline</h4>
                    <div className="space-y-3">
                      {selectedReturn.timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-pink-600 rounded-full"></div>
                            {idx < selectedReturn.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-pink-200 mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-gray-900">{event.status.replace(/_/g, ' ').toUpperCase()}</p>
                            <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                            {event.note && <p className="text-sm text-gray-700 mt-1">{event.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Returns;
