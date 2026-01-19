import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { toast } from 'react-toastify';
import ModifyOrderModal from '../components/orders/ModifyOrderModal';

const OrderHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [modifyingOrder, setModifyingOrder] = useState(null);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    fetchOrders();

    // Show success message if redirected from checkout
    if (location.state?.orderId) {
      toast.success('Order placed successfully!');
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      console.log('[OrderHistory] API response:', response);

      // API returns: { success, message, data: { orders: [], pagination: {...} } }
      // orderApi.getMyOrders() returns response.data which is { orders: [], pagination: {...} }
      const ordersData = response.data?.orders || response.orders || [];
      console.log('[OrderHistory] Orders array:', ordersData);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await orderApi.cancelOrder(orderId, 'Customer requested cancellation');
      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleModifySuccess = () => {
    fetchOrders(); // Refresh orders after successful modification
  };

  const canModifyOrder = (order) => {
    return (
      order.canModify !== false &&
      (order.orderStatus === 'pending' || order.orderStatus === 'confirmed') &&
      order.modificationDeadline &&
      new Date(order.modificationDeadline) > new Date()
    );
  };

  const getStatusColors = (status) => {
    const colors = {
      pending: {
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        text: '#92400e',
        border: '#fde68a',
        shadow: '0 4px 12px rgba(252, 211, 77, 0.3)'
      },
      processing: {
        bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        text: '#1e40af',
        border: '#bfdbfe',
        shadow: '0 4px 12px rgba(191, 219, 254, 0.3)'
      },
      shipped: {
        bg: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
        text: '#6b21a8',
        border: '#d8b4fe',
        shadow: '0 4px 12px rgba(216, 180, 254, 0.3)'
      },
      delivered: {
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        text: '#065f46',
        border: '#a7f3d0',
        shadow: '0 4px 12px rgba(167, 243, 208, 0.3)'
      },
      cancelled: {
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        text: '#991b1b',
        border: '#fecaca',
        shadow: '0 4px 12px rgba(254, 202, 202, 0.3)'
      },
      refunded: {
        bg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        text: '#1f2937',
        border: '#e5e7eb',
        shadow: '0 4px 12px rgba(229, 231, 235, 0.3)'
      }
    };
    return colors[status] || colors.refunded;
  };

  const getOrderProgress = (status) => {
    const progressMap = {
      pending: 20,
      processing: 40,
      shipped: 70,
      delivered: 100,
      cancelled: 0,
      refunded: 0
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '500',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>Loading your orders...</p>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: '#ffffff',
              margin: 0,
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>Order History</h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              margin: 0,
              fontWeight: '500'
            }}>Track and manage all your orders in real-time</p>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              padding: '14px 32px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Orders</span>
          </button>
        </div>

        {error ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '64px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '40px', height: '40px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>Oops! Something went wrong</h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px',
              fontSize: '16px'
            }}>{error}</p>
            <button
              onClick={fetchOrders}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '64px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '60px', height: '60px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>No orders yet</h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px',
              fontSize: '18px',
              lineHeight: '1.6'
            }}>Start shopping to see your orders here.<br />Discover amazing products waiting for you!</p>
            <button
              onClick={() => navigate('/products')}
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {orders.map((order) => {
              const statusColors = getStatusColors(order.orderStatus);
              const progress = getOrderProgress(order.orderStatus);
              const isHovered = hoveredOrderId === order._id;

              return (
                <div
                  key={order._id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: isHovered
                      ? '0 20px 60px rgba(0, 0, 0, 0.25)'
                      : '0 10px 40px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredOrderId(order._id)}
                  onMouseLeave={() => setHoveredOrderId(null)}
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  {/* Order Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    padding: '32px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            margin: 0
                          }}>
                            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </h3>
                          <span style={{
                            padding: '8px 20px',
                            fontSize: '13px',
                            fontWeight: '700',
                            borderRadius: '9999px',
                            background: statusColors.bg,
                            color: statusColors.text,
                            border: `2px solid ${statusColors.border}`,
                            boxShadow: statusColors.shadow,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                          </span>
                          {order.trackingNumber && (
                            <span style={{
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              borderRadius: '9999px',
                              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              color: '#1e40af',
                              border: '2px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {order.trackingNumber}
                            </span>
                          )}
                        </div>
                        <div style={{
                          textAlign: 'right'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: 0,
                            marginBottom: '4px',
                            fontWeight: '500'
                          }}>Total Amount</p>
                          <p style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#111827',
                            margin: 0,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#6b7280'
                            }}>Order Progress</span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#667eea'
                            }}>{progress}%</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: '#e5e7eb',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '9999px',
                              transition: 'width 1s ease-out',
                              boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
                            }}></div>
                          </div>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span style={{ fontWeight: '500' }}>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: '32px' }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '20px',
                      margin: 0
                    }}>Order Items</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {order.items.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            padding: '20px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <img
                            src={item.product?.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image'}
                            alt={item.product?.name || 'Product'}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <h5 style={{
                              fontWeight: '600',
                              color: '#111827',
                              fontSize: '16px',
                              marginBottom: '8px',
                              margin: 0
                            }}>
                              {item.product?.name || 'Product'}
                            </h5>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              color: '#6b7280',
                              marginTop: '8px'
                            }}>
                              {item.size && (
                                <span style={{
                                  padding: '4px 10px',
                                  background: '#ffffff',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  border: '1px solid #e5e7eb'
                                }}>Size: {item.size}</span>
                              )}
                              {item.color && (
                                <span style={{
                                  padding: '4px 10px',
                                  background: '#ffffff',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  border: '1px solid #e5e7eb'
                                }}>Color: {item.color}</span>
                              )}
                              <span style={{ fontWeight: '500' }}>
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{
                              fontWeight: '700',
                              color: '#111827',
                              fontSize: '20px',
                              margin: 0
                            }}>
                              ${item.subtotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Payment Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px',
                      marginTop: '32px',
                      paddingTop: '32px',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      {/* Shipping Address */}
                      <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '12px',
                        border: '2px solid #bae6fd'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '16px'
                        }}>
                          <svg style={{ width: '20px', height: '20px', color: '#0284c7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <h4 style={{
                            fontWeight: '700',
                            color: '#0c4a6e',
                            fontSize: '16px',
                            margin: 0
                          }}>Shipping Address</h4>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: '#075985',
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          <strong>{order.shippingAddress.fullName}</strong><br />
                          {order.shippingAddress.addressLine1}<br />
                          {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                          {order.shippingAddress.country}<br />
                          📞 {order.shippingAddress.phone}
                        </p>
                      </div>

                      {/* Payment Method */}
                      <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '12px',
                        border: '2px solid #bbf7d0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '16px'
                        }}>
                          <svg style={{ width: '20px', height: '20px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <h4 style={{
                            fontWeight: '700',
                            color: '#14532d',
                            fontSize: '16px',
                            margin: 0
                          }}>Payment Method</h4>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: '#166534',
                          fontWeight: '600',
                          margin: 0
                        }}>
                          {order.paymentMethod === 'card' ? '💳 Credit/Debit Card' : '💵 Cash on Delivery'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '32px',
                      paddingTop: '32px',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order._id}`);
                        }}
                        style={{
                          padding: '12px 24px',
                          background: hoveredButton === `view-${order._id}`
                            ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                          transform: hoveredButton === `view-${order._id}` ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                        onMouseEnter={() => setHoveredButton(`view-${order._id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        View Details
                      </button>
                      {canModifyOrder(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModifyingOrder(order);
                          }}
                          style={{
                            padding: '12px 24px',
                            background: hoveredButton === `modify-${order._id}`
                              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            transform: hoveredButton === `modify-${order._id}` ? 'translateY(-2px)' : 'translateY(0)'
                          }}
                          onMouseEnter={() => setHoveredButton(`modify-${order._id}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          Modify Order
                        </button>
                      )}
                      {order.trackingNumber && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/track/${order.trackingNumber}`);
                          }}
                          style={{
                            padding: '12px 24px',
                            background: hoveredButton === `track-${order._id}`
                              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                            transform: hoveredButton === `track-${order._id}` ? 'translateY(-2px)' : 'translateY(0)'
                          }}
                          onMouseEnter={() => setHoveredButton(`track-${order._id}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          Track Order
                        </button>
                      )}
                      {(order.orderStatus === 'pending' || order.orderStatus === 'processing') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/returns/create/${order._id}`);
                          }}
                          style={{
                            padding: '12px 24px',
                            background: hoveredButton === `return-${order._id}`
                              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                            transform: hoveredButton === `return-${order._id}` ? 'translateY(-2px)' : 'translateY(0)'
                          }}
                          onMouseEnter={() => setHoveredButton(`return-${order._id}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          Return/Exchange
                        </button>
                      )}
                      {(order.orderStatus === 'pending' || order.orderStatus === 'processing') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order._id);
                          }}
                          disabled={cancellingOrderId === order._id}
                          style={{
                            padding: '12px 24px',
                            background: cancellingOrderId === order._id
                              ? '#9ca3af'
                              : hoveredButton === `cancel-${order._id}`
                                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: cancellingOrderId === order._id ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                            opacity: cancellingOrderId === order._id ? 0.6 : 1,
                            transform: hoveredButton === `cancel-${order._id}` && cancellingOrderId !== order._id ? 'translateY(-2px)' : 'translateY(0)'
                          }}
                          onMouseEnter={() => setHoveredButton(`cancel-${order._id}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modify Order Modal */}
        {modifyingOrder && (
          <ModifyOrderModal
            order={modifyingOrder}
            isOpen={!!modifyingOrder}
            onClose={() => setModifyingOrder(null)}
            onSuccess={handleModifySuccess}
          />
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
