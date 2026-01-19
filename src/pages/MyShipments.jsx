import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { toast } from 'react-toastify';

const MyShipments = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredShipmentId, setHoveredShipmentId] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      console.log('[MyShipments] API response:', response);

      const ordersData = response.data?.orders || response.orders || [];
      setShipments(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (err) {
      console.error('[MyShipments] Error:', err);
      setError('Failed to load shipments');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColors = (status) => {
    const colors = {
      pending: {
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        text: '#92400e',
        border: '#fde68a',
        shadow: '0 4px 12px rgba(252, 211, 77, 0.3)',
        icon: '⏳'
      },
      confirmed: {
        bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        text: '#1e40af',
        border: '#bfdbfe',
        shadow: '0 4px 12px rgba(191, 219, 254, 0.3)',
        icon: '✅'
      },
      processing: {
        bg: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
        text: '#6b21a8',
        border: '#d8b4fe',
        shadow: '0 4px 12px rgba(216, 180, 254, 0.3)',
        icon: '⚙️'
      },
      shipped: {
        bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        text: '#3730a3',
        border: '#c7d2fe',
        shadow: '0 4px 12px rgba(199, 210, 254, 0.3)',
        icon: '🚚'
      },
      out_for_delivery: {
        bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
        text: '#9a3412',
        border: '#fdba74',
        shadow: '0 4px 12px rgba(253, 186, 116, 0.3)',
        icon: '🚗'
      },
      delivered: {
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        text: '#065f46',
        border: '#a7f3d0',
        shadow: '0 4px 12px rgba(167, 243, 208, 0.3)',
        icon: '✨'
      },
      cancelled: {
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        text: '#991b1b',
        border: '#fecaca',
        shadow: '0 4px 12px rgba(254, 202, 202, 0.3)',
        icon: '❌'
      },
      refunded: {
        bg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        text: '#1f2937',
        border: '#e5e7eb',
        shadow: '0 4px 12px rgba(229, 231, 235, 0.3)',
        icon: '💰'
      }
    };
    return colors[status] || colors.pending;
  };

  const getShipmentProgress = (status) => {
    const progressMap = {
      pending: 10,
      confirmed: 25,
      processing: 40,
      shipped: 60,
      out_for_delivery: 85,
      delivered: 100,
      cancelled: 0,
      refunded: 0
    };
    return progressMap[status] || 0;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesFilter = activeFilter === 'all' ||
      (activeFilter === 'in_transit' && ['processing', 'shipped', 'out_for_delivery'].includes(shipment.status)) ||
      (activeFilter === 'delivered' && shipment.status === 'delivered');

    const matchesSearch = !searchQuery ||
      (shipment.orderNumber || shipment._id?.slice(-8).toUpperCase() || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipment.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getFilterCounts = () => {
    return {
      all: shipments.length,
      in_transit: shipments.filter(s => ['processing', 'shipped', 'out_for_delivery'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'delivered').length
    };
  };

  const filterCounts = getFilterCounts();

  const handleTrackShipment = (shipment) => {
    const trackingParam = shipment.trackingNumber || shipment._id;
    navigate(`/track?${shipment.trackingNumber ? 'tracking' : 'order'}=${trackingParam}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #ec4899',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{
            color: '#6b7280',
            fontSize: '18px',
            fontWeight: '500',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>Loading shipments...</p>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              @keyframes liveTrack {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.7;
                  transform: scale(1.05);
                }
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
      background: '#f9fafb',
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
              color: '#111827',
              margin: 0,
              marginBottom: '8px'
            }}>My Shipments</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: 0,
              fontWeight: '500'
            }}>Track all your deliveries in real-time</p>
          </div>
          <button
            onClick={fetchShipments}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #db2777 0%, #be185d 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.3)';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'all', label: 'All Shipments', count: filterCounts.all },
              { key: 'in_transit', label: 'In Transit', count: filterCounts.in_transit },
              { key: 'delivered', label: 'Delivered', count: filterCounts.delivered }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                style={{
                  padding: '12px 24px',
                  background: activeFilter === filter.key
                    ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                    : '#f3f4f6',
                  color: activeFilter === filter.key ? '#ffffff' : '#6b7280',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: activeFilter === filter.key
                    ? '0 4px 15px rgba(236, 72, 153, 0.4)'
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (activeFilter !== filter.key) {
                    e.currentTarget.style.background = '#e5e7eb';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeFilter !== filter.key) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
              >
                <span>{filter.label}</span>
                <span style={{
                  padding: '2px 8px',
                  background: activeFilter === filter.key
                    ? 'rgba(255, 255, 255, 0.3)'
                    : '#d1d5db',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number or tracking number..."
              style={{
                width: '100%',
                padding: '16px 20px 16px 52px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                color: '#111827',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ec4899';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <svg style={{
              width: '20px',
              height: '20px',
              color: '#9ca3af',
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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
              onClick={fetchShipments}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
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
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredShipments.length === 0 ? (
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>No shipments found</h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px',
              fontSize: '18px',
              lineHeight: '1.6'
            }}>
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Place an order to start tracking your shipments'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <button
                onClick={() => navigate('/products')}
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredShipments.map((shipment) => {
              const statusColors = getStatusColors(shipment.status);
              const progress = getShipmentProgress(shipment.status);
              const isHovered = hoveredShipmentId === shipment._id;
              const isLiveTracking = ['processing', 'shipped', 'out_for_delivery'].includes(shipment.status);

              return (
                <div
                  key={shipment._id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: isHovered
                      ? '0 20px 60px rgba(0, 0, 0, 0.25)'
                      : '0 10px 40px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredShipmentId(shipment._id)}
                  onMouseLeave={() => setHoveredShipmentId(null)}
                >
                  <div style={{ padding: '32px' }}>
                    {/* Shipment Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Status Icon */}
                        <div style={{
                          width: '56px',
                          height: '56px',
                          background: statusColors.bg,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          border: `2px solid ${statusColors.border}`,
                          boxShadow: statusColors.shadow,
                          animation: isLiveTracking ? 'liveTrack 2s ease-in-out infinite' : 'none'
                        }}>
                          {statusColors.icon}
                        </div>

                        <div>
                          <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#111827',
                            margin: 0,
                            marginBottom: '8px'
                          }}>
                            Order #{shipment.orderNumber || shipment._id?.slice(-8).toUpperCase()}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: '700',
                              borderRadius: '9999px',
                              background: statusColors.bg,
                              color: statusColors.text,
                              border: `2px solid ${statusColors.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {shipment.status.replace(/_/g, ' ')}
                            </span>
                            {shipment.trackingNumber && (
                              <span style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                borderRadius: '9999px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                {shipment.trackingNumber}
                              </span>
                            )}
                            {isLiveTracking && (
                              <span style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                borderRadius: '9999px',
                                background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                                color: '#713f12',
                                border: '2px solid #fde047',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                animation: 'liveTrack 2s ease-in-out infinite'
                              }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  background: '#f59e0b',
                                  borderRadius: '50%',
                                  display: 'inline-block'
                                }}></span>
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          margin: 0,
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>Total Items</p>
                        <p style={{
                          fontSize: '28px',
                          fontWeight: '800',
                          color: '#111827',
                          margin: 0,
                          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {shipment.items?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {shipment.status !== 'cancelled' && shipment.status !== 'refunded' && (
                      <div style={{ marginBottom: '24px' }}>
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
                          }}>Delivery Progress</span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#ec4899'
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
                            background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)',
                            borderRadius: '9999px',
                            transition: 'width 1s ease-out',
                            boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)',
                            animation: isLiveTracking ? 'pulse 2s ease-in-out infinite' : 'none'
                          }}></div>
                        </div>
                      </div>
                    )}

                    {/* Shipment Items */}
                    {shipment.items && shipment.items.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#111827',
                          marginBottom: '16px',
                          margin: 0
                        }}>Items in this shipment</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {shipment.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
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
                                src={item.product?.images?.[0] || 'https://via.placeholder.com/60x60?text=No+Image'}
                                alt={item.product?.name || 'Product'}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '10px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <h5 style={{
                                  fontWeight: '600',
                                  color: '#111827',
                                  fontSize: '14px',
                                  margin: 0,
                                  marginBottom: '4px'
                                }}>
                                  {item.product?.name || 'Product'}
                                </h5>
                                <p style={{
                                  fontSize: '13px',
                                  color: '#6b7280',
                                  margin: 0,
                                  fontWeight: '500'
                                }}>
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                          {shipment.items.length > 3 && (
                            <div style={{
                              padding: '12px',
                              textAlign: 'center',
                              background: '#f9fafb',
                              borderRadius: '12px',
                              color: '#6b7280',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              +{shipment.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Information */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '24px',
                      paddingTop: '24px',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      {shipment.estimatedDelivery && shipment.status !== 'delivered' && (
                        <div style={{
                          padding: '16px',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          borderRadius: '10px',
                          border: '2px solid #fde68a'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <svg style={{ width: '16px', height: '16px', color: '#92400e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#92400e',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>Est. Delivery</span>
                          </div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#78350f',
                            margin: 0
                          }}>
                            {new Date(shipment.estimatedDelivery).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {shipment.deliveredAt && (
                        <div style={{
                          padding: '16px',
                          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                          borderRadius: '10px',
                          border: '2px solid #a7f3d0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <svg style={{ width: '16px', height: '16px', color: '#065f46' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#065f46',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>Delivered On</span>
                          </div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#064e3b',
                            margin: 0
                          }}>
                            {new Date(shipment.deliveredAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingTop: '24px',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => handleTrackShipment(shipment)}
                        style={{
                          padding: '12px 28px',
                          background: hoveredButton === `track-${shipment._id}`
                            ? 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
                            : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
                          transform: hoveredButton === `track-${shipment._id}` ? 'translateY(-2px)' : 'translateY(0)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={() => setHoveredButton(`track-${shipment._id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Track Shipment</span>
                      </button>
                      <button
                        onClick={() => navigate('/orders')}
                        style={{
                          padding: '12px 28px',
                          background: hoveredButton === `order-${shipment._id}`
                            ? '#e5e7eb'
                            : '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          transform: hoveredButton === `order-${shipment._id}` ? 'translateY(-2px)' : 'translateY(0)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={() => setHoveredButton(`order-${shipment._id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>View Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyShipments;
