import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TrackingMap = ({ currentLocation, destinationLocation }) => {
  const [mapError, setMapError] = useState(false);

  // Mock coordinates for demo purposes
  const defaultCurrentLocation = currentLocation || {
    lat: 37.7749,
    lng: -122.4194,
    address: 'San Francisco Distribution Center'
  };

  const defaultDestination = destinationLocation || {
    lat: 34.0522,
    lng: -118.2437,
    address: 'Delivery Address'
  };

  useEffect(() => {
    // In a real implementation, you would initialize a map library here
    // For example: Google Maps, Mapbox, Leaflet, etc.
    setMapError(false);
  }, [currentLocation, destinationLocation]);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#111827',
          margin: 0,
          marginBottom: '24px'
        }}>Current Location</h2>

        {/* Map Container */}
        <div style={{
          position: 'relative',
          background: '#f3f4f6',
          borderRadius: '16px',
          overflow: 'hidden',
          height: '400px'
        }}>
          {!mapError ? (
            <>
              {/* Map Placeholder with Gradient */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom right, #ede9fe, #e0e7ff)'
              }}>
                {/* Decorative Elements to make it look like a map */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.1
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '128px',
                    height: '128px',
                    background: '#a5b4fc',
                    borderRadius: '50%',
                    filter: 'blur(48px)'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    bottom: '25%',
                    right: '25%',
                    width: '160px',
                    height: '160px',
                    background: '#d8b4fe',
                    borderRadius: '50%',
                    filter: 'blur(48px)'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '33%',
                    width: '96px',
                    height: '96px',
                    background: '#c7d2fe',
                    borderRadius: '50%',
                    filter: 'blur(48px)'
                  }}></div>
                </div>

                {/* Grid lines to simulate map */}
                <svg style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.2
                }} xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Current Location Marker */}
                <div style={{
                  position: 'absolute',
                  top: '33%',
                  left: '50%',
                  transform: 'translate(-50%, -100%)'
                }}>
                  <div style={{ position: 'relative' }}>
                    {/* Pulsing animation */}
                    <div style={{
                      position: 'absolute',
                      inset: '-8px',
                      background: '#ec4899',
                      borderRadius: '50%',
                      animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                      opacity: 0.75
                    }}></div>
                    {/* Marker */}
                    <div style={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      padding: '12px',
                      boxShadow: '0 10px 25px rgba(236, 72, 153, 0.4)'
                    }}>
                      <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    background: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      margin: 0
                    }}>Current Location</p>
                  </div>
                </div>

                {/* Destination Marker */}
                <div style={{
                  position: 'absolute',
                  bottom: '25%',
                  right: '33%',
                  transform: 'translate(50%, 0)'
                }}>
                  <div style={{ position: 'relative' }}>
                    {/* Marker */}
                    <div style={{
                      position: 'relative',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      padding: '12px',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
                    }}>
                      <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    background: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      margin: 0
                    }}>Destination</p>
                  </div>
                </div>

                {/* Route Line (curved path) */}
                <svg style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 50% 33% Q 60% 50%, 66% 75%"
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="10,5"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                  />
                </svg>
              </div>

              {/* Info Card Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                padding: '20px',
                maxWidth: '448px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg style={{ width: '24px', height: '24px', color: '#667eea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>Package in Transit</p>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>{defaultCurrentLocation.address}</p>
                  </div>
                </div>
              </div>

              <style>
                {`
                  @keyframes ping {
                    75%, 100% {
                      transform: scale(2);
                      opacity: 0;
                    }
                  }
                  @keyframes pulse {
                    0%, 100% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.5;
                    }
                  }
                `}
              </style>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '24px'
              }}>
                <svg style={{
                  width: '64px',
                  height: '64px',
                  color: '#9ca3af',
                  margin: '0 auto 16px'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p style={{
                  color: '#374151',
                  fontWeight: '500',
                  margin: 0
                }}>Map view unavailable</p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>Location tracking will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Location Details */}
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '2px solid rgba(236, 72, 153, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.15) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    borderRadius: '50%'
                  }}></div>
                </div>
              </div>
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  margin: 0
                }}>Current Location</h4>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  margin: '8px 0 0 0'
                }}>{defaultCurrentLocation.address}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  Lat: {defaultCurrentLocation.lat.toFixed(4)}, Lng: {defaultCurrentLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '2px solid rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '20px', height: '20px', color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  margin: 0
                }}>Destination</h4>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  margin: '8px 0 0 0'
                }}>{defaultDestination.address}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  Lat: {defaultDestination.lat.toFixed(4)}, Lng: {defaultDestination.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Note about map integration */}
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(96, 165, 250, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <svg style={{
              width: '20px',
              height: '20px',
              color: '#3b82f6',
              flexShrink: 0,
              marginTop: '2px'
            }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#1e40af',
                margin: 0
              }}>Map Integration Ready</h5>
              <p style={{
                fontSize: '13px',
                color: '#1e3a8a',
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                This is a placeholder map. Integrate with Google Maps, Mapbox, or Leaflet for real-time location tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

TrackingMap.propTypes = {
  currentLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
    address: PropTypes.string
  }),
  destinationLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
    address: PropTypes.string
  })
};

TrackingMap.defaultProps = {
  currentLocation: null,
  destinationLocation: null
};

export default TrackingMap;
