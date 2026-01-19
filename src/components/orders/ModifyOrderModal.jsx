import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { orderApi } from '../../api';

const ModifyOrderModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('address');
  const [modificationData, setModificationData] = useState({
    shippingAddress: null,
    quantityChanges: {},
    itemsToRemove: [],
    note: ''
  });
  const [calculatedTotal, setCalculatedTotal] = useState(order?.totalAmount || 0);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (order && isOpen) {
      // Calculate time left for modifications
      const deadline = new Date(order.modificationDeadline);
      const now = new Date();
      const diff = deadline - now;

      if (diff > 0) {
        setTimeLeft(Math.floor(diff / 1000)); // seconds
        const timer = setInterval(() => {
          const newDiff = deadline - new Date();
          if (newDiff <= 0) {
            setTimeLeft(0);
            clearInterval(timer);
            toast.warning('Modification deadline has passed');
            onClose();
          } else {
            setTimeLeft(Math.floor(newDiff / 1000));
          }
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setTimeLeft(0);
        toast.error('Modification deadline has passed');
        onClose();
      }
    }
  }, [order, isOpen, onClose]);

  useEffect(() => {
    if (order) {
      calculateNewTotal();
    }
  }, [modificationData, order]);

  const calculateNewTotal = () => {
    if (!order) return;

    let newItemsTotal = 0;

    // Calculate with quantity changes and removed items
    order.items.forEach(item => {
      if (modificationData.itemsToRemove.includes(item._id)) return;

      const quantity = modificationData.quantityChanges[item._id] || item.quantity;
      const price = item.discountPrice || item.price;
      newItemsTotal += price * quantity;
    });

    const newShippingCharge = newItemsTotal > 500 ? 0 : 50;
    const newTax = Math.round(newItemsTotal * 0.18);
    const newTotal = newItemsTotal + newShippingCharge + newTax;

    setCalculatedTotal(newTotal);
  };

  const handleAddressChange = (field, value) => {
    setModificationData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value
      }
    }));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setModificationData(prev => ({
      ...prev,
      quantityChanges: {
        ...prev.quantityChanges,
        [itemId]: newQuantity
      }
    }));
  };

  const handleRemoveItem = (itemId) => {
    setModificationData(prev => ({
      ...prev,
      itemsToRemove: prev.itemsToRemove.includes(itemId)
        ? prev.itemsToRemove.filter(id => id !== itemId)
        : [...prev.itemsToRemove, itemId]
    }));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Prepare modification data
      const payload = {};

      // Add shipping address if changed
      if (modificationData.shippingAddress && Object.keys(modificationData.shippingAddress).length > 0) {
        payload.shippingAddress = modificationData.shippingAddress;
      }

      // Add quantity changes
      if (Object.keys(modificationData.quantityChanges).length > 0) {
        payload.quantityChanges = modificationData.quantityChanges;
      }

      // Add items to remove
      if (modificationData.itemsToRemove.length > 0) {
        payload.itemsToRemove = modificationData.itemsToRemove;
      }

      // Add note
      if (modificationData.note.trim()) {
        payload.note = modificationData.note;
      }

      // Check if any changes were made
      if (Object.keys(payload).length === 0 || (Object.keys(payload).length === 1 && payload.note)) {
        toast.info('No changes to save');
        return;
      }

      // Check minimum order value
      if (calculatedTotal < 100) {
        toast.error('Order total must be at least ₹100');
        return;
      }

      const response = await orderApi.modifyOrder(order._id, payload);

      toast.success(response.message || 'Order modified successfully');

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (error) {
      console.error('Error modifying order:', error);
      toast.error(error.response?.data?.message || 'Failed to modify order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const priceDifference = calculatedTotal - order.totalAmount;
  const canModify = order.canModify && order.orderStatus !== 'processing' && order.orderStatus !== 'shipped';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Modify Order #{order.orderNumber}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {timeLeft !== null && (
              <div className="mt-2 text-white text-sm">
                <span className="font-medium">Time remaining: </span>
                <span className={`font-bold ${timeLeft < 600 ? 'text-yellow-300' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {!canModify && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    This order cannot be modified. Modifications are only allowed for pending and confirmed orders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {canModify && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: 'address', label: 'Shipping Address', icon: '📍' },
                    { id: 'items', label: 'Order Items', icon: '🛍️' },
                    { id: 'summary', label: 'Summary', icon: '📊' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {/* Address Tab */}
                {activeTab === 'address' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Address</h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.fullName}<br />
                        {order.shippingAddress.addressLine1}<br />
                        {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                        Phone: {order.shippingAddress.phone}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.fullName}
                          onChange={(e) => handleAddressChange('fullName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder={order.shippingAddress.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.addressLine1}
                          onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.addressLine2 || 'Optional'}
                          onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          placeholder={order.shippingAddress.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Tab */}
                {activeTab === 'items' && (
                  <div className="space-y-4">
                    {order.items.map(item => {
                      const isRemoving = modificationData.itemsToRemove.includes(item._id);
                      const currentQuantity = modificationData.quantityChanges[item._id] || item.quantity;

                      return (
                        <div
                          key={item._id}
                          className={`flex items-center gap-4 p-4 border rounded-lg ${
                            isRemoving ? 'bg-red-50 border-red-200' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={item.image || 'https://via.placeholder.com/80'}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                            </p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              ₹{(item.discountPrice || item.price).toFixed(2)} each
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item._id, currentQuantity - 1)}
                              disabled={isRemoving || currentQuantity <= 1}
                              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">{currentQuantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item._id, currentQuantity + 1)}
                              disabled={isRemoving}
                              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className={`px-4 py-2 rounded font-medium transition ${
                              isRemoving
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {isRemoving ? 'Undo' : 'Remove'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Original Total:</span>
                        <span className="font-medium">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">New Total:</span>
                        <span className="font-medium">₹{calculatedTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Difference:</span>
                        <span className={`font-semibold ${priceDifference >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {priceDifference >= 0 ? '+' : ''}₹{priceDifference.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {priceDifference > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Payment Required:</strong> You will need to pay an additional ₹{priceDifference.toFixed(2)}.
                        </p>
                      </div>
                    )}

                    {priceDifference < 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          <strong>Refund:</strong> ₹{Math.abs(priceDifference).toFixed(2)} will be refunded to your original payment method.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note (Optional)
                      </label>
                      <textarea
                        value={modificationData.note}
                        onChange={(e) => setModificationData(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Add any additional notes about this modification..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModifyOrderModal;
