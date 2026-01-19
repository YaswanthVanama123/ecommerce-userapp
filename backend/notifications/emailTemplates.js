/**
 * Email Templates for Shipping Notifications
 *
 * Professional, responsive HTML email templates for:
 * - Order Shipped
 * - Out for Delivery
 * - Delivered
 * - Delivery Failed
 */

// ============================================================================
// Shared Email Styles
// ============================================================================

const emailStyles = {
  container: `
    max-width: 600px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #333;
    line-height: 1.6;
  `,
  header: `
    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    color: white;
    padding: 30px 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `,
  body: `
    background: #ffffff;
    padding: 30px 20px;
  `,
  footer: `
    background: #f9fafb;
    padding: 20px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    border-radius: 0 0 8px 8px;
  `,
  button: `
    display: inline-block;
    background: #ec4899;
    color: white;
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
  `,
  infoBox: `
    background: #f3f4f6;
    border-left: 4px solid #ec4899;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 4px;
  `,
  successBox: `
    background: #d1fae5;
    border-left: 4px solid #10b981;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 4px;
  `,
  warningBox: `
    background: #fed7aa;
    border-left: 4px solid #f59e0b;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 4px;
  `,
  errorBox: `
    background: #fee2e2;
    border-left: 4px solid #ef4444;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 4px;
  `
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatAddress = (address) => {
  if (!address) return 'N/A';

  return `
    ${address.street || ''},
    ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}
  `.trim();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const renderItems = (items) => {
  if (!items || items.length === 0) return '';

  return items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${item.name || item.productName || 'Product'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${item.price ? formatCurrency(item.price) : 'N/A'}
      </td>
    </tr>
  `).join('');
};

// ============================================================================
// Template: Order Shipped
// ============================================================================

export const shipped = (data) => {
  const {
    orderNumber,
    customerName,
    trackingNumber,
    trackingUrl,
    carrier,
    estimatedDelivery,
    items,
    shippingAddress
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped!</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="margin: 0; font-size: 28px;">📦 Your Order Has Shipped!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderNumber}</p>
        </div>

        <!-- Body -->
        <div style="${emailStyles.body}">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! Your order has been shipped and is on its way to you.
          </p>

          <!-- Tracking Information -->
          <div style="${emailStyles.infoBox}">
            <h3 style="margin: 0 0 10px 0; color: #ec4899;">Tracking Information</h3>
            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p style="margin: 5px 0;"><strong>Carrier:</strong> ${carrier}</p>
            <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
          </div>

          <!-- Track Order Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="${emailStyles.button}">
              Track Your Order
            </a>
          </div>

          <!-- Shipping Address -->
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Shipping Address</h3>
            <p style="margin: 0; color: #6b7280;">
              ${formatAddress(shippingAddress)}
            </p>
          </div>

          <!-- Order Items -->
          ${items && items.length > 0 ? `
            <div style="margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderItems(items)}
                </tbody>
              </table>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            You will receive another notification when your order is out for delivery.
          </p>
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="margin: 0 0 10px 0;">
            Questions? <a href="#" style="color: #ec4899; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            © 2024 StyleHub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Your Order Has Shipped!

    Order #${orderNumber}

    Hi ${customerName},

    Great news! Your order has been shipped and is on its way to you.

    Tracking Information:
    - Tracking Number: ${trackingNumber}
    - Carrier: ${carrier}
    - Estimated Delivery: ${estimatedDelivery}

    Track your order: ${trackingUrl}

    Shipping Address:
    ${formatAddress(shippingAddress)}

    You will receive another notification when your order is out for delivery.

    Questions? Contact our support team.

    © 2024 StyleHub. All rights reserved.
  `;

  return {
    subject: `📦 Your Order #${orderNumber} Has Shipped!`,
    html,
    text
  };
};

// ============================================================================
// Template: Out for Delivery
// ============================================================================

export const outForDelivery = (data) => {
  const {
    orderNumber,
    customerName,
    estimatedDeliveryTime,
    driverName,
    driverPhone,
    items,
    shippingAddress
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Out for Delivery</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="margin: 0; font-size: 28px;">🚚 Out for Delivery!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderNumber}</p>
        </div>

        <!-- Body -->
        <div style="${emailStyles.body}">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Your order is out for delivery and will arrive soon!
          </p>

          <!-- Delivery Information -->
          <div style="${emailStyles.successBox}">
            <h3 style="margin: 0 0 10px 0; color: #10b981;">Delivery Information</h3>
            <p style="margin: 5px 0;"><strong>Estimated Arrival:</strong> ${estimatedDeliveryTime}</p>
            ${driverName ? `<p style="margin: 5px 0;"><strong>Driver:</strong> ${driverName}</p>` : ''}
            ${driverPhone ? `<p style="margin: 5px 0;"><strong>Contact:</strong> ${driverPhone}</p>` : ''}
          </div>

          <!-- Delivery Address -->
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Delivery Address</h3>
            <p style="margin: 0; color: #6b7280;">
              ${formatAddress(shippingAddress)}
            </p>
          </div>

          <div style="${emailStyles.infoBox}">
            <p style="margin: 0; font-size: 14px;">
              <strong>Please ensure someone is available to receive the delivery.</strong>
              We may need a signature for this order.
            </p>
          </div>

          <!-- Order Items -->
          ${items && items.length > 0 ? `
            <div style="margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Items Being Delivered</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                        ${item.name || item.productName || 'Product'}
                      </td>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                        ${item.quantity || 1}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="margin: 0 0 10px 0;">
            Questions? <a href="#" style="color: #ec4899; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            © 2024 StyleHub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Out for Delivery!

    Order #${orderNumber}

    Hi ${customerName},

    Your order is out for delivery and will arrive soon!

    Delivery Information:
    - Estimated Arrival: ${estimatedDeliveryTime}
    ${driverName ? `- Driver: ${driverName}` : ''}
    ${driverPhone ? `- Contact: ${driverPhone}` : ''}

    Delivery Address:
    ${formatAddress(shippingAddress)}

    Please ensure someone is available to receive the delivery.

    Questions? Contact our support team.

    © 2024 StyleHub. All rights reserved.
  `;

  return {
    subject: `🚚 Your Order #${orderNumber} is Out for Delivery!`,
    html,
    text
  };
};

// ============================================================================
// Template: Delivered
// ============================================================================

export const delivered = (data) => {
  const {
    orderNumber,
    customerName,
    deliveredAt,
    receivedBy,
    items,
    orderTotal,
    signatureImage
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="margin: 0; font-size: 28px;">✅ Order Delivered!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderNumber}</p>
        </div>

        <!-- Body -->
        <div style="${emailStyles.body}">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! Your order has been successfully delivered.
          </p>

          <!-- Delivery Confirmation -->
          <div style="${emailStyles.successBox}">
            <h3 style="margin: 0 0 10px 0; color: #10b981;">Delivery Confirmation</h3>
            <p style="margin: 5px 0;"><strong>Delivered At:</strong> ${deliveredAt}</p>
            <p style="margin: 5px 0;"><strong>Received By:</strong> ${receivedBy}</p>
          </div>

          ${signatureImage ? `
            <div style="margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Delivery Signature</h3>
              <img src="${signatureImage}" alt="Delivery Signature" style="max-width: 300px; border: 1px solid #e5e7eb; border-radius: 4px;">
            </div>
          ` : ''}

          <!-- Order Items -->
          ${items && items.length > 0 ? `
            <div style="margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Items Delivered</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderItems(items)}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${orderTotal ? `
            <div style="text-align: right; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 18px;"><strong>Total: ${formatCurrency(orderTotal)}</strong></p>
            </div>
          ` : ''}

          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="${emailStyles.button}">
              Leave a Review
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            We hope you love your purchase! If you have any issues, please contact our support team.
          </p>
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="margin: 0 0 10px 0;">
            Questions? <a href="#" style="color: #ec4899; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            © 2024 StyleHub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Order Delivered!

    Order #${orderNumber}

    Hi ${customerName},

    Great news! Your order has been successfully delivered.

    Delivery Confirmation:
    - Delivered At: ${deliveredAt}
    - Received By: ${receivedBy}

    We hope you love your purchase! If you have any issues, please contact our support team.

    Questions? Contact our support team.

    © 2024 StyleHub. All rights reserved.
  `;

  return {
    subject: `✅ Your Order #${orderNumber} Has Been Delivered!`,
    html,
    text
  };
};

// ============================================================================
// Template: Delivery Failed
// ============================================================================

export const deliveryFailed = (data) => {
  const {
    orderNumber,
    customerName,
    reason,
    attemptDate,
    nextAttemptDate,
    contactNumber,
    items,
    shippingAddress
  } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delivery Attempt Failed</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="margin: 0; font-size: 28px;">⚠️ Delivery Attempt Failed</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderNumber}</p>
        </div>

        <!-- Body -->
        <div style="${emailStyles.body}">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            We attempted to deliver your order but were unable to complete the delivery.
          </p>

          <!-- Failure Information -->
          <div style="${emailStyles.errorBox}">
            <h3 style="margin: 0 0 10px 0; color: #ef4444;">Delivery Details</h3>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 5px 0;"><strong>Attempt Date:</strong> ${attemptDate}</p>
            <p style="margin: 5px 0;"><strong>Next Attempt:</strong> ${nextAttemptDate}</p>
          </div>

          <!-- Action Required -->
          <div style="${emailStyles.warningBox}">
            <h3 style="margin: 0 0 10px 0; color: #f59e0b;">Action Required</h3>
            <p style="margin: 5px 0;">
              Please contact us to reschedule your delivery or update your delivery instructions.
            </p>
            <p style="margin: 10px 0 0 0;">
              <strong>Contact Number:</strong> ${contactNumber}
            </p>
          </div>

          <!-- Delivery Address -->
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Delivery Address</h3>
            <p style="margin: 0; color: #6b7280;">
              ${formatAddress(shippingAddress)}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
              If this address is incorrect, please update it before the next delivery attempt.
            </p>
          </div>

          <!-- Contact Support Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="${emailStyles.button}">
              Contact Support
            </a>
          </div>

          <!-- Order Items -->
          ${items && items.length > 0 ? `
            <div style="margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                        ${item.name || item.productName || 'Product'}
                      </td>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                        ${item.quantity || 1}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            We apologize for the inconvenience. Our team is ready to help ensure your order reaches you.
          </p>
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="margin: 0 0 10px 0;">
            Questions? <a href="#" style="color: #ec4899; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            © 2024 StyleHub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Delivery Attempt Failed

    Order #${orderNumber}

    Hi ${customerName},

    We attempted to deliver your order but were unable to complete the delivery.

    Delivery Details:
    - Reason: ${reason}
    - Attempt Date: ${attemptDate}
    - Next Attempt: ${nextAttemptDate}

    Action Required:
    Please contact us to reschedule your delivery or update your delivery instructions.
    Contact Number: ${contactNumber}

    Delivery Address:
    ${formatAddress(shippingAddress)}

    We apologize for the inconvenience. Our team is ready to help ensure your order reaches you.

    Questions? Contact our support team.

    © 2024 StyleHub. All rights reserved.
  `;

  return {
    subject: `⚠️ Delivery Failed - Action Required for Order #${orderNumber}`,
    html,
    text
  };
};

// ============================================================================
// Export All Templates
// ============================================================================

export const emailTemplates = {
  shipped,
  outForDelivery,
  delivered,
  deliveryFailed
};

export default emailTemplates;
