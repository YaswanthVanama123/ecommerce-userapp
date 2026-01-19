# Shipping Notification System - Implementation Guide

## Overview

A comprehensive shipping notification system that sends real-time updates to users via email, SMS, and push notifications for all shipping-related events.

## Features Implemented

### 1. Backend Notification System

**Location:** `/backend/notifications/shippingNotifications.js`

#### Notification Types
- **Shipped:** Sent when order is shipped with tracking number
- **Out for Delivery:** Sent when package is out for delivery
- **Delivered:** Sent when package is successfully delivered
- **Delivery Failed:** Alert sent when delivery attempt fails

#### Notification Channels
- **Email:** Professional HTML email templates
- **SMS:** Text message alerts for critical updates
- **Push:** In-app push notifications
- **Database:** Stored for in-app notification center

#### Key Functions

```javascript
// Send notification when order is shipped
await sendShippedNotification(order, user, {
  trackingNumber: 'TRK123456789',
  carrier: 'FedEx',
  estimatedDelivery: '2024-01-25'
});

// Send notification when out for delivery
await sendOutForDeliveryNotification(order, user, {
  estimatedDeliveryTime: '5:00 PM',
  driverName: 'John Doe',
  driverPhone: '+1234567890'
});

// Send notification when delivered
await sendDeliveredNotification(order, user, {
  deliveredAt: new Date().toISOString(),
  receivedBy: 'Customer',
  signatureImage: 'https://example.com/signature.png'
});

// Send alert for failed delivery
await sendDeliveryFailedNotification(order, user, {
  reason: 'Customer not available',
  attemptDate: '2024-01-24',
  nextAttemptDate: '2024-01-25',
  contactNumber: '+1234567890'
});
```

### 2. Email Templates

**Location:** `/backend/notifications/emailTemplates.js`

#### Professional HTML Templates
- **Shipped:** Includes tracking number, carrier info, estimated delivery
- **Out for Delivery:** Shows delivery time, driver details
- **Delivered:** Confirmation with delivery details, signature
- **Delivery Failed:** Alert with failure reason, next steps

#### Template Features
- Responsive design (mobile-friendly)
- Brand colors and styling
- Professional formatting
- Clear call-to-action buttons
- Order details and tracking information
- Plain text fallback for all emails

### 3. User Notification Preferences

**Location:** `/src/components/notifications/NotificationPreferences.jsx`

#### Preference Controls
Users can enable/disable:
- Email notifications (on/off)
- SMS notifications (on/off)
- Push notifications (on/off)

#### Data Structure
```javascript
user.notificationPreferences = {
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true
}
```

#### Integration
- Integrated into user profile/settings
- Saved to user model
- Respected by all notification functions
- Real-time updates

### 4. Frontend Notification Center

**Location:** `/src/components/notifications/NotificationCenter.jsx`

#### Features
- Real-time notification display
- Unread notification badge
- Filter by type (all, unread, shipping)
- Mark as read functionality
- Mark all as read
- Delete notifications
- Auto-refresh every 2 minutes
- Load more pagination
- Responsive design

#### Notification Icons
- Shipped: Blue package icon
- Out for Delivery: Purple truck icon
- Delivered: Green checkmark icon
- Delivery Failed: Red warning icon

#### Usage
```jsx
import NotificationCenter from './components/notifications/NotificationCenter';

<NotificationCenter
  isOpen={notificationOpen}
  onClose={handleNotificationClose}
/>
```

### 5. Header Notification Bell

**Location:** `/src/components/common/Header.jsx`

#### Features
- Notification bell icon in header
- Unread count badge (shows 9+ for 10 or more)
- Click to open notification center
- Auto-updates count every 2 minutes
- Refreshes on notification center close
- Visible only for authenticated users
- Available on both mobile and desktop

## API Integration

### Notification API Endpoints

Already integrated in `/src/api/index.js`:

```javascript
// Get notifications
notificationApi.getNotifications(params, options)

// Mark notification as read
notificationApi.markAsRead(notificationId)

// Mark all notifications as read
notificationApi.markAllAsRead()

// Delete notification
notificationApi.deleteNotification(notificationId)
```

### Backend API Requirements

Your backend should implement these endpoints:

```
GET    /api/notifications              - Get user notifications
PUT    /api/notifications/:id/read     - Mark notification as read
PUT    /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
PUT    /api/auth/profile                - Update notification preferences
```

## Usage Examples

### 1. Sending Notifications (Backend)

```javascript
import {
  sendShippedNotification,
  sendOutForDeliveryNotification,
  sendDeliveredNotification,
  sendDeliveryFailedNotification
} from './backend/notifications/shippingNotifications.js';

// When order is shipped
const order = await Order.findById(orderId);
const user = await User.findById(order.userId);

await sendShippedNotification(order, user, {
  trackingNumber: order.trackingNumber,
  carrier: order.carrier,
  estimatedDelivery: order.estimatedDelivery
});

// When out for delivery
await sendOutForDeliveryNotification(order, user, {
  estimatedDeliveryTime: '5:00 PM',
  driverName: 'John Doe',
  driverPhone: '+1234567890'
});

// When delivered
await sendDeliveredNotification(order, user, {
  deliveredAt: new Date().toISOString(),
  receivedBy: 'Customer',
  signatureImage: 'https://example.com/signature.png'
});

// When delivery fails
await sendDeliveryFailedNotification(order, user, {
  reason: 'Customer not available',
  attemptDate: new Date().toLocaleDateString(),
  nextAttemptDate: 'Tomorrow',
  contactNumber: 'Customer Support'
});
```

### 2. Managing Preferences (Frontend)

```jsx
import NotificationPreferences from './components/notifications/NotificationPreferences';

// In Profile or Settings page
<NotificationPreferences />
```

### 3. Displaying Notifications (Frontend)

```jsx
import NotificationCenter from './components/notifications/NotificationCenter';
import { useState } from 'react';

function MyComponent() {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <>
      <button onClick={() => setNotificationOpen(true)}>
        Open Notifications
      </button>

      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
}
```

## Configuration

### Email Service Setup

Replace mock email service in `shippingNotifications.js` with actual service:

```javascript
// Example with SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, htmlContent, textContent) => {
  await sgMail.send({
    to,
    from: 'noreply@yourdomain.com',
    subject,
    html: htmlContent,
    text: textContent
  });
};
```

### SMS Service Setup

Replace mock SMS service with actual service:

```javascript
// Example with Twilio
import twilio from 'twilio';
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
  await client.messages.create({
    body: message,
    to: to,
    from: process.env.TWILIO_PHONE_NUMBER
  });
};
```

### Push Notification Setup

Replace mock push service with actual service:

```javascript
// Example with Firebase Cloud Messaging
import admin from 'firebase-admin';

const sendPushNotification = async (userId, title, body, data) => {
  const userToken = await getUserPushToken(userId);

  await admin.messaging().sendToDevice(userToken, {
    notification: { title, body },
    data: data
  });
};
```

## Database Schema

### Notification Model

```javascript
{
  userId: ObjectId,
  type: String, // 'shipped', 'out_for_delivery', 'delivered', 'delivery_failed'
  title: String,
  message: String,
  data: {
    orderId: String,
    trackingNumber: String,
    carrier: String,
    // ... other relevant data
  },
  read: Boolean,
  priority: String, // 'normal', 'high'
  createdAt: Date
}
```

### User Model Update

Add to existing User model:

```javascript
{
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  }
}
```

## Integration Checklist

- [ ] Install email service (SendGrid, AWS SES, etc.)
- [ ] Install SMS service (Twilio, AWS SNS, etc.)
- [ ] Install push notification service (Firebase, OneSignal, etc.)
- [ ] Create notification database model
- [ ] Update user model with preferences
- [ ] Implement backend API endpoints
- [ ] Configure environment variables
- [ ] Test email templates
- [ ] Test SMS delivery
- [ ] Test push notifications
- [ ] Test notification center UI
- [ ] Test preference management

## Environment Variables

Add these to your `.env` file:

```env
# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# SMS Service
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## Styling

The notification system uses Tailwind CSS classes. Colors can be customized:

- Primary: `pink-600` (can be changed to your brand color)
- Success: `green-600`
- Warning: `orange-600`
- Error: `red-600`
- Info: `blue-600`

## Testing

### Test Notification Functions

```javascript
// Test shipped notification
const testOrder = {
  orderId: 'ORD-123',
  items: [{ name: 'Product 1', quantity: 1, price: 29.99 }],
  shippingAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001'
  }
};

const testUser = {
  _id: 'user123',
  email: 'test@example.com',
  phone: '+1234567890',
  name: 'Test User',
  notificationPreferences: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  }
};

await sendShippedNotification(testOrder, testUser, {
  trackingNumber: 'TRK123456789',
  carrier: 'FedEx',
  estimatedDelivery: '2024-01-25'
});
```

## Troubleshooting

### Notifications Not Sending

1. Check user preferences - ensure notifications are enabled
2. Verify email/SMS service credentials
3. Check database for saved notifications
4. Review console logs for errors
5. Verify user has valid email/phone number

### Unread Count Not Updating

1. Check notification API endpoints
2. Verify authentication token
3. Check console for API errors
4. Ensure notifications are being marked as read
5. Refresh page or wait for auto-refresh (2 minutes)

### Email Templates Not Rendering

1. Check email client compatibility
2. Verify HTML syntax
3. Test plain text fallback
4. Check inline styles
5. Test on multiple email clients

## Performance Considerations

- Notification API uses short-term caching (1 minute)
- Auto-refresh runs every 2 minutes to reduce server load
- Pagination loads 20 notifications at a time
- Notification bell icon updates on close to avoid excessive API calls

## Security

- All notification endpoints require authentication
- User can only access their own notifications
- Notification preferences are user-specific
- Email/SMS services should use secure credentials
- Push notification tokens should be encrypted

## Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Rich push notifications with actions
- [ ] Notification sound preferences
- [ ] Email digest option (daily/weekly summary)
- [ ] Notification history export
- [ ] Custom notification templates
- [ ] A/B testing for notification timing
- [ ] Analytics dashboard for notification engagement

## Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Test with mock data
4. Verify configuration
5. Contact development team

## License

This notification system is part of the StyleHub e-commerce platform.

---

**Version:** 1.0.0
**Last Updated:** 2024-01-19
**Author:** StyleHub Development Team
