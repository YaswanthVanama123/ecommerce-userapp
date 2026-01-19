import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import './ReturnRequest.css';

const ReturnRequest = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    reason: '',
    detailedReason: '',
    refundMethod: 'original_payment',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: ''
    }
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [pickupAddress, setPickupAddress] = useState(null);

  const returnReasons = [
    { value: 'defective', label: 'Product is defective' },
    { value: 'wrong_item', label: 'Wrong item delivered' },
    { value: 'size_issue', label: 'Size doesn\'t fit' },
    { value: 'not_as_described', label: 'Not as described' },
    { value: 'damaged', label: 'Product arrived damaged' },
    { value: 'quality_issue', label: 'Quality is not good' },
    { value: 'color_mismatch', label: 'Color doesn\'t match' },
    { value: 'missing_parts', label: 'Missing parts or accessories' },
    { value: 'other', label: 'Other reason' }
  ];

  useEffect(() => {
    fetchOrderAndEligibility();
  }, [orderId]);

  const fetchOrderAndEligibility = async () => {
    try {
      setLoading(true);
      const [orderRes, eligibilityRes] = await Promise.all([
        api.order.getOrderById(orderId),
        api.return.checkReturnEligibility(orderId)
      ]);

      if (orderRes.success) {
        setOrder(orderRes.order);
        setPickupAddress(orderRes.order.shippingAddress);
      }

      if (eligibilityRes.success) {
        if (!eligibilityRes.eligible) {
          alert(eligibilityRes.reason || 'Order is not eligible for return');
          navigate('/orders');
          return;
        }
        setEligibilityData(eligibilityRes);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemId, quantity) => {
    const existingIndex = selectedItems.findIndex(item => item.orderItemId === itemId);

    if (existingIndex >= 0) {
      if (quantity === 0) {
        setSelectedItems(selectedItems.filter(item => item.orderItemId !== itemId));
      } else {
        const updated = [...selectedItems];
        updated[existingIndex].returnQuantity = quantity;
        setSelectedItems(updated);
      }
    } else if (quantity > 0) {
      setSelectedItems([...selectedItems, { orderItemId: itemId, returnQuantity: quantity }]);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = images.length + files.length;

    if (totalImages > 5) {
      setErrors({ ...errors, images: 'Maximum 5 images allowed' });
      return;
    }

    if (totalImages < 2 && totalImages > 0) {
      setErrors({ ...errors, images: 'Minimum 2 images required' });
    } else {
      const newErrors = { ...errors };
      delete newErrors.images;
      setErrors(newErrors);
    }

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    if (newImages.length < 2 && newImages.length > 0) {
      setErrors({ ...errors, images: 'Minimum 2 images required' });
    } else {
      const newErrors = { ...errors };
      delete newErrors.images;
      setErrors(newErrors);
    }

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedItems.length === 0) {
      newErrors.items = 'Please select at least one item to return';
    }

    if (!formData.reason) {
      newErrors.reason = 'Please select a return reason';
    }

    if (!formData.detailedReason || formData.detailedReason.trim().length < 10) {
      newErrors.detailedReason = 'Please provide a detailed reason (minimum 10 characters)';
    }

    if (images.length < 2 || images.length > 5) {
      newErrors.images = 'Please upload between 2 and 5 images';
    }

    if (formData.refundMethod === 'bank_transfer') {
      if (!formData.bankDetails.accountNumber) {
        newErrors.accountNumber = 'Account number is required';
      }
      if (!formData.bankDetails.ifscCode) {
        newErrors.ifscCode = 'IFSC code is required';
      }
      if (!formData.bankDetails.accountHolderName) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
      if (!formData.bankDetails.bankName) {
        newErrors.bankName = 'Bank name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    // In a real implementation, upload images to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll simulate with base64 encoding or return URLs
    const uploadPromises = images.map(async (image) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(image);
      });
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Upload images
      const uploadedImages = await uploadImages();

      // Prepare return request data
      const returnData = {
        orderId,
        items: selectedItems,
        reason: formData.reason,
        detailedReason: formData.detailedReason,
        images: uploadedImages,
        pickupAddress,
        refundMethod: formData.refundMethod,
        bankDetails: formData.refundMethod === 'bank_transfer' ? formData.bankDetails : undefined
      };

      const response = await api.return.createReturnRequest(returnData);

      if (response.success) {
        alert('Return request submitted successfully!');
        navigate(`/returns/${response.return._id}`);
      }
    } catch (error) {
      console.error('Error submitting return request:', error);
      alert(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="return-request-loading">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order || !eligibilityData) {
    return (
      <div className="return-request-error">
        <p>Unable to load order details</p>
        <button onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="return-request-container">
      <div className="return-request-header">
        <button className="back-btn" onClick={() => navigate(`/orders/${orderId}`)}>
          ← Back
        </button>
        <h1>Return Request</h1>
        <p className="order-number">Order #{order.orderNumber}</p>
      </div>

      <div className="return-policy-banner">
        <h3>Return Policy</h3>
        <ul>
          <li>Items must be unused and in original packaging</li>
          <li>Tags and labels must be intact</li>
          <li>Return window: 7-15 days based on product category</li>
          <li>Refund will be processed within 5-7 business days after inspection</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="return-request-form">
        {/* Item Selection */}
        <div className="form-section">
          <h2>Select Items to Return</h2>
          {errors.items && <div className="error-message">{errors.items}</div>}

          <div className="items-list">
            {eligibilityData.items.map((itemEligibility) => {
              const orderItem = order.items.find(oi => oi._id === itemEligibility.itemId);
              if (!orderItem) return null;

              const selectedItem = selectedItems.find(si => si.orderItemId === itemEligibility.itemId);
              const selectedQuantity = selectedItem ? selectedItem.returnQuantity : 0;

              return (
                <div key={itemEligibility.itemId} className={`return-item ${!itemEligibility.eligible ? 'ineligible' : ''}`}>
                  <img src={orderItem.image} alt={orderItem.name} />
                  <div className="item-details">
                    <h3>{orderItem.name}</h3>
                    {orderItem.size && <p>Size: {orderItem.size}</p>}
                    {orderItem.color && <p>Color: {orderItem.color}</p>}
                    <p className="price">₹{orderItem.discountPrice || orderItem.price}</p>
                    <p>Ordered Qty: {orderItem.quantity}</p>

                    {itemEligibility.eligible ? (
                      <>
                        <p className="return-window">
                          Return window: {itemEligibility.returnWindow} days
                          (Expires: {new Date(itemEligibility.returnWindowExpiry).toLocaleDateString()})
                        </p>
                        <div className="quantity-selector">
                          <label>Return Quantity:</label>
                          <select
                            value={selectedQuantity}
                            onChange={(e) => handleItemSelection(itemEligibility.itemId, parseInt(e.target.value))}
                          >
                            <option value="0">Don't Return</option>
                            {Array.from({ length: orderItem.quantity }, (_, i) => i + 1).map(qty => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <p className="ineligibility-reason">
                        {itemEligibility.alreadyReturned ? 'Already returned' : 'Return window expired'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Reason */}
        <div className="form-section">
          <h2>Reason for Return</h2>
          {errors.reason && <div className="error-message">{errors.reason}</div>}

          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="reason-select"
          >
            <option value="">Select a reason</option>
            {returnReasons.map(reason => (
              <option key={reason.value} value={reason.value}>{reason.label}</option>
            ))}
          </select>

          {errors.detailedReason && <div className="error-message">{errors.detailedReason}</div>}
          <textarea
            placeholder="Please describe the issue in detail (minimum 10 characters)"
            value={formData.detailedReason}
            onChange={(e) => setFormData({ ...formData, detailedReason: e.target.value })}
            rows="4"
            maxLength="500"
            className="detailed-reason"
          />
          <p className="char-count">{formData.detailedReason.length}/500 characters</p>
        </div>

        {/* Image Upload */}
        <div className="form-section">
          <h2>Upload Product Images</h2>
          <p className="upload-instruction">Upload 2-5 clear images showing the product condition</p>
          {errors.images && <div className="error-message">{errors.images}</div>}

          <div className="image-upload-area">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              id="image-upload"
              disabled={images.length >= 5}
            />
            <label htmlFor="image-upload" className={images.length >= 5 ? 'disabled' : ''}>
              {images.length < 5 ? '+ Add Images' : 'Maximum images reached'}
            </label>
          </div>

          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button type="button" onClick={() => removeImage(index)} className="remove-image">
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="image-count">{images.length}/5 images uploaded</p>
        </div>

        {/* Pickup Address */}
        <div className="form-section">
          <h2>Pickup Address</h2>
          {pickupAddress && (
            <div className="pickup-address">
              <p><strong>{pickupAddress.fullName}</strong></p>
              <p>{pickupAddress.addressLine1}</p>
              {pickupAddress.addressLine2 && <p>{pickupAddress.addressLine2}</p>}
              <p>{pickupAddress.city}, {pickupAddress.state} - {pickupAddress.zipCode}</p>
              <p>Phone: {pickupAddress.phone}</p>
            </div>
          )}
          <p className="pickup-note">Our logistics partner will pick up the item from this address</p>
        </div>

        {/* Refund Method */}
        <div className="form-section">
          <h2>Refund Method</h2>

          <div className="refund-methods">
            <label className="refund-method">
              <input
                type="radio"
                value="original_payment"
                checked={formData.refundMethod === 'original_payment'}
                onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
              />
              <span>Refund to Original Payment Method</span>
            </label>

            <label className="refund-method">
              <input
                type="radio"
                value="wallet"
                checked={formData.refundMethod === 'wallet'}
                onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
              />
              <span>Refund to Wallet (Instant)</span>
            </label>

            <label className="refund-method">
              <input
                type="radio"
                value="bank_transfer"
                checked={formData.refundMethod === 'bank_transfer'}
                onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
              />
              <span>Bank Transfer (NEFT/IMPS)</span>
            </label>
          </div>

          {formData.refundMethod === 'bank_transfer' && (
            <div className="bank-details">
              <h3>Bank Account Details</h3>

              <input
                type="text"
                placeholder="Account Holder Name"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                })}
              />
              {errors.accountHolderName && <div className="error-message">{errors.accountHolderName}</div>}

              <input
                type="text"
                placeholder="Account Number"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                })}
              />
              {errors.accountNumber && <div className="error-message">{errors.accountNumber}</div>}

              <input
                type="text"
                placeholder="IFSC Code"
                value={formData.bankDetails.ifscCode}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                })}
              />
              {errors.ifscCode && <div className="error-message">{errors.ifscCode}</div>}

              <input
                type="text"
                placeholder="Bank Name"
                value={formData.bankDetails.bankName}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                })}
              />
              {errors.bankName && <div className="error-message">{errors.bankName}</div>}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(`/orders/${orderId}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting || selectedItems.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnRequest;
