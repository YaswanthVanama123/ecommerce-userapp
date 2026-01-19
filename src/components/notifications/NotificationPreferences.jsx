import { useState, useEffect } from 'react';
import { useAuthWithActions } from '../../context/AuthContext';
import { authApi } from '../../api';
import { toast } from 'react-toastify';

/**
 * NotificationPreferences Component
 *
 * Allows users to manage their notification preferences:
 * - Email notifications (on/off)
 * - SMS notifications (on/off)
 * - Push notifications (on/off)
 */

const NotificationPreferences = () => {
  const { user, updateUserProfile } = useAuthWithActions();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from user data
  useEffect(() => {
    if (user && user.notificationPreferences) {
      setPreferences({
        emailNotifications: user.notificationPreferences.emailNotifications !== false,
        smsNotifications: user.notificationPreferences.smsNotifications !== false,
        pushNotifications: user.notificationPreferences.pushNotifications !== false
      });
    }
  }, [user]);

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile({
        notificationPreferences: preferences
      });

      if (response.success) {
        updateUserProfile({
          notificationPreferences: preferences
        });
        toast.success('Notification preferences saved successfully');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original preferences
  const resetPreferences = () => {
    if (user && user.notificationPreferences) {
      setPreferences({
        emailNotifications: user.notificationPreferences.emailNotifications !== false,
        smsNotifications: user.notificationPreferences.smsNotifications !== false,
        pushNotifications: user.notificationPreferences.pushNotifications !== false
      });
    } else {
      setPreferences({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true
      });
    }
    setHasChanges(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-600 mt-2">
          Choose how you want to receive shipping and order updates
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receive detailed shipping updates and order confirmations via email
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Order shipped confirmations</li>
                  <li>• Delivery status updates</li>
                  <li>• Order invoices and receipts</li>
                </ul>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get instant text message alerts for critical shipping updates
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Out for delivery alerts</li>
                  <li>• Delivery confirmation messages</li>
                  <li>• Failed delivery notifications</li>
                </ul>
                {user?.phone ? (
                  <p className="text-xs text-gray-500 mt-2">
                    SMS will be sent to: {user.phone}
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 mt-2">
                    Please add a phone number to receive SMS notifications
                  </p>
                )}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                disabled={!user?.phone}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receive in-app notifications for all shipping and order updates
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Real-time shipping status updates</li>
                  <li>• Delivery alerts and confirmations</li>
                  <li>• Order status changes</li>
                </ul>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="mt-8 flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={resetPreferences}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">About Notifications</p>
            <p className="mt-1">
              You can customize how you receive updates about your orders. We recommend keeping at least one notification method enabled to stay informed about your deliveries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
