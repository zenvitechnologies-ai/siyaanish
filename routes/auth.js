const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { sendOtp, verifyOtp } = require("../controllers/authController");

// REGISTER
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

  res.json({ msg: "Registered Successfully" });
});

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);


// LOGIN
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