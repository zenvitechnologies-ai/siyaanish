// routes/admin.js
const express = require("express");
const router = express.Router();

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({
      success: true,
      role: "admin",
      message: "Admin Login Success",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid Credentials",
  });
});

module.exports = router;