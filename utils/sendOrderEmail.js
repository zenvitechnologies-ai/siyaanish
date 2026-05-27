// utils/sendOrderEmail.js
const mailer = require('../config/mailer');

const generateOrderEmailHTML = (order) => {
  // Calculate subtotal (total - shipping)
  const subtotal = order.total_amount - 100;
  
  // Format items table
  const itemsTable = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.product_name}</strong><br>
        <span style="color: #666; font-size: 12px;">Size: ${item.size || 'N/A'} | Qty: ${item.quantity}</span>
       </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>₹${item.subtotal.toLocaleString()}</strong>
       </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Siyaanish</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      background: linear-gradient(135deg, #ba8245 0%, #8b5a2e 100%);
      border-radius: 12px 12px 0 0;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      letter-spacing: 2px;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px 25px;
      background: white;
    }
    .success-badge {
      text-align: center;
      margin-bottom: 25px;
    }
    .success-badge .checkmark {
      font-size: 64px;
      color: #2c7a3e;
    }
    .order-id-box {
      background: #f8f4ef;
      border-left: 4px solid #ba8245;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .order-id-box p {
      margin: 5px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #ba8245;
      margin: 25px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0e6db;
    }
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .order-table th {
      text-align: left;
      padding: 12px;
      background: #f8f4ef;
      color: #5c3d1a;
      font-weight: 600;
    }
    .order-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .summary-box {
      background: #f8f4ef;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .summary-row.total {
      border-top: 2px solid #ddd;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: bold;
      color: #ba8245;
    }
    .shipping-box {
      background: #f8f4ef;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .shipping-box p {
      margin: 8px 0;
    }
    .track-button {
      display: inline-block;
      background: #ba8245;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
    }
    .support-box {
      background: #fef9f0;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
      text-align: center;
      border: 1px solid #ffe0b3;
    }
    .footer {
      text-align: center;
      padding: 25px;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
      background: #fafafa;
      border-radius: 0 0 12px 12px;
    }
    @media only screen and (max-width: 480px) {
      .container { padding: 10px; }
      .content { padding: 20px 15px; }
      .order-table th, .order-table td { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ SIYAANISH ✨</h1>
      <p>Luxury Redefined</p>
    </div>
    
    <div class="content">
      <div class="success-badge">
        <div class="checkmark">✓</div>
        <h2 style="color: #2c7a3e; margin: 10px 0 5px;">Payment Successful!</h2>
      </div>
      
      <p style="text-align: center;">Dear <strong>${order.customer_name}</strong>,</p>
      <p style="text-align: center;">Thank you for your order! We're excited to confirm that we've received your payment.</p>
      
      <div class="order-id-box">
        <p><strong>📦 Order ID:</strong> #${order.id}</p>
        <p><strong>📅 Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>💰 Payment Status:</strong> <span style="color: #2c7a3e; font-weight: bold;">✓ Paid via Razorpay</span></p>
      </div>
      
      <div class="section-title">🛍️ Order Summary</div>
      <table class="order-table">
        <thead>
          <tr><th>Product</th><th>Details</th><th style="text-align: right;">Amount</th></tr>
        </thead>
        <tbody>
          ${itemsTable}
        </tbody>
      </table>
      
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>₹100</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>₹${order.total_amount.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="section-title">🚚 Shipping Information</div>
      <div class="shipping-box">
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.address}</p>
        <p>${order.city}, ${order.state} - ${order.pincode}</p>
        <p>📞 ${order.phone}</p>
        <p>📧 ${order.email}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://yourstore.com/orders/${order.id}" class="track-button" style="color: white; text-decoration: none;">
          📍 Track Your Order
        </a>
      </div>
      
      <div class="support-box">
        <strong>📦 What's Next?</strong><br>
        We'll process your order within 24 hours and send you tracking information once shipped.
        <br><br>
        <strong>📞 Need Help?</strong><br>
        <a href="mailto:support@siyaanish.com" style="color: #ba8245;">support@siyaanish.com</a> | +91-XXXXXXXXXX
        <br><br>
        <small>Our support team is available Mon-Sat, 10 AM - 7 PM</small>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Siyaanish. All rights reserved.</p>
      <p>This is a transactional email regarding your recent purchase.</p>
      <p>Siyaanish - Your Trusted Fashion Destination</p>
      <p style="margin-top: 15px;">
        <a href="https://yourstore.com/privacy" style="color: #999;">Privacy Policy</a> | 
        <a href="https://yourstore.com/returns" style="color: #999;">Return Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

const generateOrderEmailText = (order) => {
  const subtotal = order.total_amount - 100;
  
  const itemsList = order.items.map(item => 
    `  - ${item.product_name} (${item.size || 'N/A'}) x${item.quantity} = ₹${item.subtotal}`
  ).join('\n');
  
  return `SIYAANISH - ORDER CONFIRMATION #${order.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${order.customer_name},

Thank you for your order! Payment confirmed successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER DETAILS:
Order ID: #${order.id}
Date: ${new Date().toLocaleDateString('en-IN')}
Status: PAID via Razorpay

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER SUMMARY:
${itemsList}

Subtotal: ₹${subtotal}
Shipping: ₹100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ₹${order.total_amount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SHIPPING ADDRESS:
${order.customer_name}
${order.address}
${order.city}, ${order.state} - ${order.pincode}
Phone: ${order.phone}
Email: ${order.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT?
We'll process your order within 24 hours and send tracking information once shipped.

Track your order: https://yourstore.com/orders/${order.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact support@siyaanish.com

Thank you for shopping with Siyaanish!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} Siyaanish - Luxury Redefined`;
};

const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log(`📧 Sending order confirmation email for order #${order.id} to ${order.email}`);
    
    const htmlContent = generateOrderEmailHTML(order);
    const textContent = generateOrderEmailText(order);
    
    // Use Postmark to send email
    const result = await mailer.sendPostmarkEmail(
      order.email,
      `Order Confirmation #${order.id} - Siyaanish ✨`,
      htmlContent,
      textContent
    );
    
    if (result.success) {
      console.log(`✅ Order confirmation email sent successfully! MessageID: ${result.messageId}`);
    } else {
      console.error(`❌ Failed to send email: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in sendOrderConfirmationEmail:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOrderConfirmationEmail };