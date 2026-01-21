import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { toast } from 'react-toastify';
import TrackingTimeline from '../components/tracking/TrackingTimeline';
import TrackingMap from '../components/tracking/TrackingMap';
import EstimatedDelivery from '../components/tracking/EstimatedDelivery';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('tracking') || '');
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    const tracking = searchParams.get('tracking');
    const order = searchParams.get('order');

    if (tracking || order) {
      handleTrack(tracking, order);
    }
  }, [searchParams]);

  const handleTrack = async (tracking = trackingNumber, order = orderId) => {
    if (!tracking && !order) {
      toast.error('Please enter a tracking number or order ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (tracking) {
        response = await orderApi.trackOrder(tracking);
      } else {
        response = await orderApi.trackOrder(order);
      }

      console.log('[TrackOrder] API response:', response);

      const data = response.data || response;
      setTrackingData(data);

      // Generate shareable link
      const link = `${window.location.origin}/track?${tracking ? `tracking=${tracking}` : `order=${order}`}`;
      setShareLink(link);

      toast.success('Tracking information loaded');
    } catch (err) {
      console.error('[TrackOrder] Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch tracking information. Please check your tracking number or order ID.');
      setTrackingData(null);
      toast.error('Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const handleShare = async () => {
    if (navigator.share && shareLink) {
      try {
        await navigator.share({
          title: 'Track My Order',
          text: 'Track my order shipment',
          url: shareLink
        });
        toast.success('Shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Tracking link copied to clipboard');
    }
  };

  const handleDownloadReceipt = () => {
    if (!trackingData) return;
    toast.info('Receipt download functionality coming soon');
    console.log('Download receipt for order:', trackingData.orderNumber);
  };

  const handleContactCarrier = () => {
    if (!trackingData?.carrier) {
      toast.info('Carrier contact information not available');
      return;
    }
    toast.info('Contact carrier functionality coming soon');
    console.log('Contact carrier:', trackingData.carrier);
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
          }}>Loading tracking information...</p>
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
      background: '#f9fafb',
      padding: '40px 20px',
      paddingBottom: '96px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#111827',
            margin: 0,
            marginBottom: '12px'
          }}>Track Your Order</h1>
          <p style={{
            color: '#6b7280',
            fontSize: '18px',
            margin: 0,
            fontWeight: '500'
          }}>
            Enter your tracking number or order ID to track your shipment
          </p>
        </div>

        {/* Search Form */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto 32px'
        }}>
          <form onSubmit={handleSubmit} style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <label htmlFor="trackingNumber" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Tracking Number
                </label>
                <input
                  type="text"
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., TRACK123456"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
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
              </div>
              <div>
                <label htmlFor="orderId" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Order ID
                </label>
                <input
                  type="text"
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., ORD123456"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
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
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 32px',
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(236, 72, 153, 0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.4)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></div>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Track Shipment</span>
                </>
              )}
            </button>

            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              marginTop: '12px',
              textAlign: 'center',
              margin: '12px 0 0 0'
            }}>
              You can use either tracking number or order ID to track your package
            </p>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            maxWidth: '900px',
            margin: '0 auto 32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #fecaca',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <svg style={{
                  width: '24px',
                  height: '24px',
                  color: '#991b1b',
                  flexShrink: 0
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#991b1b',
                    margin: 0,
                    marginBottom: '4px'
                  }}>Error Loading Tracking Information</h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#991b1b',
                    margin: 0
                  }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Information */}
        {trackingData && !loading && (
          <>
            {/* Order Summary */}
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto 32px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
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
                    <div>
                      <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '8px'
                      }}>
                        Order #{trackingData.orderNumber || trackingData._id?.slice(-8).toUpperCase()}
                      </h2>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(trackingData.createdAt).toLocaleDateString()}
                        </span>
                        {trackingData.trackingNumber && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            Tracking: {trackingData.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <button
                        onClick={handleShare}
                        style={{
                          padding: '12px 20px',
                          background: hoveredButton === 'share'
                            ? 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
                            : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                          color: '#ffffff',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transform: hoveredButton === 'share' ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                        onMouseEnter={() => setHoveredButton('share')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Share</span>
                      </button>
                      <button
                        onClick={handleDownloadReceipt}
                        style={{
                          padding: '12px 20px',
                          background: hoveredButton === 'receipt' ? '#374151' : '#4b5563',
                          color: '#ffffff',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(75, 85, 99, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transform: hoveredButton === 'receipt' ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                        onMouseEnter={() => setHoveredButton('receipt')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Receipt</span>
                      </button>
                      <button
                        onClick={handleContactCarrier}
                        style={{
                          padding: '12px 20px',
                          background: hoveredButton === 'contact'
                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transform: hoveredButton === 'contact' ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                        onMouseEnter={() => setHoveredButton('contact')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Tracking Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {/* Left Column - Timeline and Map */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                gridColumn: 'span 2'
              }}>
                <TrackingTimeline
                  trackingHistory={trackingData.tracking || trackingData.trackingHistory || []}
                  currentStatus={trackingData.status}
                />
                <TrackingMap
                  currentLocation={trackingData.currentLocation}
                  destinationLocation={trackingData.destinationLocation || {
                    lat: 34.0522,
                    lng: -118.2437,
                    address: trackingData.shippingAddress ?
                      `${trackingData.shippingAddress.city}, ${trackingData.shippingAddress.state}` :
                      'Delivery Address'
                  }}
                />
              </div>

              {/* Right Column - Delivery Info and Details */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <EstimatedDelivery
                  estimatedDate={trackingData.estimatedDelivery}
                  actualDate={trackingData.deliveredAt}
                  status={trackingData.status}
                />

                {/* Shipping Details */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '20px'
                  }}>Shipping Details</h3>

                  {trackingData.shippingAddress && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                        marginBottom: '8px'
                      }}>Delivery Address</h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        lineHeight: '1.6',
                        margin: 0
                      }}>
                        {trackingData.shippingAddress.fullName}<br />
                        {trackingData.shippingAddress.addressLine1}<br />
                        {trackingData.shippingAddress.addressLine2 && (
                          <>{trackingData.shippingAddress.addressLine2}<br /></>
                        )}
                        {trackingData.shippingAddress.city}, {trackingData.shippingAddress.state} {trackingData.shippingAddress.zipCode}<br />
                        {trackingData.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {trackingData.carrier && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                        marginBottom: '8px'
                      }}>Carrier</h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#111827',
                        margin: 0
                      }}>{trackingData.carrier.name || trackingData.carrier}</p>
                    </div>
                  )}

                  {trackingData.items && (
                    <div>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                        marginBottom: '12px'
                      }}>Items ({trackingData.items.length})</h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {trackingData.items.slice(0, 3).map((item, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#f9fafb',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease'
                          }}>
                            <img
                              src={item.product?.images?.[0] || 'https://via.placeholder.com/40'}
                              alt={item.product?.name || 'Product'}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#111827',
                                margin: 0,
                                marginBottom: '2px'
                              }}>{item.product?.name || 'Product'}</p>
                              <p style={{
                                fontSize: '13px',
                                color: '#6b7280',
                                margin: 0
                              }}>Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {trackingData.items.length > 3 && (
                          <p style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            textAlign: 'center',
                            padding: '8px',
                            margin: 0
                          }}>
                            +{trackingData.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!trackingData && !loading && !error && (
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center',
            paddingTop: '48px',
            paddingBottom: '48px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '64px 32px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
            }}>
              <svg style={{
                width: '96px',
                height: '96px',
                color: '#9ca3af',
                margin: '0 auto 24px'
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                marginBottom: '8px'
              }}>Ready to Track</h2>
              <p style={{
                color: '#6b7280',
                fontSize: '16px',
                marginBottom: '32px',
                margin: '0 0 32px 0'
              }}>
                Enter your tracking number or order ID above to see your shipment details
              </p>
              <button
                onClick={() => navigate('/orders')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
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
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.4)';
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View My Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
