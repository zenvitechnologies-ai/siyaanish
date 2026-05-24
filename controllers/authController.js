console.log("RESEND KEY:", process.env.RESEND_API_KEY);
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const { Resend } = require("resend");

console.log("=== AUTH CONTROLLER LOADED ===");
console.log("RESEND KEY AT START:", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

// ================= SEND OTP =================
// ================= SEND OTP =================
const sendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    // ===== FETCH USER =====
    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) return res.status(500).json({ msg: "DB Fetch Error" });
    if (!user) return res.status(400).json({ msg: "Email not found" });

    // ===== GENERATE OTP =====
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ===== STORE OTP =====
    const { error: updateError } = await supabase
      .from("Users")
      .update({
        otp: otp,
        otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
      })
      .eq("email", user.email);

    if (updateError)
      return res.status(500).json({ msg: "DB Update Error" });

    // ===== SEND EMAIL =====
    await resend.emails.send({
      from: "noreply@luxcoat.in",
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is ${otp}</h2>
            <p>This OTP expires in 5 minutes.</p>`
    });

    res.json({ msg: "OTP Sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Mail Failed" });
  }
};

// ================= VERIFY OTP =================
const verifyOtp = async (req, res) => {
  console.log("---- VERIFY OTP FUNCTION CALLED ----");

  try {
    let { email, otp, newPassword } = req.body;

    console.log("RAW VERIFY EMAIL:", email);
    email = email.trim().toLowerCase();
    console.log("FORMATTED VERIFY EMAIL:", email);
    console.log("OTP ENTERED:", otp);

    // ===== FETCH USER =====
    console.log("FETCHING USER FOR VERIFY...");
    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("SUPABASE FETCH ERROR:", error);
      return res.status(500).json({ msg: "DB Fetch Error" });
    }

    if (!user) {
      console.warn("VERIFY USER NOT FOUND");
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    console.log("USER FOUND FOR VERIFY:", user.email);

    // ===== OTP VALIDATION =====
    if (user.otp !== otp) {
      console.warn("OTP MISMATCH");
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (new Date(user.otp_expiry) < new Date()) {
      console.warn("OTP EXPIRED");
      return res.status(400).json({ msg: "OTP Expired" });
    }

    console.log("OTP VALIDATED SUCCESS");

    // ===== HASH PASSWORD =====
    console.log("HASHING NEW PASSWORD...");
    const hashed = await bcrypt.hash(newPassword, 10);
    console.log("PASSWORD HASHED");

    // ===== UPDATE PASSWORD =====
    console.log("UPDATING PASSWORD IN DB...");
    const { error: updateError } = await supabase
      .from("Users")
      .update({
        password: hashed,
        otp: null,
        otp_expiry: null,
      })
      .eq("email", user.email);

    if (updateError) {
      console.error("SUPABASE PASSWORD UPDATE ERROR:", updateError);
      return res.status(500).json({ msg: "Password Update Error" });
    }

    console.log("PASSWORD UPDATED SUCCESSFULLY");
    res.json({ msg: "Password Updated" });

  } catch (err) {
    console.error("VERIFY OTP GLOBAL ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

module.exports = { sendOtp, verifyOtp };