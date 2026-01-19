import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OrderTimeline from '../components/orders/OrderTimeline';
import { orderApi } from '../api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'details', 'items'

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrder(true);
    try {
      await orderApi.cancelOrder(id, 'Customer requested cancellation');
      toast.success('Order cancelled successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order not found</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center"
        >
          <span className="mr-2">←</span> Back to Orders
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Order Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-blue-100">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
              <div className="flex space-x-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                  Payment: {order.paymentStatus}
                </span>
              </div>
              <p className="text-2xl font-bold">${order.totalAmount?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap gap-3">
          {order.trackingNumber && (
            <a
              href={`/track/${order.trackingNumber}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Track Shipment
            </a>
          )}
          {['pending', 'confirmed', 'processing'].includes(order.orderStatus) && (
            <button
              onClick={handleCancelOrder}
              disabled={cancellingOrder}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Print Invoice
          </button>
          {order.orderStatus === 'delivered' && (
            <button
              onClick={() => navigate(`/orders/${id}/return`)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
            >
              Return Items
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'timeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'items'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order Items ({order.items?.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          {activeTab === 'timeline' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Timeline</h2>
              <OrderTimeline orderId={id} />
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0"
                  >
                    <img
                      src={item.image || item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                      alt={item.name || item.product?.name || 'Product'}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {item.name || item.product?.name || 'Product'}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.color && <span className="mx-2">|</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Price: ${item.price?.toFixed(2)} {item.discountPrice && (
                          <span className="line-through ml-2">${item.discountPrice?.toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${(item.price * item.quantity)?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-300 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Items Total:</span>
                    <span className="font-semibold">${order.itemsTotal?.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-${order.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping:</span>
                    <span className="font-semibold">
                      {order.shippingCharge === 0 ? 'FREE' : `$${order.shippingCharge?.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax:</span>
                    <span className="font-semibold">${order.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Shipping Address */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress?.fullName || `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`}
                  </p>
                  <p className="text-gray-700 mt-2">{order.shippingAddress?.addressLine1}</p>
                  {order.shippingAddress?.addressLine2 && (
                    <p className="text-gray-700">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-700">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                    {order.shippingAddress?.zipCode || order.shippingAddress?.pincode}
                  </p>
                  <p className="text-gray-700">{order.shippingAddress?.country}</p>
                  <p className="text-gray-700 mt-2">
                    Phone: {order.shippingAddress?.phone}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Payment Method:</span>
                    <span className="font-semibold text-gray-900">
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Payment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.paymentDetails?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Transaction ID:</span>
                      <span className="font-mono text-sm text-gray-900">
                        {order.paymentDetails.transactionId}
                      </span>
                    </div>
                  )}
                  {order.paymentDetails?.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Paid At:</span>
                      <span className="text-gray-900">
                        {new Date(order.paymentDetails.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              {order.trackingNumber && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Shipping Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tracking Number:</span>
                      <span className="font-mono text-sm text-blue-600 font-semibold">
                        {order.trackingNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Shipping Status:</span>
                      <span className="font-semibold text-gray-900">
                        {order.shippingStatus?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {order.deliveredAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Delivered At:</span>
                        <span className="text-gray-900">
                          {new Date(order.deliveredAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Information */}
              {order.orderStatus === 'cancelled' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Cancellation Information</h3>
                  <div className="bg-red-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Cancelled At:</span>
                      <span className="text-gray-900">
                        {new Date(order.cancelledAt).toLocaleString()}
                      </span>
                    </div>
                    {order.cancellationReason && (
                      <div>
                        <span className="text-gray-700 block mb-1">Reason:</span>
                        <p className="text-gray-900">{order.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
