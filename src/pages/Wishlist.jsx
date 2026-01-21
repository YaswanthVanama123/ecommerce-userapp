import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistWithActions } from '../context/WishlistContext';
import { useCartActions } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../api';

const Wishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { wishlist, loading, isEmpty, removeFromWishlist, fetchWishlist } = useWishlistWithActions();
  const { addToCart, isInCart } = useCartActions();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [addingToCart, setAddingToCart] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [bulkMoving, setBulkMoving] = useState(false);

  // Fetch full product details for wishlist items
  useEffect(() => {
    const fetchProductDetails = async () => {
      console.log('[Wishlist] fetchProductDetails called:', {
        wishlist,
        wishlistLength: wishlist?.length,
        isAuthenticated,
        firstItem: wishlist?.[0]
      });

      if (!wishlist || wishlist.length === 0) {
        console.log('[Wishlist] Wishlist is empty, setting products to []');
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      try {
        // For authenticated users, wishlist items are objects with product details
        // For guest users, wishlist items are just product IDs

        // Check if this is authenticated user data (items have .product field)
        const hasProductField = wishlist[0]?.product !== undefined;
        console.log('[Wishlist] Data structure check:', {
          isAuthenticated,
          hasProductField,
          firstItemType: typeof wishlist[0],
          firstItemKeys: wishlist[0] ? Object.keys(wishlist[0]) : []
        });

        if (isAuthenticated && hasProductField) {
          // Authenticated user - items already have product details populated
          console.log('[Wishlist] Processing authenticated user wishlist with populated products');
          const productList = wishlist
            .filter(item => item.product) // Filter out items with null/undefined products
            .map(item => {
              const product = item.product;
              // Calculate discount percentage if discountPrice exists
              let discount = 0;
              if (product.discountPrice && product.price > product.discountPrice) {
                discount = Math.round(((product.price - product.discountPrice) / product.price) * 100);
              }

              // Calculate total stock
              let totalStock = 0;
              if (Array.isArray(product.stock)) {
                totalStock = product.stock.reduce((sum, s) => sum + (s.quantity || 0), 0);
              } else if (typeof product.stock === 'number') {
                totalStock = product.stock;
              }

              return {
                ...product,
                discount, // Add calculated discount percentage
                stock: totalStock, // Convert stock array to total number
                wishlistItemId: item._id,
                addedAt: item.addedAt
              };
            });
          console.log('[Wishlist] Mapped products for authenticated user:', productList.length);
          setProducts(productList);
        } else if (!isAuthenticated && typeof wishlist[0] === 'string') {
          // Guest user - wishlist contains product IDs, need to fetch details
          console.log('[Wishlist] Processing guest wishlist - fetching product details for IDs');
          const productPromises = wishlist.map(productId =>
            productApi.getProductById(productId).catch(err => {
              console.error(`Failed to fetch product ${productId}:`, err);
              return null;
            })
          );
          const productResponses = await Promise.all(productPromises);
          const productList = productResponses
            .filter(res => res !== null && res.data)
            .map(res => res.data);
          console.log('[Wishlist] Fetched guest products:', productList.length);
          setProducts(productList);
        } else if (!isAuthenticated && wishlist[0]?.name) {
          // Guest user - wishlist already contains full product objects
          console.log('[Wishlist] Processing guest wishlist with full product data');
          setProducts(wishlist);
        } else {
          // Fallback: try to handle unexpected data structure
          console.warn('[Wishlist] Unexpected wishlist data structure, attempting fallback');

          // If authenticated but items don't have .product, try fetching
          if (isAuthenticated && typeof wishlist[0] === 'string') {
            console.log('[Wishlist] Authenticated user with product IDs - fetching details');
            const productPromises = wishlist.map(productId =>
              productApi.getProductById(productId).catch(err => {
                console.error(`Failed to fetch product ${productId}:`, err);
                return null;
              })
            );
            const productResponses = await Promise.all(productPromises);
            const productList = productResponses
              .filter(res => res !== null && res.data)
              .map(res => res.data);
            setProducts(productList);
          } else {
            console.error('[Wishlist] Unable to process wishlist data structure:', wishlist[0]);
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('[Wishlist] Error fetching product details:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductDetails();
  }, [wishlist, isAuthenticated]);

  // Fetch wishlist on mount for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const handleRemove = async (productId) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    await removeFromWishlist(productId);
    setRemovingItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(prev => new Set(prev).add(product._id));
    await addToCart(product._id, 1);
    setAddingToCart(prev => {
      const next = new Set(prev);
      next.delete(product._id);
      return next;
    });
  };

  const handleMoveToCart = async (product) => {
    setAddingToCart(prev => new Set(prev).add(product._id));
    const result = await addToCart(product._id, 1);
    if (result.success) {
      await removeFromWishlist(product._id);
    }
    setAddingToCart(prev => {
      const next = new Set(prev);
      next.delete(product._id);
      return next;
    });
  };

  const calculateDiscountedPrice = (product) => {
    // Use discountPrice if available, otherwise calculate from discount percentage
    if (product.discountPrice && product.discountPrice > 0) {
      return product.discountPrice;
    }
    if (product.discount && product.discount > 0) {
      return product.price - (product.price * product.discount) / 100;
    }
    return product.price;
  };

  // Select/deselect item
  const toggleSelectItem = (productId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === products.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(products.map(p => p._id)));
    }
  };

  // Move selected items to cart
  const handleBulkMoveToCart = async () => {
    if (selectedItems.size === 0) {
      toast.info('Please select items to move');
      return;
    }

    setBulkMoving(true);
    let successCount = 0;
    let failCount = 0;

    for (const productId of selectedItems) {
      try {
        const result = await addToCart(productId, 1);
        if (result.success) {
          await removeFromWishlist(productId);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setBulkMoving(false);
    setSelectedItems(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} item(s) moved to cart`);
    }
    if (failCount > 0) {
      toast.error(`Failed to move ${failCount} item(s)`);
    }
  };

  // Share wishlist
  const handleShareWishlist = () => {
    const link = `${window.location.origin}/wishlist?shared=${isAuthenticated ? 'user' : 'guest'}`;
    setShareLink(link);
    setShowShareModal(true);

    // Copy to clipboard
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.info('Use the link below to share');
    });
  };

  // Request price drop alert
  const handlePriceAlert = (product) => {
    if (!isAuthenticated) {
      toast.info('Please login to set price alerts');
      navigate('/login');
      return;
    }
    toast.success(`You'll be notified when the price drops for ${product.name}`);
  };

  // Request back in stock alert
  const handleStockAlert = (product) => {
    if (!isAuthenticated) {
      toast.info('Please login to set stock alerts');
      navigate('/login');
      return;
    }
    toast.success(`You'll be notified when ${product.name} is back in stock`);
  };

  // Loading state - show loader while fetching
  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1">Loading your saved items...</p>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state - only show after loading is complete
  if (!loading && !loadingProducts && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
            <svg
              className="w-24 h-24 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is not empty</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Save your favorite items to your wishlist and shop them later!
            </p>
            <Link
              to="/products"
              className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1">
              {products.length} {products.length === 1 ? 'item' : 'items'} saved
              {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {products.length > 0 && (
              <>
                <button
                  onClick={handleShareWishlist}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>

                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBulkMoveToCart}
                    disabled={bulkMoving}
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkMoving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Moving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Move {selectedItems.size} to Cart
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Desktop navigation */}
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 text-pink-600 hover:text-pink-700 font-semibold text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Bulk Selection */}
        {products.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Select All</span>
            </label>
            {selectedItems.size > 0 && (
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const discountedPrice = calculateDiscountedPrice(product);
            const isRemoving = removingItems.has(product._id);
            const isAdding = addingToCart.has(product._id);
            const inCart = isInCart(product._id);

            return (
              <div
                key={product._id}
                className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all relative ${
                  isRemoving ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                } ${selectedItems.has(product._id) ? 'ring-2 ring-pink-600' : ''}`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(product._id)}
                    onChange={() => toggleSelectItem(product._id)}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 shadow-lg bg-white"
                  />
                </div>
                {/* Product Image */}
                <Link to={`/product/${product._id}`} className="block relative">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    />

                    {/* Discount Badge */}
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {product.discount}% OFF
                      </div>
                    )}

                    {/* Stock Status */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">Out of Stock</span>
                      </div>
                    )}

                    {/* Rating */}
                    {product.rating && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center space-x-1">
                        <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-900">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-3">
                  {/* Category */}
                  {product.category?.name && (
                    <p className="text-xs text-gray-500 uppercase mb-1 font-medium">
                      {product.category.name}
                    </p>
                  )}

                  {/* Product Name */}
                  <Link
                    to={`/product/${product._id}`}
                    className="block text-sm md:text-base font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem] hover:text-pink-600 transition-colors"
                  >
                    {product.name}
                  </Link>

                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-3">
                    {product.discount > 0 ? (
                      <>
                        <span className="text-base md:text-lg font-bold text-gray-900">
                          ₹{Math.round(discountedPrice)}
                        </span>
                        <span className="text-xs md:text-sm text-gray-400 line-through">
                          ₹{Math.round(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-base md:text-lg font-bold text-gray-900">
                        ₹{Math.round(product.price)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Price Alert Button */}
                    {product.discount > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handlePriceAlert(product);
                        }}
                        className="w-full py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1"
                        title="Get price drop alerts"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Price Alert
                      </button>
                    )}

                    {/* Stock Alert Button */}
                    {product.stock === 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleStockAlert(product);
                        }}
                        className="w-full py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors flex items-center justify-center gap-1"
                        title="Get back in stock alerts"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Stock Alert
                      </button>
                    )}

                    {/* Add to Cart / Move to Cart Button */}
                    {product.stock > 0 && (
                      <button
                        onClick={() => inCart ? handleAddToCart(product) : handleMoveToCart(product)}
                        disabled={isAdding}
                        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                          inCart
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-pink-600 text-white hover:bg-pink-700'
                        } ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isAdding ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            {inCart ? 'Adding...' : 'Moving...'}
                          </div>
                        ) : inCart ? (
                          <div className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            In Cart
                          </div>
                        ) : (
                          'Move to Cart'
                        )}
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(product._id)}
                      disabled={isRemoving}
                      className="w-full py-2 rounded-lg font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRemoving ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                          Removing...
                        </div>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Continue Shopping Button */}
        <div className="md:hidden mt-8">
          <Link
            to="/products"
            className="block w-full text-center bg-white text-pink-600 border-2 border-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share Wishlist</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">Share your wishlist with friends and family!</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 mb-2 font-medium">Share Link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Link copied!');
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent('Check out my wishlist: ' + shareLink)}`, '_blank');
                }}
                className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
                }}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
