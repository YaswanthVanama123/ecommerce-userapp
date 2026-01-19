import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosConfig';

/**
 * NotificationSettings Component
 *
 * Allows users to configure their notification preferences across all channels
 * Features:
 * - Toggle notifications per channel (Email, SMS, Push, In-App, WhatsApp)
 * - Configure event-specific preferences
 * - Set quiet hours
 * - Marketing preferences
 * - Minimum priority filter
 * - Push device management
 */

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [activeTab, setActiveTab] = useState('email');

  // Fetch notification preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/notifications/preferences');

      if (response.data.success) {
        setPreferences(response.data.data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      setSaving(true);
      const response = await axiosInstance.put('/notifications/preferences', updates);

      if (response.data.success) {
        setPreferences(response.data.data.preferences);
        toast.success('Preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = async (channel, enabled) => {
    const updates = {
      channels: {
        [channel]: {
          ...preferences.channels[channel],
          enabled
        }
      }
    };

    await updatePreferences(updates);
  };

  const toggleEvent = async (channel, event, enabled) => {
    const updates = {
      channels: {
        [channel]: {
          ...preferences.channels[channel],
          events: {
            ...preferences.channels[channel].events,
            [event]: enabled
          }
        }
      }
    };

    await updatePreferences(updates);
  };

  const updateQuietHours = async (quietHours) => {
    await updatePreferences({ quietHours });
  };

  const updateMarketingPreferences = async (marketing) => {
    await updatePreferences({ marketing });
  };

  const eventLabels = {
    order_placed: 'Order Placed',
    payment_received: 'Payment Received',
    order_confirmed: 'Order Confirmed',
    order_processing: 'Order Processing',
    order_shipped: 'Order Shipped',
    out_for_delivery: 'Out for Delivery',
    order_delivered: 'Order Delivered',
    order_cancelled: 'Order Cancelled',
    return_initiated: 'Return Initiated',
    return_approved: 'Return Approved',
    refund_processed: 'Refund Processed'
  };

  const channelIcons = {
    email: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    sms: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    push: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    inApp: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    whatsapp: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    )
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
        <p className="text-gray-600">Manage how you receive order updates and notifications</p>
      </div>

      {/* Channel Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {Object.keys(preferences.channels).map((channel) => (
              <button
                key={channel}
                onClick={() => setActiveTab(channel)}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition ${
                  activeTab === channel
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className={activeTab === channel ? 'text-pink-600' : 'text-gray-400'}>
                    {channelIcons[channel]}
                  </span>
                  <span className="capitalize">{channel === 'inApp' ? 'In-App' : channel}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Channel Settings */}
        <div className="p-6">
          {/* Channel Enable/Disable */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {activeTab === 'inApp' ? 'In-App' : activeTab} Notifications
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {activeTab === 'email' && 'Receive detailed order updates via email'}
                  {activeTab === 'sms' && 'Get important updates via SMS (important events only)'}
                  {activeTab === 'push' && 'Receive instant push notifications on your devices'}
                  {activeTab === 'inApp' && 'See notifications in the app notification center'}
                  {activeTab === 'whatsapp' && 'Get updates on WhatsApp (important events only)'}
                </p>
              </div>
              <button
                onClick={() => toggleChannel(activeTab, !preferences.channels[activeTab].enabled)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  preferences.channels[activeTab].enabled ? 'bg-pink-600' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    preferences.channels[activeTab].enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Phone Number for SMS/WhatsApp */}
          {(activeTab === 'sms' || activeTab === 'whatsapp') && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={preferences.channels[activeTab].phoneNumber || ''}
                onChange={(e) => {
                  const updates = {
                    channels: {
                      [activeTab]: {
                        ...preferences.channels[activeTab],
                        phoneNumber: e.target.value
                      }
                    }
                  };
                  updatePreferences(updates);
                }}
                placeholder="+91 XXXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={!preferences.channels[activeTab].enabled || saving}
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
            </div>
          )}

          {/* Event-specific preferences */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Notify me for these events:</h4>
            <div className="space-y-3">
              {Object.keys(eventLabels).map((event) => (
                <div key={event} className="flex items-center justify-between py-2">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={preferences.channels[activeTab].events?.[event] !== false}
                      onChange={(e) => toggleEvent(activeTab, event, e.target.checked)}
                      disabled={!preferences.channels[activeTab].enabled || saving}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className="ml-3 text-sm text-gray-700">{eventLabels[event]}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Email Digest Settings */}
          {activeTab === 'email' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Email Digest</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable Email Digest</p>
                    <p className="text-xs text-gray-500">Receive a summary of notifications instead of individual emails</p>
                  </div>
                  <button
                    onClick={() => {
                      const updates = {
                        channels: {
                          email: {
                            ...preferences.channels.email,
                            digest: {
                              ...preferences.channels.email.digest,
                              enabled: !preferences.channels.email.digest.enabled
                            }
                          }
                        }
                      };
                      updatePreferences(updates);
                    }}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      preferences.channels.email.digest.enabled ? 'bg-pink-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences.channels.email.digest.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {preferences.channels.email.digest.enabled && (
                  <div className="ml-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                      <select
                        value={preferences.channels.email.digest.frequency}
                        onChange={(e) => {
                          const updates = {
                            channels: {
                              email: {
                                ...preferences.channels.email,
                                digest: {
                                  ...preferences.channels.email.digest,
                                  frequency: e.target.value
                                }
                              }
                            }
                          };
                          updatePreferences(updates);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={saving}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={preferences.channels.email.digest.time}
                        onChange={(e) => {
                          const updates = {
                            channels: {
                              email: {
                                ...preferences.channels.email,
                                digest: {
                                  ...preferences.channels.email.digest,
                                  time: e.target.value
                                }
                              }
                            }
                          };
                          updatePreferences(updates);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={saving}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pause non-urgent notifications during specific hours
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Enable Quiet Hours</span>
            <button
              onClick={() => updateQuietHours({ ...preferences.quietHours, enabled: !preferences.quietHours.enabled })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                preferences.quietHours.enabled ? 'bg-pink-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.startTime}
                  onChange={(e) => updateQuietHours({ ...preferences.quietHours, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.endTime}
                  onChange={(e) => updateQuietHours({ ...preferences.quietHours, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Preferences */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Preferences</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose what promotional content you'd like to receive
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={preferences.marketing.promotional}
                onChange={(e) => updateMarketingPreferences({ ...preferences.marketing, promotional: e.target.checked })}
                disabled={saving}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Promotional Emails</p>
                <p className="text-xs text-gray-500">Special offers, discounts, and deals</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={preferences.marketing.newArrivals}
                onChange={(e) => updateMarketingPreferences({ ...preferences.marketing, newArrivals: e.target.checked })}
                disabled={saving}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">New Arrivals</p>
                <p className="text-xs text-gray-500">Updates about new products and collections</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={preferences.marketing.specialOffers}
                onChange={(e) => updateMarketingPreferences({ ...preferences.marketing, specialOffers: e.target.checked })}
                disabled={saving}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Special Offers</p>
                <p className="text-xs text-gray-500">Exclusive deals and limited-time offers</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Minimum Priority Filter */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Priority</h3>
        <p className="text-sm text-gray-600 mb-4">
          Only receive notifications at or above this priority level
        </p>

        <select
          value={preferences.minimumPriority}
          onChange={(e) => updatePreferences({ minimumPriority: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          disabled={saving}
        >
          <option value="low">All Notifications (Low and above)</option>
          <option value="medium">Important (Medium and above)</option>
          <option value="high">High Priority Only</option>
          <option value="urgent">Urgent Only</option>
        </select>
      </div>

      {/* Save Indicator */}
      {saving && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
          <span className="text-blue-600 font-medium">Saving preferences...</span>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
