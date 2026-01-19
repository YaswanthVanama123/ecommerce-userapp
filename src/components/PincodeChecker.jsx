import React, { useState, memo } from 'react';
import { pincodeApi } from '../api';
import { Spinner } from './common/Loading';

/**
 * PincodeChecker Component
 *
 * A reusable component for checking product delivery availability by pincode.
 * Displays delivery status, estimated delivery date, and COD availability.
 *
 * Props:
 *   - productId (string): The product ID to check delivery for (required)
 *   - onDeliveryCheck (function): Callback when delivery check is completed
 *   - showCOD (boolean): Whether to show COD availability (default: true)
 *   - compact (boolean): Whether to use compact mode (default: false)
 *   - className (string): Additional CSS classes for the container
 */
const PincodeChecker = memo(({ productId, onDeliveryCheck, showCOD = true, compact = false, className = '' }) => {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Validate pincode format
  const validatePincode = (value) => {
    // Remove non-digit characters
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length > 6) {
      return cleaned.slice(0, 6);
    }
    return cleaned;
  };

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value;
    const validated = validatePincode(value);
    setPincode(validated);
    setError('');
    setResult(null);
  };

  // Handle delivery check button click
  const handleCheckDelivery = async () => {
    // Validate input
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    if (!productId) {
      setError('Product ID is missing');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await pincodeApi.checkProductDelivery(pincode, productId);

      if (response.success) {
        // Extract data from response - API returns deliverable, not deliveryAvailable
        const deliveryData = response.data || response;

        setResult({
          available: response.deliverable || deliveryData.deliverable,
          estimatedDelivery: deliveryData.estimatedDelivery?.minDate || response.estimatedDeliveryDate,
          codAvailable: deliveryData.codAvailable || response.codAvailable,
          message: response.message,
          deliveryCharge: response.deliveryCharge
        });

        // Call callback if provided
        if (onDeliveryCheck) {
          onDeliveryCheck({
            pincode,
            available: response.deliverable || deliveryData.deliverable,
            estimatedDelivery: deliveryData.estimatedDelivery?.minDate || response.estimatedDeliveryDate,
            codAvailable: deliveryData.codAvailable || response.codAvailable
          });
        }
      } else {
        setError(response.message || 'Unable to check delivery for this pincode');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          'Failed to check delivery. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && pincode.length === 6) {
      handleCheckDelivery();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={compact ? className : `bg-white rounded-lg border border-gray-200 p-4 md:p-6 ${className}`}>
      {/* Header */}
      {!compact && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Check Delivery
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your PIN code to check delivery availability
          </p>
        </>
      )}

      {compact && (
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          Delivery
        </h3>
      )}

      {/* Input Section */}
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {/* Pincode Input */}
        <div className="flex gap-2">
          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            maxLength="6"
            value={pincode}
            onChange={handlePincodeChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter PIN code"
            disabled={loading}
            className={`flex-1 px-3 border rounded-md text-center tracking-wide font-medium transition-all ${
              compact ? 'py-1.5 text-sm' : 'py-2 text-base'
            } ${
              error && !result
                ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none'
                : 'border-gray-300 focus:ring-2 focus:ring-pink-200 focus:outline-none'
            } ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            aria-label="PIN code input"
            aria-invalid={error && !result ? 'true' : 'false'}
          />

          <button
            onClick={handleCheckDelivery}
            disabled={loading || pincode.length !== 6}
            className={`rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
              compact ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm'
            } ${
              loading || pincode.length !== 6
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
            }`}
            aria-busy={loading}
          >
            {loading && <Spinner size="small" color="white" />}
            <span>Check</span>
          </button>
        </div>

        {/* Error Message */}
        {error && !result && (
          <div className={`p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            <svg
              className={`text-red-600 flex-shrink-0 ${compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div className={`${compact ? 'mt-3 pt-3' : 'mt-6 pt-6'} border-t border-gray-200 space-y-2`}>
          {/* Availability Status */}
          <div
            className={`${compact ? 'p-2' : 'p-3'} rounded-md border flex items-center gap-2 ${
              result.available
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {result.available ? (
              <svg
                className={`text-green-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className={`text-red-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
                  result.available ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.available ? 'Available' : 'Not Available'}
              </p>
              {result.message && (
                <p
                  className={`${compact ? 'text-xs' : 'text-sm'} ${
                    result.available ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {result.message}
                </p>
              )}
            </div>
          </div>

          {/* Estimated Delivery Date */}
          {result.available && result.estimatedDelivery && (
            <div className={`${compact ? 'p-2 text-xs' : 'p-3 text-sm'} bg-blue-50 rounded-md border border-blue-200`}>
              <span className="text-gray-600">Delivery: </span>
              <span className="font-semibold text-blue-900">
                {formatDate(result.estimatedDelivery)}
              </span>
            </div>
          )}

          {/* COD Availability */}
          {showCOD && result.available && (
            <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 flex items-center gap-1.5`}>
              {result.codAvailable ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 font-medium">COD Available</span>
                </>
              ) : (
                <span className="text-gray-500">COD not available</span>
              )}
            </div>
          )}

          {/* Check Again Button - Only show in non-compact mode */}
          {!compact && (
            <button
              onClick={() => {
                setPincode('');
                setResult(null);
                setError('');
              }}
              className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm mt-2"
            >
              Check Another PIN Code
            </button>
          )}
        </div>
      )}
    </div>
  );
});

PincodeChecker.displayName = 'PincodeChecker';

export default PincodeChecker;
