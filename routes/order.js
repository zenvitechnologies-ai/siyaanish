// routes/order.js
const { sendOrderConfirmationEmail } = require('../utils/sendOrderEmail');

// Your existing payment verification endpoint
router.post('/verify-payment', async (req, res) => {
  try {
    // ... your existing verification logic ...
    
    // After successfully updating order status to 'paid'
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    // ✅ Send order confirmation email via Postmark
    // Don't await - let it run in background so it doesn't slow response
    sendOrderConfirmationEmail(order).catch(err => 
      console.error('Email sending failed:', err)
    );
    
    res.json({ success: true, order });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});