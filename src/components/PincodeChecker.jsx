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
 *   - className (string): Additional CSS classes for the container
 */
const PincodeChecker = memo(({ productId, onDeliveryCheck, showCOD = true, className = '' }) => {
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
        setResult({
          available: response.deliveryAvailable,
          estimatedDelivery: response.estimatedDeliveryDate,
          codAvailable: response.codAvailable,
          message: response.message,
          deliveryCharge: response.deliveryCharge
        });

        // Call callback if provided
        if (onDeliveryCheck) {
          onDeliveryCheck({
            pincode,
            available: response.deliveryAvailable,
            estimatedDelivery: response.estimatedDeliveryDate,
            codAvailable: response.codAvailable
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
    <div className={`bg-white rounded-lg border border-gray-200 p-4 md:p-6 ${className}`}>
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Check Delivery
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter your PIN code to check delivery availability
      </p>

      {/* Input Section */}
      <div className="space-y-3">
        {/* Pincode Input */}
        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
            PIN Code
          </label>
          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            maxLength="6"
            value={pincode}
            onChange={handlePincodeChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter 6-digit PIN code"
            disabled={loading}
            className={`w-full px-4 py-2 border rounded-lg text-center text-lg tracking-widest font-semibold transition-all ${
              error && !result
                ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none'
                : 'border-gray-300 focus:ring-2 focus:ring-pink-200 focus:outline-none'
            } ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            aria-label="PIN code input"
            aria-invalid={error && !result ? 'true' : 'false'}
          />
          {/* Character count indicator */}
          <p className="text-xs text-gray-500 mt-1">
            {pincode.length}/6 digits
          </p>
        </div>

        {/* Error Message */}
        {error && !result && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Check Delivery Button */}
        <button
          onClick={handleCheckDelivery}
          disabled={loading || pincode.length !== 6}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            loading || pincode.length !== 6
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
          }`}
          aria-busy={loading}
        >
          {loading && <Spinner size="small" color="white" />}
          <span>{loading ? 'Checking...' : 'Check Delivery'}</span>
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          {/* Availability Status */}
          <div
            className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
              result.available
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {result.available ? (
              <svg
                className="w-6 h-6 text-green-600 flex-shrink-0"
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
                className="w-6 h-6 text-red-600 flex-shrink-0"
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
            <div>
              <p
                className={`font-semibold ${
                  result.available ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.available ? 'Available' : 'Not Available'}
              </p>
              {result.message && (
                <p
                  className={`text-sm ${
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
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Estimated Delivery</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatDate(result.estimatedDelivery)}
              </p>
            </div>
          )}

          {/* Delivery Charge */}
          {result.available && result.deliveryCharge !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Delivery Charge</p>
              <p className="text-lg font-semibold text-gray-900">
                {result.deliveryCharge === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `₹${result.deliveryCharge}`
                )}
              </p>
            </div>
          )}

          {/* COD Availability */}
          {showCOD && result.available && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-3">
              {result.codAvailable ? (
                <>
                  <svg
                    className="w-5 h-5 text-purple-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Cash on Delivery Available
                    </p>
                    <p className="text-xs text-purple-700">
                      You can pay when item is delivered
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 112.5 8a.75.75 0 001.503.131 4.5 4.5 0 1110.5 3.747L12.419 9.53a.75.75 0 00-1.06 1.061l3.852 3.868a.75.75 0 001.062-1.06l-.841-.84z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Cash on Delivery Not Available
                    </p>
                    <p className="text-xs text-gray-600">
                      Prepayment required for this area
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Check Again Button */}
          <button
            onClick={() => {
              setPincode('');
              setResult(null);
              setError('');
            }}
            className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Check Another PIN Code
          </button>
        </div>
      )}
    </div>
  );
});

PincodeChecker.displayName = 'PincodeChecker';

export default PincodeChecker;
