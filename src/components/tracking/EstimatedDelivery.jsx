import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EstimatedDelivery = ({ estimatedDate, actualDate, status }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if (!estimatedDate || actualDate || status === 'delivered') {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const estimatedTime = new Date(estimatedDate).getTime();
      const difference = estimatedTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsDelayed(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsDelayed(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [estimatedDate, actualDate, status]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusMessage = () => {
    if (actualDate || status === 'delivered') {
      return 'Delivered';
    }
    if (isDelayed) {
      return 'Delivery Delayed';
    }
    if (status === 'out_for_delivery') {
      return 'Out for Delivery';
    }
    return 'Estimated Delivery';
  };

  const getStatusColor = () => {
    if (actualDate || status === 'delivered') {
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
    if (isDelayed) {
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
    if (status === 'out_for_delivery') {
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }
    return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
  };

  const getIconColor = () => {
    if (actualDate || status === 'delivered') {
      return { text: '#10b981', bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)' };
    }
    if (isDelayed) {
      return { text: '#ef4444', bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)' };
    }
    if (status === 'out_for_delivery') {
      return { text: '#f59e0b', bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)' };
    }
    return { text: '#ec4899', bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)' };
  };

  const iconColors = getIconColor();

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: getStatusColor(),
        color: '#ffffff',
        padding: '20px 32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0
          }}>{getStatusMessage()}</h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            padding: '8px'
          }}>
            {(actualDate || status === 'delivered') ? (
              <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {/* Delivery Date Display */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: iconColors.bg,
            marginBottom: '20px'
          }}>
            <svg style={{
              width: '40px',
              height: '40px',
              color: iconColors.text
            }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>

          {actualDate ? (
            <div>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                margin: 0
              }}>Delivered on</p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                margin: '8px 0 0 0'
              }}>{formatDate(actualDate)}</p>
              <p style={{
                fontSize: '20px',
                color: '#374151',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>{formatTime(actualDate)}</p>
            </div>
          ) : (
            <div>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                margin: 0
              }}>
                {isDelayed ? 'Was expected on' : 'Expected on'}
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                margin: '8px 0 0 0'
              }}>{formatDate(estimatedDate)}</p>
              {estimatedDate && (
                <p style={{
                  fontSize: '20px',
                  color: '#374151',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>by {formatTime(estimatedDate)}</p>
              )}
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {!actualDate && !isDelayed && estimatedDate && status !== 'delivered' && (
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              textAlign: 'center',
              marginBottom: '16px',
              margin: 0
            }}>Time Remaining</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              <div style={{
                background: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.08), rgba(219, 39, 119, 0.08))',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '2px solid rgba(236, 72, 153, 0.15)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#ec4899'
                }}>
                  {timeLeft.days.toString().padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>Days</div>
              </div>
              <div style={{
                background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.08))',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '2px solid rgba(139, 92, 246, 0.15)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#a855f7'
                }}>
                  {timeLeft.hours.toString().padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>Hours</div>
              </div>
              <div style={{
                background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.08), rgba(147, 51, 234, 0.08))',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '2px solid rgba(168, 85, 247, 0.15)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#a855f7'
                }}>
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>Minutes</div>
              </div>
              <div style={{
                background: 'linear-gradient(to bottom right, rgba(192, 132, 252, 0.08), rgba(168, 85, 247, 0.08))',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '2px solid rgba(192, 132, 252, 0.15)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#c084fc'
                }}>
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>Seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* Delayed Message */}
        {isDelayed && !actualDate && status !== 'delivered' && (
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, rgba(254, 202, 202, 0.5) 100%)',
            border: '2px solid #fecaca',
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <svg style={{
                width: '20px',
                height: '20px',
                color: '#dc2626',
                flexShrink: 0,
                marginTop: '2px'
              }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#991b1b',
                  margin: 0
                }}>Delivery Delayed</h4>
                <p style={{
                  fontSize: '14px',
                  color: '#991b1b',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  Your package is taking longer than expected. We'll update you with a new delivery date soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delivered Confirmation */}
        {(actualDate || status === 'delivered') && (
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.5) 0%, rgba(167, 243, 208, 0.5) 100%)',
            border: '2px solid #a7f3d0',
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <svg style={{
                width: '20px',
                height: '20px',
                color: '#059669',
                flexShrink: 0,
                marginTop: '2px'
              }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#065f46',
                  margin: 0
                }}>Successfully Delivered</h4>
                <p style={{
                  fontSize: '14px',
                  color: '#065f46',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  Your package has been delivered successfully. Thank you for shopping with us!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Out for Delivery Notice */}
        {status === 'out_for_delivery' && !actualDate && (
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(253, 230, 138, 0.5) 100%)',
            border: '2px solid #fde68a',
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <svg style={{
                width: '20px',
                height: '20px',
                color: '#d97706',
                flexShrink: 0,
                marginTop: '2px'
              }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#92400e',
                  margin: 0
                }}>Out for Delivery Today</h4>
                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  Your package is on its way and will be delivered today!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                margin: 0
              }}>Estimated Delivery</h4>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                margin: '8px 0 0 0'
              }}>{formatDate(estimatedDate)}</p>
            </div>
            {actualDate && (
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  margin: 0
                }}>Actual Delivery</h4>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '8px 0 0 0'
                }}>{formatDate(actualDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

EstimatedDelivery.propTypes = {
  estimatedDate: PropTypes.string,
  actualDate: PropTypes.string,
  status: PropTypes.string
};

EstimatedDelivery.defaultProps = {
  estimatedDate: null,
  actualDate: null,
  status: 'pending'
};

export default EstimatedDelivery;
