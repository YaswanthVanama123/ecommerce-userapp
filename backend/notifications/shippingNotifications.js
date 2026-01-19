/**
 * Shipping Notification System
 *
 * Handles all shipping-related notifications:
 * - Email notifications when order is shipped
 * - SMS notifications when out for delivery
 * - Push notifications for delivery status
 * - Alert notifications for failed deliveries
 */

import { emailTemplates } from './emailTemplates.js';

// ============================================================================
// Configuration
// ============================================================================

const NOTIFICATION_TYPES = {
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  DELIVERY_FAILED: 'delivery_failed'
};

const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

// ============================================================================
// Email Service (Mock - Replace with actual email service)
// ============================================================================

/**
 * Send email using configured email service
 * In production, replace with actual email service (SendGrid, AWS SES, etc.)
 */
const sendEmail = async (to, subject, htmlContent, textContent) => {
  try {
    console.log('Sending email:', { to, subject });

    // TODO: Replace with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, subject, html: htmlContent, text: textContent });

    // For now, just log the email
    console.log('Email content:', htmlContent);

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// ============================================================================
// SMS Service (Mock - Replace with actual SMS service)
// ============================================================================

/**
 * Send SMS using configured SMS service
 * In production, replace with actual SMS service (Twilio, AWS SNS, etc.)
 */
const sendSMS = async (to, message) => {
  try {
    console.log('Sending SMS:', { to, message });

    // TODO: Replace with actual SMS service
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: message,
    //   to: to,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    // For now, just log the SMS
    console.log('SMS content:', message);

    return {
      success: true,
      messageId: `sms-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// ============================================================================
// Push Notification Service (Mock - Replace with actual service)
// ============================================================================

/**
 * Send push notification using configured push service
 * In production, replace with actual push service (Firebase, OneSignal, etc.)
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    console.log('Sending push notification:', { userId, title, body, data });

    // TODO: Replace with actual push notification service
    // Example with Firebase Cloud Messaging:
    // const admin = require('firebase-admin');
    // await admin.messaging().sendToDevice(userToken, {
    //   notification: { title, body },
    //   data: data
    // });

    // For now, just log the push notification
    console.log('Push notification:', { title, body, data });

    return {
      success: true,
      messageId: `push-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Push notification failed:', error);
    throw error;
  }
};

// ============================================================================
// Database Service (Mock - Replace with actual database)
// ============================================================================

/**
 * Save notification to database
 */
const saveNotificationToDatabase = async (notificationData) => {
  try {
    // TODO: Replace with actual database save
    // Example with MongoDB:
    // const Notification = require('../models/Notification');
    // await Notification.create(notificationData);

    console.log('Saving notification to database:', notificationData);

    return {
      success: true,
      notificationId: `notif-${Date.now()}`,
      ...notificationData
    };
  } catch (error) {
    console.error('Database save failed:', error);
    throw error;
  }
};

// ============================================================================
// Notification Helper Functions
// ============================================================================

/**
 * Check if user has enabled specific notification channel
 */
const isNotificationEnabled = (user, channel) => {
  if (!user || !user.notificationPreferences) {
    // Default to enabled if no preferences set
    return true;
  }

  const prefs = user.notificationPreferences;

  switch (channel) {
    case NOTIFICATION_CHANNELS.EMAIL:
      return prefs.emailNotifications !== false;
    case NOTIFICATION_CHANNELS.SMS:
      return prefs.smsNotifications !== false;
    case NOTIFICATION_CHANNELS.PUSH:
      return prefs.pushNotifications !== false;
    default:
      return true;
  }
};

/**
 * Format tracking URL
 */
const formatTrackingUrl = (trackingNumber, carrier) => {
  // Common carrier tracking URLs
  const carriers = {
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    default: `#tracking-${trackingNumber}`
  };

  return carriers[carrier?.toLowerCase()] || carriers.default;
};

// ============================================================================
// Main Notification Functions
// ============================================================================

/**
 * Send notification when order is shipped
 */
export const sendShippedNotification = async (order, user, trackingInfo = {}) => {
  try {
    console.log('Sending shipped notification for order:', order.orderId);

    const { trackingNumber, carrier, estimatedDelivery } = trackingInfo;
    const trackingUrl = formatTrackingUrl(trackingNumber, carrier);

    const results = [];

    // Send Email Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.EMAIL)) {
      try {
        const emailData = {
          orderNumber: order.orderId,
          customerName: user.name || user.firstName || 'Valued Customer',
          trackingNumber: trackingNumber || 'N/A',
          trackingUrl,
          carrier: carrier || 'Our Delivery Partner',
          estimatedDelivery: estimatedDelivery || 'Coming Soon',
          items: order.items || [],
          shippingAddress: order.shippingAddress || {}
        };

        const { subject, html, text } = emailTemplates.shipped(emailData);

        const emailResult = await sendEmail(
          user.email,
          subject,
          html,
          text
        );

        results.push({
          channel: 'email',
          success: true,
          result: emailResult
        });
      } catch (error) {
        console.error('Email notification failed:', error);
        results.push({
          channel: 'email',
          success: false,
          error: error.message
        });
      }
    }

    // Send Push Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.PUSH)) {
      try {
        const pushResult = await sendPushNotification(
          user._id || user.id,
          'Order Shipped!',
          `Your order #${order.orderId} has been shipped and is on its way!`,
          {
            orderId: order.orderId,
            trackingNumber,
            type: NOTIFICATION_TYPES.SHIPPED
          }
        );

        results.push({
          channel: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        console.error('Push notification failed:', error);
        results.push({
          channel: 'push',
          success: false,
          error: error.message
        });
      }
    }

    // Save to database for in-app notifications
    try {
      const dbResult = await saveNotificationToDatabase({
        userId: user._id || user.id,
        type: NOTIFICATION_TYPES.SHIPPED,
        title: 'Order Shipped',
        message: `Your order #${order.orderId} has been shipped with tracking number ${trackingNumber}`,
        data: {
          orderId: order.orderId,
          trackingNumber,
          carrier,
          trackingUrl,
          estimatedDelivery
        },
        read: false,
        createdAt: new Date()
      });

      results.push({
        channel: 'database',
        success: true,
        result: dbResult
      });
    } catch (error) {
      console.error('Database save failed:', error);
      results.push({
        channel: 'database',
        success: false,
        error: error.message
      });
    }

    return {
      success: true,
      notificationType: NOTIFICATION_TYPES.SHIPPED,
      results
    };
  } catch (error) {
    console.error('Shipped notification failed:', error);
    throw error;
  }
};

/**
 * Send notification when order is out for delivery
 */
export const sendOutForDeliveryNotification = async (order, user, deliveryInfo = {}) => {
  try {
    console.log('Sending out for delivery notification for order:', order.orderId);

    const { estimatedDeliveryTime, driverName, driverPhone } = deliveryInfo;

    const results = [];

    // Send SMS Notification (Primary for out for delivery)
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.SMS)) {
      try {
        const smsMessage = `Hi ${user.name || 'there'}! Your order #${order.orderId} is out for delivery and will arrive by ${estimatedDeliveryTime || 'today'}. Track: ${formatTrackingUrl(order.trackingNumber, order.carrier)}`;

        const smsResult = await sendSMS(
          user.phone || user.phoneNumber,
          smsMessage
        );

        results.push({
          channel: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        console.error('SMS notification failed:', error);
        results.push({
          channel: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send Email Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.EMAIL)) {
      try {
        const emailData = {
          orderNumber: order.orderId,
          customerName: user.name || user.firstName || 'Valued Customer',
          estimatedDeliveryTime: estimatedDeliveryTime || 'Soon',
          driverName,
          driverPhone,
          items: order.items || [],
          shippingAddress: order.shippingAddress || {}
        };

        const { subject, html, text } = emailTemplates.outForDelivery(emailData);

        const emailResult = await sendEmail(
          user.email,
          subject,
          html,
          text
        );

        results.push({
          channel: 'email',
          success: true,
          result: emailResult
        });
      } catch (error) {
        console.error('Email notification failed:', error);
        results.push({
          channel: 'email',
          success: false,
          error: error.message
        });
      }
    }

    // Send Push Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.PUSH)) {
      try {
        const pushResult = await sendPushNotification(
          user._id || user.id,
          'Out for Delivery!',
          `Your order #${order.orderId} is out for delivery and arriving soon!`,
          {
            orderId: order.orderId,
            estimatedDeliveryTime,
            type: NOTIFICATION_TYPES.OUT_FOR_DELIVERY
          }
        );

        results.push({
          channel: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        console.error('Push notification failed:', error);
        results.push({
          channel: 'push',
          success: false,
          error: error.message
        });
      }
    }

    // Save to database
    try {
      const dbResult = await saveNotificationToDatabase({
        userId: user._id || user.id,
        type: NOTIFICATION_TYPES.OUT_FOR_DELIVERY,
        title: 'Out for Delivery',
        message: `Your order #${order.orderId} is out for delivery and will arrive by ${estimatedDeliveryTime || 'today'}`,
        data: {
          orderId: order.orderId,
          estimatedDeliveryTime,
          driverName,
          driverPhone
        },
        read: false,
        createdAt: new Date()
      });

      results.push({
        channel: 'database',
        success: true,
        result: dbResult
      });
    } catch (error) {
      console.error('Database save failed:', error);
      results.push({
        channel: 'database',
        success: false,
        error: error.message
      });
    }

    return {
      success: true,
      notificationType: NOTIFICATION_TYPES.OUT_FOR_DELIVERY,
      results
    };
  } catch (error) {
    console.error('Out for delivery notification failed:', error);
    throw error;
  }
};

/**
 * Send notification when order is delivered
 */
export const sendDeliveredNotification = async (order, user, deliveryDetails = {}) => {
  try {
    console.log('Sending delivered notification for order:', order.orderId);

    const { deliveredAt, receivedBy, signatureImage } = deliveryDetails;

    const results = [];

    // Send Email Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.EMAIL)) {
      try {
        const emailData = {
          orderNumber: order.orderId,
          customerName: user.name || user.firstName || 'Valued Customer',
          deliveredAt: deliveredAt || new Date().toLocaleString(),
          receivedBy: receivedBy || 'Recipient',
          items: order.items || [],
          orderTotal: order.total || 0,
          signatureImage
        };

        const { subject, html, text } = emailTemplates.delivered(emailData);

        const emailResult = await sendEmail(
          user.email,
          subject,
          html,
          text
        );

        results.push({
          channel: 'email',
          success: true,
          result: emailResult
        });
      } catch (error) {
        console.error('Email notification failed:', error);
        results.push({
          channel: 'email',
          success: false,
          error: error.message
        });
      }
    }

    // Send SMS Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.SMS)) {
      try {
        const smsMessage = `Great news! Your order #${order.orderId} has been delivered. Thank you for shopping with us!`;

        const smsResult = await sendSMS(
          user.phone || user.phoneNumber,
          smsMessage
        );

        results.push({
          channel: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        console.error('SMS notification failed:', error);
        results.push({
          channel: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send Push Notification
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.PUSH)) {
      try {
        const pushResult = await sendPushNotification(
          user._id || user.id,
          'Order Delivered!',
          `Your order #${order.orderId} has been successfully delivered. Enjoy your purchase!`,
          {
            orderId: order.orderId,
            deliveredAt,
            type: NOTIFICATION_TYPES.DELIVERED
          }
        );

        results.push({
          channel: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        console.error('Push notification failed:', error);
        results.push({
          channel: 'push',
          success: false,
          error: error.message
        });
      }
    }

    // Save to database
    try {
      const dbResult = await saveNotificationToDatabase({
        userId: user._id || user.id,
        type: NOTIFICATION_TYPES.DELIVERED,
        title: 'Order Delivered',
        message: `Your order #${order.orderId} has been successfully delivered!`,
        data: {
          orderId: order.orderId,
          deliveredAt,
          receivedBy
        },
        read: false,
        createdAt: new Date()
      });

      results.push({
        channel: 'database',
        success: true,
        result: dbResult
      });
    } catch (error) {
      console.error('Database save failed:', error);
      results.push({
        channel: 'database',
        success: false,
        error: error.message
      });
    }

    return {
      success: true,
      notificationType: NOTIFICATION_TYPES.DELIVERED,
      results
    };
  } catch (error) {
    console.error('Delivered notification failed:', error);
    throw error;
  }
};

/**
 * Send alert when delivery fails
 */
export const sendDeliveryFailedNotification = async (order, user, failureDetails = {}) => {
  try {
    console.log('Sending delivery failed notification for order:', order.orderId);

    const { reason, attemptDate, nextAttemptDate, contactNumber } = failureDetails;

    const results = [];

    // Send Email Alert (High Priority)
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.EMAIL)) {
      try {
        const emailData = {
          orderNumber: order.orderId,
          customerName: user.name || user.firstName || 'Valued Customer',
          reason: reason || 'Unable to deliver',
          attemptDate: attemptDate || new Date().toLocaleDateString(),
          nextAttemptDate: nextAttemptDate || 'To be scheduled',
          contactNumber: contactNumber || 'Customer Support',
          items: order.items || [],
          shippingAddress: order.shippingAddress || {}
        };

        const { subject, html, text } = emailTemplates.deliveryFailed(emailData);

        const emailResult = await sendEmail(
          user.email,
          subject,
          html,
          text
        );

        results.push({
          channel: 'email',
          success: true,
          result: emailResult
        });
      } catch (error) {
        console.error('Email alert failed:', error);
        results.push({
          channel: 'email',
          success: false,
          error: error.message
        });
      }
    }

    // Send SMS Alert (High Priority)
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.SMS)) {
      try {
        const smsMessage = `ALERT: Delivery attempt failed for order #${order.orderId}. Reason: ${reason || 'Unable to deliver'}. We will retry on ${nextAttemptDate || 'next business day'}. Call ${contactNumber || 'support'} for help.`;

        const smsResult = await sendSMS(
          user.phone || user.phoneNumber,
          smsMessage
        );

        results.push({
          channel: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        console.error('SMS alert failed:', error);
        results.push({
          channel: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send Push Alert
    if (isNotificationEnabled(user, NOTIFICATION_CHANNELS.PUSH)) {
      try {
        const pushResult = await sendPushNotification(
          user._id || user.id,
          'Delivery Failed - Action Required',
          `We couldn't deliver order #${order.orderId}. Please contact us to reschedule.`,
          {
            orderId: order.orderId,
            reason,
            priority: 'high',
            type: NOTIFICATION_TYPES.DELIVERY_FAILED
          }
        );

        results.push({
          channel: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        console.error('Push alert failed:', error);
        results.push({
          channel: 'push',
          success: false,
          error: error.message
        });
      }
    }

    // Save to database with high priority
    try {
      const dbResult = await saveNotificationToDatabase({
        userId: user._id || user.id,
        type: NOTIFICATION_TYPES.DELIVERY_FAILED,
        title: 'Delivery Failed - Action Required',
        message: `Delivery attempt failed for order #${order.orderId}. Reason: ${reason || 'Unable to deliver'}`,
        data: {
          orderId: order.orderId,
          reason,
          attemptDate,
          nextAttemptDate,
          contactNumber
        },
        priority: 'high',
        read: false,
        createdAt: new Date()
      });

      results.push({
        channel: 'database',
        success: true,
        result: dbResult
      });
    } catch (error) {
      console.error('Database save failed:', error);
      results.push({
        channel: 'database',
        success: false,
        error: error.message
      });
    }

    return {
      success: true,
      notificationType: NOTIFICATION_TYPES.DELIVERY_FAILED,
      results
    };
  } catch (error) {
    console.error('Delivery failed notification error:', error);
    throw error;
  }
};

// ============================================================================
// Bulk Notification Functions
// ============================================================================

/**
 * Send notification to multiple users
 */
export const sendBulkNotification = async (users, notificationFn, ...args) => {
  try {
    const results = await Promise.allSettled(
      users.map(user => notificationFn(...args, user))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: users.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('Bulk notification failed:', error);
    throw error;
  }
};

// ============================================================================
// Exports
// ============================================================================

export default {
  sendShippedNotification,
  sendOutForDeliveryNotification,
  sendDeliveredNotification,
  sendDeliveryFailedNotification,
  sendBulkNotification,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS
};
