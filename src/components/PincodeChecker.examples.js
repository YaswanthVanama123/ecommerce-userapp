/**
 * PincodeChecker Component - Usage Examples
 *
 * This file demonstrates how to use the PincodeChecker component
 * in your product detail pages and other parts of the application.
 */

// ============================================================================
// Example 1: Basic Usage on Product Detail Page
// ============================================================================

import React, { useState } from 'react';
import PincodeChecker from '../components/PincodeChecker';

function ProductDetailPage({ productId }) {
  const handleDeliveryCheck = (deliveryInfo) => {
    console.log('Delivery checked for:', deliveryInfo);
    // You can store this info in context, state, or pass it to a parent component
  };

  return (
    <div className="product-detail-container">
      <h1>Product Details</h1>

      {/* Pincode Checker Component */}
      <PincodeChecker
        productId={productId}
        onDeliveryCheck={handleDeliveryCheck}
      />
    </div>
  );
}

// ============================================================================
// Example 2: With Custom Styling
// ============================================================================

import PincodeChecker from '../components/PincodeChecker';

function ProductPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Product image and details */}
      <div className="md:col-span-2">
        {/* ... product content ... */}
      </div>

      {/* Sidebar with Pincode Checker */}
      <div className="md:col-span-1">
        <PincodeChecker
          productId="product-123"
          className="sticky top-4"
          showCOD={true}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Without COD Display
// ============================================================================

import PincodeChecker from '../components/PincodeChecker';

function CheckoutPage({ productId }) {
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  return (
    <div>
      <PincodeChecker
        productId={productId}
        showCOD={false}  // Hide COD information if not relevant
        onDeliveryCheck={setDeliveryInfo}
      />

      {deliveryInfo && (
        <div className="mt-4">
          <p>Selected PIN: {deliveryInfo.pincode}</p>
          <p>Delivery Available: {deliveryInfo.available ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: In a Modal or Dialog
// ============================================================================

import React, { useState } from 'react';
import PincodeChecker from '../components/PincodeChecker';

function ProductCardWithModal({ product }) {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  return (
    <>
      <div className="product-card">
        {/* Product info */}
        <button
          onClick={() => setShowDeliveryModal(true)}
          className="text-blue-600 hover:underline"
        >
          Check Delivery
        </button>
      </div>

      {/* Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Check Delivery for {product.name}</h2>
              <button onClick={() => setShowDeliveryModal(false)} className="text-gray-500">
                ×
              </button>
            </div>
            <div className="p-4">
              <PincodeChecker productId={product._id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Example 5: Handling Delivery Information
// ============================================================================

import React, { useState } from 'react';
import PincodeChecker from '../components/PincodeChecker';

function SmartAddToCart({ product }) {
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  const handleAddToCart = () => {
    if (!deliveryInfo?.available) {
      alert('Product is not available for delivery in your area');
      return;
    }

    // Proceed with add to cart with delivery info
    console.log('Adding to cart with delivery info:', deliveryInfo);
  };

  return (
    <div className="space-y-4">
      <PincodeChecker
        productId={product._id}
        onDeliveryCheck={setDeliveryInfo}
      />

      <button
        onClick={handleAddToCart}
        disabled={!deliveryInfo?.available}
        className={`w-full py-2 px-4 rounded-lg font-semibold ${
          deliveryInfo?.available
            ? 'bg-pink-600 text-white hover:bg-pink-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Add to Cart
      </button>
    </div>
  );
}

// ============================================================================
// Component Props Reference
// ============================================================================

/**
 * Props for PincodeChecker Component
 *
 * @prop {string} productId - The product ID to check delivery for (required)
 * @prop {function} onDeliveryCheck - Callback function called when delivery check completes
 *   - Called with object: { pincode, available, estimatedDelivery, codAvailable }
 *
 * @prop {boolean} showCOD - Whether to display COD availability information (default: true)
 *
 * @prop {string} className - Additional CSS classes for styling the container (default: '')
 *
 * Example: className="mt-4 border-2 border-blue-500"
 */

// ============================================================================
// API Response Format
// ============================================================================

/**
 * API Response from checkProductDelivery
 *
 * Example successful response:
 * {
 *   success: true,
 *   deliveryAvailable: true,
 *   estimatedDeliveryDate: "2024-01-20",
 *   codAvailable: true,
 *   deliveryCharge: 0,
 *   message: "Delivery available in your area"
 * }
 *
 * Example failed response:
 * {
 *   success: false,
 *   message: "Delivery not available in this pincode"
 * }
 */

// ============================================================================
// Features Overview
// ============================================================================

/**
 * Component Features:
 *
 * 1. Input Validation
 *    - Accepts only 6-digit pincodes
 *    - Auto-formats input (removes non-digit characters)
 *    - Shows character count (X/6 digits)
 *    - Enables button only when complete pincode is entered
 *
 * 2. Loading State
 *    - Shows spinner during API request
 *    - Disables input and button during loading
 *    - Clear loading indicator with "Checking..." text
 *
 * 3. Error Handling
 *    - Displays validation errors
 *    - Shows API error messages
 *    - Error states clear when user re-enters data
 *
 * 4. Result Display
 *    - Availability status (with green/red indicator)
 *    - Estimated delivery date
 *    - Delivery charges
 *    - COD availability (optional)
 *    - Button to check another pincode
 *
 * 5. Accessibility
 *    - Proper labels and ARIA attributes
 *    - Keyboard navigation support (Enter to submit)
 *    - Semantic HTML structure
 *    - Color-blind friendly status indicators with icons
 *
 * 6. Performance
 *    - Uses React.memo for optimization
 *    - API calls are cached (1-minute TTL)
 *    - Efficient state management
 *    - Reusable across multiple pages
 */

// ============================================================================
// Styling Notes
// ============================================================================

/**
 * The component uses Tailwind CSS classes consistent with the app:
 * - Pink theme: pink-600 (primary), pink-700 (hover)
 * - Status colors: green (available), red (not available)
 * - Gray palette: gray-50, gray-100, gray-200, gray-500, gray-700, gray-900
 * - Border radius: lg (8px)
 * - Spacing: Consistent with app design system
 *
 * You can customize appearance using the className prop:
 *
 * <PincodeChecker
 *   productId="123"
 *   className="shadow-lg rounded-xl border-2 border-pink-200"
 * />
 */

export {};
