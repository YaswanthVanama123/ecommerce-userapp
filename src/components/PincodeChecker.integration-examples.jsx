/**
 * Complete Integration Example: PincodeChecker in Product Detail Page
 *
 * This is a full-featured example showing how to integrate the PincodeChecker
 * component into a product detail page with advanced features.
 *
 * File: ProductDetailPage.jsx (Example)
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PincodeChecker from '../components/PincodeChecker';
import { useCartActions } from '../context/CartContext';
import { Spinner } from '../components/common/Loading';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCartActions();

  // State management
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  // Fetch product data (implement as needed)
  React.useEffect(() => {
    // Fetch product details here
    // setProduct(productData);
    // setLoading(false);
  }, [productId]);

  const handleDeliveryCheck = (deliveryData) => {
    console.log('Delivery info received:', deliveryData);
    setDeliveryInfo(deliveryData);
  };

  const handleAddToCart = async () => {
    // Validate delivery availability
    if (!deliveryInfo) {
      setCartMessage('Please check delivery availability first');
      return;
    }

    if (!deliveryInfo.available) {
      setCartMessage('Product is not available for delivery in your area');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(productId, quantity);
      setCartMessage('Added to cart successfully!');
      setTimeout(() => setCartMessage(''), 3000);
    } catch (error) {
      setCartMessage('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Spinner />;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Product Image and Details */}
          <div>
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-6">
              <img
                src={product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Product Specifications */}
              {product.specifications && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                  <ul className="space-y-2">
                    {product.specifications.map((spec, index) => (
                      <li key={index} className="text-gray-600">
                        <strong>{spec.name}:</strong> {spec.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Price, Add to Cart, and Pincode Checker */}
          <div className="space-y-6">
            {/* Price and Stock */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{Math.round(product.price)}
                </p>
                {product.discount > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Save {product.discount}% ({product.discount}% OFF)
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className={`p-3 rounded text-sm font-medium ${
                product.stock > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0
                  ? `${product.stock} items available`
                  : 'Out of Stock'}
              </div>
            </div>

            {/* Pincode Checker Component */}
            <PincodeChecker
              productId={productId}
              onDeliveryCheck={handleDeliveryCheck}
              showCOD={true}
            />

            {/* Delivery Info Display */}
            {deliveryInfo && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Delivery to PIN:</strong> {deliveryInfo.pincode}
                </p>
                {deliveryInfo.estimatedDelivery && (
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Estimated Delivery:</strong>{' '}
                    {new Date(deliveryInfo.estimatedDelivery).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={product.stock === 0}
                >
                  −
                </button>
                <span className="text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Cart Message */}
            {cartMessage && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                cartMessage.includes('successfully')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {cartMessage}
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={
                addingToCart ||
                product.stock === 0 ||
                !deliveryInfo?.available
              }
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                addingToCart || product.stock === 0 || !deliveryInfo?.available
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 active:scale-95'
              }`}
            >
              {addingToCart && <Spinner size="small" color="white" />}
              <span>
                {addingToCart
                  ? 'Adding to Cart...'
                  : 'Add to Cart'}
              </span>
            </button>

            {/* Info Box */}
            {!deliveryInfo?.available && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Please check delivery availability in your area before adding to cart.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

// ============================================================================
// Alternative: Compact Mobile Layout
// ============================================================================

/**
 * Mobile-optimized version with PincodeChecker in a bottom sheet
 */

import React, { useState } from 'react';
import PincodeChecker from '../components/PincodeChecker';

const ProductDetailPageMobile = () => {
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  return (
    <div className="bg-white">
      {/* Fixed Header with CTA */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <button
          onClick={() => setShowDeliverySheet(true)}
          className="w-full py-2 px-4 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
        >
          {deliveryInfo
            ? `Deliver to PIN ${deliveryInfo.pincode}`
            : 'Check Delivery'}
        </button>

        <button
          disabled={!deliveryInfo?.available}
          className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
            deliveryInfo?.available
              ? 'bg-pink-600 hover:bg-pink-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Add to Cart
        </button>
      </div>

      {/* Bottom Sheet Modal */}
      {showDeliverySheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Check Delivery</h2>
              <button
                onClick={() => setShowDeliverySheet(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <PincodeChecker
              productId="product-123"
              onDeliveryCheck={(info) => {
                setDeliveryInfo(info);
                setShowDeliverySheet(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { ProductDetailPageMobile };

// ============================================================================
// Advanced: With Caching and Optimization
// ============================================================================

/**
 * Using delivery info across page lifecycle with context
 */

import React, { createContext, useState, useContext } from 'react';

const DeliveryContext = createContext();

const DeliveryProvider = ({ children }) => {
  const [deliveryCache, setDeliveryCache] = useState({});

  const cacheDeliveryInfo = (productId, pincode, info) => {
    setDeliveryCache(prev => ({
      ...prev,
      [`${productId}-${pincode}`]: info
    }));
  };

  const getDeliveryInfo = (productId, pincode) => {
    return deliveryCache[`${productId}-${pincode}`];
  };

  return (
    <DeliveryContext.Provider value={{ cacheDeliveryInfo, getDeliveryInfo }}>
      {children}
    </DeliveryContext.Provider>
  );
};

const useDeliveryCache = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDeliveryCache must be used within DeliveryProvider');
  }
  return context;
};

// Usage in component:
// const { cacheDeliveryInfo } = useDeliveryCache();
// cacheDeliveryInfo(productId, pincode, deliveryInfo);
