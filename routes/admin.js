// routes/admin.js
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const mailer = require("../config/mailer");

// ── Admin login ───────────────────────────────────────────────────────────────
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, role: "admin", message: "Admin Login Success" });
  }
  return res.status(401).json({ success: false, message: "Invalid Credentials" });
});

// ── Assign courier tracking number → sends "Order Shipped" email ──────────────
router.post("/assign-tracking", async (req, res) => {
  const { orderId, trackingNumber, courierName } = req.body;

  if (!orderId || !trackingNumber) {
    return res.status(400).json({ success: false, message: "orderId and trackingNumber required" });
  }

  // Update order in Supabase
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      tracking_number: trackingNumber,
      courier_name: courierName || null,
      status: "shipped",
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Send shipped email
  const recipientEmail = order.email;
  const customerName = order.customer_name || recipientEmail;

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background:#fff;">
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#ba8245 0%,#8b5a2e 100%);border-radius:12px 12px 0 0;">
      <img src="https://siyaanish.com/static/media/Siyaanishlogo1.71a6246271bee5ae74ab.png" alt="Siyaanish" style="max-width:160px;height:auto;display:block;margin:0 auto;">
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:1px;">Live Your Values</p>
    </div>
    <div style="padding:36px 28px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;">🚚</div>
        <h2 style="color:#ba8245;font-weight:300;font-size:24px;margin:8px 0 4px;">Your Order is Shipped!</h2>
        <p style="color:#888;font-size:13px;margin:0;">Great news — it's on its way to you</p>
      </div>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Dear <strong>${customerName}</strong>, your order <strong>#${order.id}</strong> has been dispatched and is ready for tracking.
      </p>
      <div style="background:#f8f4ef;border-left:4px solid #ba8245;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#5c3d1a;font-size:14px;font-weight:600;">📦 Shipment Details</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Order ID:</strong> #${order.id}</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Tracking Number:</strong> <span style="color:#ba8245;font-weight:600;">${trackingNumber}</span></p>
        ${courierName ? `<p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Courier:</strong> ${courierName}</p>` : ""}
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Status:</strong> <span style="color:#2c7a3e;font-weight:600;">✓ Shipped</span></p>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://siyaanish.com/track-order" style="display:inline-block;background:#ba8245;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.5px;">
          📍 Track Your Order
        </a>
      </div>
      <div style="background:#fef9f0;border:1px solid #ffe0b3;padding:16px 20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#6b665f;font-size:13px;">Need help? <a href="mailto:info@siyaanish.com" style="color:#ba8245;">info@siyaanish.com</a> | +91-7981644655</p>
        <p style="margin:6px 0 0;color:#999;font-size:11px;">Mon–Sat, 10 AM – 7 PM</p>
      </div>
    </div>
    <div style="text-align:center;padding:20px;font-size:11px;color:#999;border-top:1px solid #eee;background:#fafafa;border-radius:0 0 12px 12px;">
      <p style="margin:0;">© ${new Date().getFullYear()} Siyaanish. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Your Order is Shipped!

Dear ${customerName},

Your order #${order.id} has been shipped and is ready for tracking.

Tracking Number: ${trackingNumber}
${courierName ? `Courier: ${courierName}` : ""}

Track your order at: https://siyaanish.com/track-order

Need help? info@siyaanish.com

© ${new Date().getFullYear()} Siyaanish`;

  mailer.sendPostmarkEmail(
    recipientEmail,
    `Your Order #${order.id} Has Been Shipped! 🚚`,
    htmlBody,
    textBody
  ).catch(err => console.error("Shipped email error:", err));

  res.json({ success: true, order });
});

// ── Return submitted: send confirmation email to customer ─────────────────────
router.post("/return-submitted", async (req, res) => {
  const { returnId, customerEmail, customerName, orderId, reason } = req.body;

  if (!customerEmail || !orderId) {
    return res.status(400).json({ success: false, message: "customerEmail and orderId required" });
  }

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background:#fff;">
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#ba8245 0%,#8b5a2e 100%);border-radius:12px 12px 0 0;">
      <img src="https://siyaanish.com/static/media/Siyaanishlogo1.71a6246271bee5ae74ab.png" alt="Siyaanish" style="max-width:160px;height:auto;display:block;margin:0 auto;">
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:1px;">Live Your Values</p>
    </div>
    <div style="padding:36px 28px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;">↩️</div>
        <h2 style="color:#ba8245;font-weight:300;font-size:24px;margin:8px 0 4px;">Return Request Received</h2>
        <p style="color:#888;font-size:13px;margin:0;">We've received your return request and will review it shortly</p>
      </div>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Dear <strong>${customerName || customerEmail}</strong>, your return request for order <strong>#${orderId}</strong> has been submitted successfully.
      </p>
      <div style="background:#f8f4ef;border-left:4px solid #ba8245;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#5c3d1a;font-size:14px;font-weight:600;">📦 Return Details</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Return ID:</strong> <span style="color:#ba8245;font-weight:600;">#${returnId}</span></p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Status:</strong> <span style="color:#d97706;font-weight:600;">Pending Review</span></p>
      </div>
      <div style="background:#fff3cd;border:1px solid #ffc107;padding:14px 18px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0;color:#856404;font-size:13px;line-height:1.6;">
          ⚠️ <strong>Action Required:</strong> Please email clear photos or video proof of the damage/defect to <a href="mailto:info@siyaanish.com" style="color:#ba8245;">info@siyaanish.com</a> to complete your claim. Returns without proof cannot be processed.
        </p>
      </div>
      <div style="background:#fef9f0;border:1px solid #ffe0b3;padding:16px 20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#6b665f;font-size:13px;">Questions? <a href="mailto:info@siyaanish.com" style="color:#ba8245;">info@siyaanish.com</a> | +91-7981644655</p>
        <p style="margin:6px 0 0;color:#999;font-size:11px;">Mon–Sat, 10 AM – 7 PM</p>
      </div>
    </div>
    <div style="text-align:center;padding:20px;font-size:11px;color:#999;border-top:1px solid #eee;background:#fafafa;border-radius:0 0 12px 12px;">
      <p style="margin:0;">© ${new Date().getFullYear()} Siyaanish. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Return Request Received

Dear ${customerName || customerEmail},

Your return request for order #${orderId} has been submitted.

Return ID: #${returnId}
Reason: ${reason}
Status: Pending Review

Action Required: Please email proof of damage/defect to info@siyaanish.com

Questions? info@siyaanish.com

© ${new Date().getFullYear()} Siyaanish`;

  mailer.sendPostmarkEmail(
    customerEmail,
    `Return Request Received – Order #${orderId} (#${returnId})`,
    htmlBody,
    textBody
  ).catch(err => console.error("Return submitted email error:", err));

  res.json({ success: true });
});

// ── Assign return tracking ID → sends confirmation email to user ───────────────
router.post("/assign-return-tracking", async (req, res) => {
  const { returnId, returnTrackingId } = req.body;

  if (!returnId || !returnTrackingId) {
    return res.status(400).json({ success: false, message: "returnId and returnTrackingId required" });
  }

  // Fetch return + order details
  const { data: ret, error: fetchErr } = await supabase
    .from("returns")
    .select("*, orders(id, email, customer_name, total_amount)")
    .eq("id", returnId)
    .single();

  if (fetchErr || !ret) return res.status(404).json({ success: false, message: "Return not found" });

  // Update return with tracking id
  const { error: updateErr } = await supabase
    .from("returns")
    .update({ return_tracking_id: returnTrackingId, status: "in_progress" })
    .eq("id", returnId);

  if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

  const email = ret.orders?.email;
  const customerName = ret.orders?.customer_name || email;
  const orderId = ret.orders?.id;
  const orderAmount = ret.orders?.total_amount;

  if (email) {
    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background:#fff;">
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#ba8245 0%,#8b5a2e 100%);border-radius:12px 12px 0 0;">
      <img src="https://siyaanish.com/static/media/Siyaanishlogo1.71a6246271bee5ae74ab.png" alt="Siyaanish" style="max-width:160px;height:auto;display:block;margin:0 auto;">
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:1px;">Live Your Values</p>
    </div>
    <div style="padding:36px 28px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;">↩️</div>
        <h2 style="color:#ba8245;font-weight:300;font-size:24px;margin:8px 0 4px;">Return Request Initiated</h2>
        <p style="color:#888;font-size:13px;margin:0;">We've received your return request</p>
      </div>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Dear <strong>${customerName}</strong>, your return request for order <strong>#${orderId}</strong> has been initiated.
      </p>
      <div style="background:#f8f4ef;border-left:4px solid #ba8245;padding:16px 20px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0 0 8px;color:#5c3d1a;font-size:14px;font-weight:600;">📦 Return Details</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Order ID:</strong> #${orderId}</p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Return ID:</strong> <span style="color:#ba8245;font-weight:600;">${returnTrackingId}</span></p>
        <p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Status:</strong> <span style="color:#2c7a3e;font-weight:600;">✓ In Progress</span></p>
        ${orderAmount ? `<p style="margin:4px 0;color:#6b665f;font-size:14px;"><strong>Order Amount:</strong> ₹${parseFloat(orderAmount).toLocaleString("en-IN")}</p>` : ""}
      </div>
      <div style="background:#fff3cd;border:1px solid #ffc107;padding:14px 18px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0;color:#856404;font-size:13px;line-height:1.6;">
          ⏱️ <strong>Refund Timeline:</strong> Store credit will be issued within <strong>4–7 business days</strong> after the returned product is received and inspected. Credit validity will be shared at the time of issuance.
        </p>
      </div>
      <div style="background:#fef9f0;border:1px solid #ffe0b3;padding:16px 20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#6b665f;font-size:13px;">Questions about your return? <a href="mailto:info@siyaanish.com" style="color:#ba8245;">info@siyaanish.com</a></p>
      </div>
    </div>
    <div style="text-align:center;padding:20px;font-size:11px;color:#999;border-top:1px solid #eee;background:#fafafa;border-radius:0 0 12px 12px;">
      <p style="margin:0;">© ${new Date().getFullYear()} Siyaanish. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textBody = `Return Request Initiated

Dear ${customerName},

Your return for order #${orderId} has been initiated.

Return ID: ${returnTrackingId}
Status: In Progress

Refund will be issued as store credit within 4–7 business days after the product is received and inspected.

Questions? info@siyaanish.com

© ${new Date().getFullYear()} Siyaanish`;

    mailer.sendPostmarkEmail(
      email,
      `Return Initiated for Order #${orderId} – ID: ${returnTrackingId}`,
      htmlBody,
      textBody
    ).catch(err => console.error("Return email error:", err));
  }

  res.json({ success: true, returnTrackingId });
});


// ── Products: Get all products (admin view, including not live) ───────────────
router.get("/products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_details(*)")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, products: data });
});

// ── Products: Get single product ──────────────────────────────────────────────
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("products")
    .select("*, product_details(*)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, product: data });
});

// ── Products: Create product ──────────────────────────────────────────────────
router.post("/products", async (req, res) => {
  const {
    name, price, category, subcategory, fabric,
    description, care_instructions, ethical,
    stock, images, sizes, is_live,
    // product_details fields
    detail_description, material, dimensions, capacity,
    care_ritual, delivery, returns_replacement, detail_is_live
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: "name and category are required" });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name, price, category, subcategory, fabric,
      description, care_instructions, ethical,
      stock: stock ?? 0,
      images: images ?? [],
      sizes: sizes ?? [],
      is_live: is_live ?? false,
      is_sold_out: req.body.is_sold_out ?? false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Optionally insert product_details if provided
  if (detail_description || material || dimensions || capacity || care_ritual || delivery || returns_replacement) {
    await supabase.from("product_details").insert({
      product_id: product.id,
      description: detail_description,
      material, dimensions, capacity,
      care_ritual, delivery, returns_replacement,
      is_live: detail_is_live ?? false,
    });
  }

  res.status(201).json({ success: true, product });
});

// ── Products: Update product ──────────────────────────────────────────────────
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name, price, category, subcategory, fabric,
    description, care_instructions, ethical,
    stock, images, sizes, is_live
  } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (price !== undefined) updateFields.price = price;
  if (category !== undefined) updateFields.category = category;
  if (subcategory !== undefined) updateFields.subcategory = subcategory;
  if (fabric !== undefined) updateFields.fabric = fabric;
  if (description !== undefined) updateFields.description = description;
  if (care_instructions !== undefined) updateFields.care_instructions = care_instructions;
  if (ethical !== undefined) updateFields.ethical = ethical;
  if (stock !== undefined) updateFields.stock = stock;
  if (images !== undefined) updateFields.images = images;
  if (sizes !== undefined) updateFields.sizes = sizes;
  if (is_live !== undefined) updateFields.is_live = is_live;
  if (req.body.is_sold_out !== undefined) updateFields.is_sold_out = req.body.is_sold_out;

  const { data, error } = await supabase
    .from("products")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, product: data });
});

// ── Products: Toggle stock to 0 (Mark as No Stock / Out of Stock) ─────────────
router.patch("/products/:id/no-stock", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .update({ stock: 0 })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: "Product marked as out of stock", product: data });
});

// ── Products: Toggle is_live (publish / unpublish) ────────────────────────────
router.patch("/products/:id/toggle-live", async (req, res) => {
  const { id } = req.params;

  // First fetch current value
  const { data: current, error: fetchErr } = await supabase
    .from("products")
    .select("is_live")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(404).json({ success: false, message: "Product not found" });

  const { data, error } = await supabase
    .from("products")
    .update({ is_live: !current.is_live })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, product: data });
});

// ── Products: Toggle is_sold_out ─────────────────────────────────────────────
router.patch("/products/:id/toggle-sold-out", async (req, res) => {
  const { id } = req.params;

  const { data: current, error: fetchErr } = await supabase
    .from("products")
    .select("is_sold_out")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(404).json({ success: false, message: "Product not found" });

  const { data, error } = await supabase
    .from("products")
    .update({ is_sold_out: !current.is_sold_out })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, product: data });
});

// ── Products: Delete product ──────────────────────────────────────────────────
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: "Product deleted" });
});

// ── Public: Get live products (for storefront) ────────────────────────────────
router.get("/store/products", async (req, res) => {
  const { category, subcategory } = req.query;

  let query = supabase
    .from("products")
    .select("*, product_details(*)")
    .eq("is_live", true)
    .order("id", { ascending: false });

  if (category) query = query.eq("category", category);
  if (subcategory) query = query.eq("subcategory", subcategory);

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, products: data });
});

// ── Public: Get single live product (for storefront) ─────────────────────────
router.get("/store/products/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select("*, product_details(*)")
    .eq("id", id)
    .eq("is_live", true)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, product: data });
});

module.exports = router;