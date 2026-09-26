const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ── Startup env check (names only, never values) ─────────────────────────────
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) console.warn("⚠️ Missing environment variables:", missingEnv.join(", "));

const { createRazorpayOrder, verifyPayment } = require("./razorpay");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Set ALLOWED_ORIGINS on Render (comma-separated) to lock the API to your sites,
// e.g. https://siyaanish.com,https://www.siyaanish.com,http://localhost:3000
// If it is not set, any origin is allowed (previous behaviour).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length
    ? (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error("Not allowed by CORS"))
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get("/", (req, res) => res.send("Siyaanish Backend Running"));

// Health check: open https://<your-render-url>/api/health to confirm the API + Supabase work
app.get("/api/health", async (req, res) => {
  const supabase = require("./config/supabase");
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true });
  if (error) return res.status(500).json({ ok: false, database: "error", message: error.message });
  res.json({ ok: true, database: "connected", products: count });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/admin"));

// Test endpoint (commented out for production)
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
