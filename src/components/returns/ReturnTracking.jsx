import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import './ReturnTracking.css';

const ReturnTracking = () => {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [returnData, setReturnData] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const response = await api.return.getReturnById(returnId);
      if (response.success) {
        setReturnData(response.return);
      }
    } catch (error) {
      console.error('Error fetching return details:', error);
      alert('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const response = await api.return.cancelReturnRequest(returnId, cancelReason);
      if (response.success) {
        alert('Return request cancelled successfully');
        setShowCancelDialog(false);
        fetchReturnDetails();
      }
    } catch (error) {
      console.error('Error cancelling return:', error);
      alert('Failed to cancel return request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: '#ffc107',
      approved: '#17a2b8',
      rejected: '#dc3545',
      pickup_scheduled: '#6610f2',
      picked_up: '#20c997',
      in_transit: '#007bff',
      received: '#28a745',
      inspected: '#fd7e14',
      refund_initiated: '#e83e8c',
      refund_completed: '#28a745',
      cancelled: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="return-tracking-loading">
        <div className="spinner"></div>
        <p>Loading return details...</p>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="return-tracking-error">
        <p>Return request not found</p>
        <button onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  const canCancel = ['requested', 'approved', 'pickup_scheduled'].includes(returnData.status);

  return (
    <div className="return-tracking-container">
      <div className="return-tracking-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>← Back to Orders</button>
        <h1>Return Tracking</h1>
        <p className="return-number">Return #{returnData.returnNumber}</p>
      </div>

      <div className="return-status-banner" style={{ borderLeftColor: getStatusColor(returnData.status) }}>
        <div className="status-info">
          <h2>Status: {getStatusLabel(returnData.status)}</h2>
          <p>Submitted on {new Date(returnData.createdAt).toLocaleDateString()}</p>
        </div>
        {canCancel && (
          <button className="cancel-return-btn" onClick={() => setShowCancelDialog(true)}>
            Cancel Return
          </button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="status-timeline">
        <h3>Return Timeline</h3>
        <div className="timeline">
          {returnData.statusHistory.map((history, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot" style={{ background: getStatusColor(history.status) }}></div>
              <div className="timeline-content">
                <h4>{getStatusLabel(history.status)}</h4>
                <p className="timeline-date">{new Date(history.updatedAt).toLocaleString()}</p>
                {history.note && <p className="timeline-note">{history.note}</p>}
                {history.adminComment && <p className="admin-comment">Admin: {history.adminComment}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Items */}
      <div className="return-items-section">
        <h3>Return Items</h3>
        <div className="return-items">
          {returnData.items.map((item, index) => (
            <div key={index} className="return-item">
              <img src={item.image} alt={item.name} />
              <div className="item-info">
                <h4>{item.name}</h4>
                {item.size && <p>Size: {item.size}</p>}
                {item.color && <p>Color: {item.color}</p>}
                <p>Quantity: {item.returnQuantity}</p>
                <p className="item-price">₹{item.discountPrice || item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Reason */}
      <div className="return-reason-section">
        <h3>Return Reason</h3>
        <p className="reason-type">{getStatusLabel(returnData.reason)}</p>
        <p className="detailed-reason">{returnData.detailedReason}</p>
      </div>

      {/* Return Images */}
      {returnData.images && returnData.images.length > 0 && (
        <div className="return-images-section">
          <h3>Product Images</h3>
          <div className="return-images">
            {returnData.images.map((image, index) => (
              <img key={index} src={image} alt={`Return proof ${index + 1}`} />
            ))}
          </div>
        </div>
      )}

      {/* Pickup Details */}
      {returnData.pickupDetails && returnData.pickupDetails.scheduledDate && (
        <div className="pickup-details-section">
          <h3>Pickup Details</h3>
          <div className="pickup-info">
            <p><strong>Scheduled Date:</strong> {new Date(returnData.pickupDetails.scheduledDate).toLocaleDateString()}</p>
            {returnData.pickupDetails.scheduledTimeSlot && (
              <p><strong>Time Slot:</strong> {returnData.pickupDetails.scheduledTimeSlot}</p>
            )}
            {returnData.pickupDetails.pickupPartner && (
              <p><strong>Pickup Partner:</strong> {returnData.pickupDetails.pickupPartner}</p>
            )}
            {returnData.pickupDetails.trackingNumber && (
              <p><strong>Tracking Number:</strong> {returnData.pickupDetails.trackingNumber}</p>
            )}
          </div>
        </div>
      )}

      {/* Refund Details */}
      {returnData.refundBreakdown && (
        <div className="refund-details-section">
          <h3>Refund Details</h3>
          <div className="refund-breakdown">
            <div className="refund-row">
              <span>Items Total:</span>
              <span>₹{returnData.refundBreakdown.itemsTotal}</span>
            </div>
            {returnData.refundBreakdown.shippingRefund > 0 && (
              <div className="refund-row">
                <span>Shipping Refund:</span>
                <span>₹{returnData.refundBreakdown.shippingRefund}</span>
              </div>
            )}
            {returnData.refundBreakdown.deductions > 0 && (
              <div className="refund-row deduction">
                <span>Deductions:</span>
                <span>-₹{returnData.refundBreakdown.deductions}</span>
              </div>
            )}
            <div className="refund-row total">
              <span>Final Refund Amount:</span>
              <span>₹{returnData.refundBreakdown.finalRefundAmount}</span>
            </div>
          </div>
          <p className="refund-method">Refund Method: {getStatusLabel(returnData.refundMethod)}</p>
          {returnData.refundDetails && returnData.refundDetails.completedAt && (
            <p className="refund-completed">
              Refund completed on {new Date(returnData.refundDetails.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="modal-overlay" onClick={() => setShowCancelDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Return Request</h3>
            <p>Are you sure you want to cancel this return request?</p>
            <textarea
              placeholder="Please provide a reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows="4"
            />
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowCancelDialog(false)}>
                No, Keep It
              </button>
              <button className="danger-btn" onClick={handleCancelReturn}>
                Yes, Cancel Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnTracking;
