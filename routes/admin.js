const express = require("express");
const router = express.Router();

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email === "manisha@siyaanish.com" &&
    password === "Manisha@123"
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