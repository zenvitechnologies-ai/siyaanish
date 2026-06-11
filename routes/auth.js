const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { sendOtp, verifyOtp } = require("../controllers/authController");
const mailer = require("../config/mailer");

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  const { data: existing } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .single();

  if (existing) return res.status(400).json({ msg: "User exists" });

  const hashed = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("Users").insert([
    {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password: hashed,
    },
  ]);

  if (error) return res.status(500).json({ msg: error.message });

  // ── Send welcome email ─────────────────────────────────────────────────────
  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background:#fff;">
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#ba8245 0%,#8b5a2e 100%);border-radius:12px 12px 0 0;">
      <img src="https://siyaanish.com/static/media/Siyaanishlogo1.71a6246271bee5ae74ab.png" alt="Siyaanish" style="max-width:160px;height:auto;display:block;margin:0 auto;">
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:1px;">Live Your Values</p>
    </div>
    <div style="padding:36px 28px;background:#fff;">
      <h2 style="color:#ba8245;font-weight:300;font-size:26px;margin:0 0 8px;">Welcome to Siyaanish, ${firstName}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Thank you for joining our community of conscious fashion lovers. Your account has been created successfully.
      </p>
      <div style="background:#f8f4ef;border-left:4px solid #ba8245;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 6px;color:#5c3d1a;font-size:14px;font-weight:600;">Account Details</p>
        <p style="margin:0;color:#6b665f;font-size:14px;">📧 ${email}</p>
      </div>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Explore our curated collection of ethical luxury fashion — crafted with care for people and planet.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://siyaanish.com/shop" style="display:inline-block;background:#ba8245;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.5px;">
          Shop Now
        </a>
      </div>
      <div style="background:#fef9f0;border:1px solid #ffe0b3;padding:16px 20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#6b665f;font-size:13px;">Need help? Reach us at <a href="mailto:info@siyaanish.com" style="color:#ba8245;">info@siyaanish.com</a> | +91-7981644655</p>
      </div>
    </div>
    <div style="text-align:center;padding:20px;font-size:11px;color:#999;border-top:1px solid #eee;background:#fafafa;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 6px;">© ${new Date().getFullYear()} Siyaanish. All rights reserved.</p>
      <p style="margin:0;"><a href="https://siyaanish.com/privacy-policy" style="color:#999;text-decoration:none;">Privacy Policy</a> | <a href="https://siyaanish.com/return-policy" style="color:#999;text-decoration:none;">Return Policy</a></p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Welcome to Siyaanish, ${firstName}!

Thank you for joining us. Your account has been created successfully.

Email: ${email}

Explore our ethical luxury fashion at: https://siyaanish.com/shop

Need help? Contact info@siyaanish.com

© ${new Date().getFullYear()} Siyaanish`;

  mailer.sendPostmarkEmail(email, "Welcome to Siyaanish 🌿", htmlBody, textBody)
    .catch(err => console.error("Welcome email error:", err));

  res.json({ msg: "Registered Successfully" });
});

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) return res.status(400).json({ msg: "No user found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.json({ token });
});

module.exports = router;