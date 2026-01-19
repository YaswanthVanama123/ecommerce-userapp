import PropTypes from 'prop-types';

const TrackingTimeline = ({ trackingHistory, currentStatus }) => {
  const statusSteps = [
    {
      key: 'ordered',
      label: 'Order Placed',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'processing',
      label: 'Processing',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      key: 'shipped',
      label: 'Shipped',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ];

  const getStepStatus = (step) => {
    const statusMap = {
      pending: 0,
      ordered: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      out_for_delivery: 4,
      delivered: 5
    };

    const currentStepIndex = statusMap[currentStatus] || 0;
    const stepIndex = statusMap[step.key] || 0;

    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHistoryForStep = (stepKey) => {
    if (!trackingHistory || trackingHistory.length === 0) return null;

    return trackingHistory.find(history =>
      history.status?.toLowerCase() === stepKey.toLowerCase() ||
      (stepKey === 'ordered' && history.status?.toLowerCase() === 'pending')
    );
  };

  const currentStepIndex = statusSteps.findIndex(s => getStepStatus(s) === 'current');
  const progressPercentage = currentStepIndex >= 0
    ? (currentStepIndex / (statusSteps.length - 1)) * 100
    : 0;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      padding: '32px'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        margin: 0,
        marginBottom: '32px'
      }}>Tracking Timeline</h2>

      {/* Desktop Timeline */}
      <div style={{
        display: window.innerWidth >= 768 ? 'block' : 'none'
      }}>
        <div style={{ position: 'relative' }}>
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            top: '32px',
            left: 0,
            right: 0,
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '9999px'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)',
              borderRadius: '9999px',
              width: `${progressPercentage}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* Steps */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {statusSteps.map((step) => {
              const status = getStepStatus(step);
              const history = getHistoryForStep(step.key);

              return (
                <div key={step.key} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: `${100 / statusSteps.length}%`
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: status === 'completed' || status === 'current'
                      ? '4px solid #ec4899'
                      : '4px solid #d1d5db',
                    background: '#ffffff',
                    color: status === 'completed' || status === 'current'
                      ? '#ec4899'
                      : '#9ca3af',
                    transition: 'all 0.3s ease',
                    boxShadow: status === 'current'
                      ? '0 0 0 8px rgba(236, 72, 153, 0.1)'
                      : 'none'
                  }}>
                    {status === 'completed' ? (
                      <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Label */}
                  <p style={{
                    marginTop: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: status === 'completed' || status === 'current'
                      ? '#111827'
                      : '#6b7280',
                    margin: '16px 0 0 0'
                  }}>
                    {step.label}
                  </p>

                  {/* Date */}
                  {history && (
                    <p style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#6b7280',
                      textAlign: 'center',
                      margin: '8px 0 0 0'
                    }}>
                      {formatDate(history.timestamp || history.createdAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline */}
      <div style={{
        display: window.innerWidth < 768 ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {statusSteps.map((step, index) => {
          const status = getStepStatus(step);
          const history = getHistoryForStep(step.key);

          return (
            <div key={step.key} style={{ display: 'flex' }}>
              {/* Left Side - Icon and Line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginRight: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: status === 'completed' || status === 'current'
                    ? '4px solid #ec4899'
                    : '4px solid #d1d5db',
                  background: '#ffffff',
                  color: status === 'completed' || status === 'current'
                    ? '#ec4899'
                    : '#9ca3af',
                  transition: 'all 0.3s ease',
                  boxShadow: status === 'current'
                    ? '0 0 0 6px rgba(236, 72, 153, 0.1)'
                    : 'none'
                }}>
                  {status === 'completed' ? (
                    <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                {index < statusSteps.length - 1 && (
                  <div style={{
                    width: '4px',
                    flexGrow: 1,
                    marginTop: '4px',
                    marginBottom: '4px',
                    background: status === 'completed'
                      ? 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)'
                      : '#e5e7eb',
                    minHeight: '40px',
                    borderRadius: '9999px'
                  }} />
                )}
              </div>

              {/* Right Side - Content */}
              <div style={{
                flexGrow: 1,
                paddingBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: status === 'completed' || status === 'current'
                    ? '#111827'
                    : '#6b7280',
                  margin: 0
                }}>
                  {step.label}
                </h3>
                {history && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#374151',
                      margin: 0
                    }}>
                      {formatDate(history.timestamp || history.createdAt)}
                    </p>
                    {history.location && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '4px',
                        margin: '4px 0 0 0'
                      }}>
                        {history.location}
                      </p>
                    )}
                    {history.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '4px',
                        margin: '4px 0 0 0'
                      }}>
                        {history.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed History */}
      {trackingHistory && trackingHistory.length > 0 && (
        <div style={{
          marginTop: '32px',
          paddingTop: '32px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '20px',
            margin: 0
          }}>Detailed History</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {trackingHistory.map((history, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                fontSize: '14px'
              }}>
                <div style={{
                  flexShrink: 0,
                  width: '8px',
                  height: '8px',
                  marginTop: '6px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                }} />
                <div style={{ flexGrow: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <p style={{
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>
                      {history.status?.charAt(0).toUpperCase() + history.status?.slice(1)}
                    </p>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      margin: 0
                    }}>
                      {formatDate(history.timestamp || history.createdAt)}
                    </p>
                  </div>
                  {history.location && (
                    <p style={{
                      color: '#374151',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>{history.location}</p>
                  )}
                  {history.description && (
                    <p style={{
                      color: '#6b7280',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>{history.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

TrackingTimeline.propTypes = {
  trackingHistory: PropTypes.arrayOf(PropTypes.shape({
    status: PropTypes.string,
    timestamp: PropTypes.string,
    createdAt: PropTypes.string,
    location: PropTypes.string,
    description: PropTypes.string
  })),
  currentStatus: PropTypes.string.isRequired
};

TrackingTimeline.defaultProps = {
  trackingHistory: []
};

export default TrackingTimeline;
