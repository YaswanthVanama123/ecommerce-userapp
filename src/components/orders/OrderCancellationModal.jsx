import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const OrderCancellationModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const cancellationReasons = [
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'found_better_price', label: 'Found better price elsewhere' },
    { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
    { value: 'delivery_delay', label: 'Delivery taking too long' },
    { value: 'wrong_product', label: 'Ordered wrong product' },
    { value: 'quality_concerns', label: 'Quality concerns' },
    { value: 'other', label: 'Other reasons' }
  ];

  // Calculate time remaining for cancellation
  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      const orderTime = new Date(order.createdAt).getTime();
      const windowHours = order.cancellationWindowHours || 24;
      const deadlineTime = orderTime + windowHours * 60 * 60 * 1000;
      const now = Date.now();
      const remaining = deadlineTime - now;

      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds, expired: false });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error('Please select a cancellation reason');
      return;
    }

    if (selectedReason === 'other' && !comments.trim()) {
      toast.error('Please provide additional details for "Other" reason');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const { orderApi } = await import('../../api');

      await orderApi.requestCancellation(order._id, {
        reason: selectedReason,
        comments: comments.trim()
      });

      toast.success('Cancellation request submitted successfully! You will receive a confirmation email once it\'s processed.');
      setShowConfirm(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to submit cancellation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl mx-4">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cancel Order</h2>
              <p className="text-sm text-gray-600 mt-1">
                Order #{order?.orderNumber || order?._id?.slice(-8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {/* Cancellation Deadline Timer */}
            {timeRemaining && !timeRemaining.expired && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-semibold">
                      Time remaining to cancel:{' '}
                      <span className="font-mono text-lg">
                        {String(timeRemaining.hours).padStart(2, '0')}:
                        {String(timeRemaining.minutes).padStart(2, '0')}:
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {timeRemaining?.expired && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Cancellation window has expired. This order cannot be cancelled.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Cancellation Reasons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {cancellationReasons.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedReason === reason.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting || timeRemaining?.expired}
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Comments */}
              <div className="mb-6">
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments {selectedReason === 'other' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please provide any additional details about why you're cancelling this order..."
                  disabled={isSubmitting || timeRemaining?.expired}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comments.length}/500 characters
                </p>
              </div>

              {/* Refund Information */}
              {order?.paymentStatus === 'completed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Refund Information</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <span className="font-medium">Refund Amount:</span> ₹{order.totalAmount?.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Refund Method:</span> Original Payment Method
                    </p>
                    <p>
                      <span className="font-medium">Processing Time:</span> 5-7 business days after approval
                    </p>
                  </div>
                </div>
              )}

              {/* Important Note */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Important Notes:</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Your cancellation request will be reviewed by our team</li>
                  <li>You will receive a confirmation email once processed</li>
                  <li>The order will be automatically cancelled if not approved within 24 hours</li>
                  {order?.paymentStatus === 'completed' && (
                    <li>Refund will be initiated once the cancellation is approved</li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || timeRemaining?.expired || !selectedReason}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Cancel Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Confirm Order Cancellation
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to cancel this order? This action will submit a cancellation request to our team for review.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCancellationModal;
