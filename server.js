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
app.options('/{*path}', cors(corsOptions)); // ✅ fixed wildcard

app.use(express.json());

app.get("/", (req, res) => res.send("Siyaanish Backend Running"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/admin"));

app.post('/api/create-razorpay-order', createRazorpayOrder);
app.post('/api/verify-payment', verifyPayment);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));