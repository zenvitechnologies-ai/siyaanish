// razorpay.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order endpoint handler
const createRazorpayOrder = async (req, res) => {
  try {
    console.log('Creating Razorpay order with body:', req.body);
    
    const { orderId, amount, currency } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount is required' 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise (remove decimal)
      currency: currency || 'INR',
      receipt: `receipt_${orderId || Date.now()}`,
      notes: {
        order_id: orderId || 'temp_order',
      },
    };

    console.log('Razorpay options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Razorpay order created:', order);

    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Verify payment endpoint handler
const verifyPayment = async (req, res) => {
  try {
    console.log('Verifying payment with body:', req.body);
    
    const { order_id, payment_id, signature, db_order_id } = req.body;

    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (isValid) {
      // Payment is verified successfully
      console.log('Payment verified successfully for order:', db_order_id);
      
      res.json({ 
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      console.error('Invalid signature for payment:', payment_id);
      res.status(400).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = { createRazorpayOrder, verifyPayment };