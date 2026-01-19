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

  // Fetch full product details for wishlist items
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!wishlist || wishlist.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      try {
        // For authenticated users, wishlist items are objects with product details
        // For guest users, wishlist items are just product IDs
        if (isAuthenticated && wishlist[0]?.product) {
          // Items already have product details - map them properly
          const productList = wishlist.map(item => {
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
          setProducts(productList);
        } else if (!isAuthenticated && typeof wishlist[0] === 'string') {
          // Guest wishlist - need to fetch product details
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
        } else if (!isAuthenticated && wishlist[0]?.name) {
          // Guest wishlist with full product data
          setProducts(wishlist);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1">
              {products.length} {products.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {/* Desktop navigation */}
          <Link
            to="/products"
            className="hidden md:inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Continue Shopping
          </Link>
        </div>

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
                className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  isRemoving ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                {/* Product Image */}
                <Link to={`/products/${product._id}`} className="block relative">
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
                    to={`/products/${product._id}`}
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
    </div>
  );
};

export default Wishlist;
