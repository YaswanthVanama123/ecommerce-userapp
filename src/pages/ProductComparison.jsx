import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api';
import { toast } from 'react-toastify';
import { useCartActions } from '../context/CartContext';

const ProductComparison = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCartActions();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(new Set());

  useEffect(() => {
    const productIds = searchParams.getAll('id');

    if (productIds.length === 0) {
      toast.info('Please select products to compare');
      navigate('/products');
      return;
    }

    if (productIds.length > 4) {
      toast.warning('You can compare up to 4 products at a time');
      productIds.splice(4);
    }

    fetchProducts(productIds);
  }, [searchParams]);

  const fetchProducts = async (productIds) => {
    setLoading(true);
    try {
      const promises = productIds.map(id =>
        productApi.getProductById(id).catch(() => null)
      );
      const responses = await Promise.all(promises);
      const validProducts = responses
        .filter(res => res !== null && res.data)
        .map(res => res.data);

      if (validProducts.length === 0) {
        toast.error('No products found');
        navigate('/products');
        return;
      }

      setProducts(validProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingToCart(prev => new Set(prev).add(productId));
    await addToCart(productId, 1);
    setAddingToCart(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleRemoveProduct = (productId) => {
    const updatedProducts = products.filter(p => p._id !== productId);

    if (updatedProducts.length === 0) {
      navigate('/products');
      return;
    }

    setProducts(updatedProducts);

    // Update URL
    const newParams = new URLSearchParams();
    updatedProducts.forEach(p => newParams.append('id', p._id));
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  const calculateDiscountedPrice = (product) => {
    return product.discount > 0
      ? product.price - (product.price * product.discount) / 100
      : product.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Comparison</h1>
            <p className="text-gray-600 mt-1">
              Comparing {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-pink-600 hover:text-pink-700 font-semibold"
          >
            Back to Products
          </button>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 bg-gray-50 font-semibold text-gray-900 sticky left-0 z-10 w-48">
                  Feature
                </th>
                {products.map((product) => (
                  <th key={product._id} className="py-4 px-4 bg-gray-50">
                    <div className="relative">
                      <button
                        onClick={() => handleRemoveProduct(product._id)}
                        className="absolute top-0 right-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Remove from comparison"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Product Images */}
              <tr className="border-b">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Product
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4">
                    <div className="flex flex-col items-center">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/150'}
                        alt={product.name}
                        className="w-32 h-40 object-contain mb-3 rounded"
                      />
                      <h3 className="font-semibold text-gray-900 text-center line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      {product.category?.name && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="border-b bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Price
                </td>
                {products.map((product) => {
                  const discountedPrice = calculateDiscountedPrice(product);
                  return (
                    <td key={product._id} className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-gray-900">
                          ₹{Math.round(discountedPrice)}
                        </span>
                        {product.discount > 0 && (
                          <>
                            <span className="text-sm text-gray-400 line-through">
                              ₹{Math.round(product.price)}
                            </span>
                            <span className="text-xs text-green-600 font-semibold">
                              {product.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Rating */}
              <tr className="border-b">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Rating
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4 text-center">
                    {product.rating > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded mb-1">
                          <span className="text-sm font-semibold mr-1">{product.rating.toFixed(1)}</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-500">
                          {product.reviewCount || 0} reviews
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No ratings</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr className="border-b bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Brand
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4 text-center text-gray-900">
                    {product.brand || '-'}
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr className="border-b">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Availability
                </td>
                {products.map((product) => {
                  const stock = typeof product.stock === 'number'
                    ? product.stock
                    : Array.isArray(product.stock)
                      ? product.stock.reduce((sum, s) => sum + (s.quantity || 0), 0)
                      : 0;

                  return (
                    <td key={product._id} className="py-4 px-4 text-center">
                      {stock > 0 ? (
                        <span className="inline-flex items-center text-green-600 font-semibold">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 font-semibold">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Out of Stock
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Material */}
              <tr className="border-b bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Material
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4 text-center text-gray-900">
                    {product.material || '-'}
                  </td>
                ))}
              </tr>

              {/* Sizes */}
              <tr className="border-b">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Available Sizes
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4 text-center">
                    {product.sizes?.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {product.sizes.map((size, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Colors */}
              <tr className="border-b bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Available Colors
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4">
                    {product.colors?.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        {product.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-sm">-</div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Description */}
              <tr className="border-b">
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Description
                </td>
                {products.map((product) => (
                  <td key={product._id} className="py-4 px-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {product.description || '-'}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  Actions
                </td>
                {products.map((product) => {
                  const stock = typeof product.stock === 'number'
                    ? product.stock
                    : Array.isArray(product.stock)
                      ? product.stock.reduce((sum, s) => sum + (s.quantity || 0), 0)
                      : 0;
                  const isAdding = addingToCart.has(product._id);

                  return (
                    <td key={product._id} className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/product/${product._id}`)}
                          className="w-full py-2 px-4 border-2 border-pink-600 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-colors text-sm"
                        >
                          View Details
                        </button>
                        {stock > 0 && (
                          <button
                            onClick={() => handleAddToCart(product._id)}
                            disabled={isAdding}
                            className="w-full py-2 px-4 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isAdding ? 'Adding...' : 'Add to Cart'}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductComparison;
