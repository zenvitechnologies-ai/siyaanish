process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Razorpay functions
const { createRazorpayOrder, verifyPayment } = require("./razorpay");

const app = express();

// CORS should be before routes
app.use(cors({
  origin: ['http://localhost:3000', 'https://siyaanish.com']

}));

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Siyaanish Backend Running");
});

// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Admin routes
const adminRoutes = require("./routes/admin");
app.use("/api", adminRoutes);

// Razorpay routes (make sure these are after app.use(express.json()))
app.post('/api/create-razorpay-order', createRazorpayOrder);
app.post('/api/verify-payment', verifyPayment);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));