const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createRazorpayOrder, verifyPayment } = require("./razorpay");

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5000',
      'http://localhost:3000',
      'https://siyaanish.com',
      'https://www.siyaanish.com',
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ Fixed wildcard

app.use(express.json());

app.get("/", (req, res) => res.send("Siyaanish Backend Running"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/admin"));

// ✅ TEST ENDPOINT - KEEP ONLY FOR TESTING, REMOVE BEFORE PRODUCTION
// Uncomment this block ONLY when testing, comment out or delete for production
/*
app.post('/api/test-email', async (req, res) => {
  const { sendOrderConfirmationEmail } = require('./utils/sendOrderEmail');
  
  const testOrder = {
    id: 9999,
    customer_name: "Test Customer",
    email: "info@siyaanish.com",
    total_amount: 1099,
    address: "123 Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "9876543210",
    items: [
      {
        product_name: "Test Product",
        product_image: "https://via.placeholder.com/60",
        size: "M",
        quantity: 1,
        price: 999,
        subtotal: 999
      }
    ]
  };
  
  const result = await sendOrderConfirmationEmail(testOrder);
  res.json(result);
});
*/

app.post('/api/create-razorpay-order', createRazorpayOrder);
app.post('/api/verify-payment', verifyPayment);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));