const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  otp: String,
  otpExpiry: Date,
});

module.exports = mongoose.model("User", userSchema);