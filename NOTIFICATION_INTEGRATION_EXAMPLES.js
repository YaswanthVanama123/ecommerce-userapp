/**
 * Shipping Notification System - Integration Examples
 *
 * This file shows how to integrate the shipping notification system
 * into your existing order processing workflow.
 */

// ============================================================================
// Backend Integration Examples
// ============================================================================

// Example 1: Integrate into Order Shipment Controller
// File: backend/controllers/orderController.js

import {
  sendShippedNotification,
  sendOutForDeliveryNotification,
  sendDeliveredNotification,
  sendDeliveryFailedNotification
} from '../notifications/shippingNotifications.js';

// When admin marks order as shipped
export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'shipped',
        trackingNumber,
        carrier,
        estimatedDelivery,
        shippedAt: new Date()
      },
      { new: true }
    ).populate('items.product');

    // Get user details
    const user = await User.findById(order.userId);

    // Send shipped notification
    await sendShippedNotification(order, user, {
      trackingNumber,
      carrier,
      estimatedDelivery
    });

    res.json({
      success: true,
      message: 'Order shipped successfully',
      order
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ship order',
      error: error.message
    });
  }
};

// When delivery partner updates status to "out for delivery"
export const markOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estimatedDeliveryTime, driverName, driverPhone } = req.body;

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'out_for_delivery',
        outForDeliveryAt: new Date(),
        deliveryDetails: {
          estimatedDeliveryTime,
          driverName,
          driverPhone
        }
      },
      { new: true }
    ).populate('items.product');

    // Get user details
    const user = await User.findById(order.userId);

    // Send out for delivery notification
    await sendOutForDeliveryNotification(order, user, {
      estimatedDeliveryTime,
      driverName,
      driverPhone
    });

    res.json({
      success: true,
      message: 'Order marked as out for delivery',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// When order is delivered
export const markDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receivedBy, signatureImage } = req.body;

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'delivered',
        deliveredAt: new Date(),
        deliveryConfirmation: {
          receivedBy,
          signatureImage,
          confirmedAt: new Date()
        }
      },
      { new: true }
    ).populate('items.product');

    // Get user details
    const user = await User.findById(order.userId);

    // Send delivered notification
    await sendDeliveredNotification(order, user, {
      deliveredAt: new Date().toLocaleString(),
      receivedBy,
      signatureImage
    });

    res.json({
      success: true,
      message: 'Order delivered successfully',
      order
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as delivered',
      error: error.message
    });
  }
};

// When delivery fails
export const markDeliveryFailed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, nextAttemptDate, contactNumber } = req.body;

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'delivery_failed',
        deliveryFailure: {
          reason,
          attemptDate: new Date(),
          nextAttemptDate,
          failedAt: new Date()
        }
      },
      { new: true }
    ).populate('items.product');

    // Get user details
    const user = await User.findById(order.userId);

    // Send delivery failed notification
    await sendDeliveryFailedNotification(order, user, {
      reason,
      attemptDate: new Date().toLocaleDateString(),
      nextAttemptDate,
      contactNumber: contactNumber || 'Customer Support'
    });

    res.json({
      success: true,
      message: 'Order marked as delivery failed',
      order
    });
  } catch (error) {
    console.error('Error marking delivery as failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark delivery as failed',
      error: error.message
    });
  }
};

// ============================================================================
// Example 2: Webhook Integration (e.g., from shipping provider)
// ============================================================================

// File: backend/controllers/webhookController.js

export const handleShippingWebhook = async (req, res) => {
  try {
    const { event, orderId, trackingNumber, status, data } = req.body;

    // Verify webhook signature (implement based on your provider)
    // const isValid = verifyWebhookSignature(req);
    // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    const order = await Order.findOne({ orderId }).populate('items.product');
    const user = await User.findById(order.userId);

    switch (status) {
      case 'shipped':
        await Order.updateOne({ orderId }, { status: 'shipped', trackingNumber });
        await sendShippedNotification(order, user, {
          trackingNumber,
          carrier: data.carrier,
          estimatedDelivery: data.estimatedDelivery
        });
        break;

      case 'out_for_delivery':
        await Order.updateOne({ orderId }, { status: 'out_for_delivery' });
        await sendOutForDeliveryNotification(order, user, {
          estimatedDeliveryTime: data.estimatedDeliveryTime,
          driverName: data.driverName,
          driverPhone: data.driverPhone
        });
        break;

      case 'delivered':
        await Order.updateOne({ orderId }, { status: 'delivered', deliveredAt: new Date() });
        await sendDeliveredNotification(order, user, {
          deliveredAt: new Date().toLocaleString(),
          receivedBy: data.receivedBy || 'Recipient'
        });
        break;

      case 'failed':
        await Order.updateOne({ orderId }, { status: 'delivery_failed' });
        await sendDeliveryFailedNotification(order, user, {
          reason: data.reason,
          attemptDate: new Date().toLocaleDateString(),
          nextAttemptDate: data.nextAttemptDate || 'To be scheduled',
          contactNumber: 'Customer Support'
        });
        break;

      default:
        console.log('Unknown webhook event:', status);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// ============================================================================
// Example 3: Bulk Notification Sending
// ============================================================================

// Send notifications to multiple users at once
import { sendBulkNotification } from '../notifications/shippingNotifications.js';

export const notifyMultipleOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Get all orders and users
    const orders = await Order.find({ _id: { $in: orderIds } }).populate('items.product');
    const userIds = orders.map(order => order.userId);
    const users = await User.find({ _id: { $in: userIds } });

    // Create user map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Send notifications
    const results = await Promise.all(
      orders.map(async (order) => {
        const user = userMap[order.userId.toString()];
        try {
          await sendShippedNotification(order, user, {
            trackingNumber: order.trackingNumber,
            carrier: order.carrier,
            estimatedDelivery: order.estimatedDelivery
          });
          return { orderId: order.orderId, success: true };
        } catch (error) {
          return { orderId: order.orderId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Sent notifications to ${successful} orders, ${failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
};

// ============================================================================
// Frontend Integration Examples
// ============================================================================

// Example 4: Add Notification Preferences to Profile Page
// File: src/pages/Profile.jsx

import NotificationPreferences from '../components/notifications/NotificationPreferences';

// Add this as a new tab in your profile page
const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-pink-600' : ''}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 ${activeTab === 'orders' ? 'border-b-2 border-pink-600' : ''}`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 ${activeTab === 'notifications' ? 'border-b-2 border-pink-600' : ''}`}
        >
          Notifications
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileInfo />}
      {activeTab === 'orders' && <OrderHistory />}
      {activeTab === 'notifications' && <NotificationPreferences />}
    </div>
  );
};

// Example 5: Show Notifications in Order History
// File: src/pages/OrderHistory.jsx

import { useState, useEffect } from 'react';
import { orderApi, notificationApi } from '../api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchOrdersAndNotifications();
  }, []);

  const fetchOrdersAndNotifications = async () => {
    try {
      const [ordersResponse, notificationsResponse] = await Promise.all([
        orderApi.getMyOrders(),
        notificationApi.getNotifications({ page: 1, limit: 50 })
      ]);

      setOrders(ordersResponse.data.orders || []);
      setNotifications(notificationsResponse.data.notifications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Get notifications for specific order
  const getOrderNotifications = (orderId) => {
    return notifications.filter(
      notif => notif.data && notif.data.orderId === orderId
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>

      {orders.map(order => (
        <div key={order._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium">{order.status}</span>
              </p>
            </div>
            <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
          </div>

          {/* Order Notifications */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Shipping Updates</h4>
            {getOrderNotifications(order.orderId).length > 0 ? (
              <div className="space-y-2">
                {getOrderNotifications(order.orderId).map(notif => (
                  <div key={notif._id} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No updates yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Example 6: Testing Notifications
// ============================================================================

// File: backend/tests/notificationTest.js

// Test function to send sample notifications
export const testNotifications = async () => {
  // Mock order data
  const testOrder = {
    orderId: 'TEST-001',
    items: [
      {
        name: 'Stylish T-Shirt',
        quantity: 2,
        price: 29.99,
        productName: 'Stylish T-Shirt'
      },
      {
        name: 'Designer Jeans',
        quantity: 1,
        price: 79.99,
        productName: 'Designer Jeans'
      }
    ],
    total: 139.97,
    shippingAddress: {
      street: '123 Fashion Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    trackingNumber: 'TRK123456789',
    carrier: 'FedEx'
  };

  // Mock user data
  const testUser = {
    _id: 'test-user-123',
    email: 'test@example.com',
    phone: '+1234567890',
    name: 'Test User',
    firstName: 'Test',
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true
    }
  };

  console.log('Testing shipped notification...');
  await sendShippedNotification(testOrder, testUser, {
    trackingNumber: 'TRK123456789',
    carrier: 'FedEx',
    estimatedDelivery: 'Friday, Jan 26'
  });

  console.log('Testing out for delivery notification...');
  await sendOutForDeliveryNotification(testOrder, testUser, {
    estimatedDeliveryTime: '5:00 PM',
    driverName: 'John Delivery',
    driverPhone: '+1234567890'
  });

  console.log('Testing delivered notification...');
  await sendDeliveredNotification(testOrder, testUser, {
    deliveredAt: new Date().toLocaleString(),
    receivedBy: 'Customer'
  });

  console.log('Testing delivery failed notification...');
  await sendDeliveryFailedNotification(testOrder, testUser, {
    reason: 'Customer not available',
    attemptDate: new Date().toLocaleDateString(),
    nextAttemptDate: 'Tomorrow',
    contactNumber: '+1234567890'
  });

  console.log('All tests completed!');
};

// Run tests
// testNotifications();

export default {
  shipOrder,
  markOutForDelivery,
  markDelivered,
  markDeliveryFailed,
  handleShippingWebhook,
  notifyMultipleOrders,
  testNotifications
};
