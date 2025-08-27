import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ✅ Supabase admin client using Service Role Key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Mail transporter (domain-based email)
const transporter = nodemailer.createTransport({
  host: "mail.kemuelvtu.com.ng", // your domain SMTP host
  port: 465, // or 587 if needed
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_EMAIL, // e.g., support@yorubatech.com
    pass: process.env.SMTP_PASSWORD
  }
});

// ✅ Forgot password endpoint
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email, lang } = req.body;

    // 🔑 List users and find by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: listError.message });

    const foundUser = users.users.find((u) => u.email === email);
    if (!foundUser) return res.status(404).json({ error: "User not found" });

    // Generate reset token
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour
    const { error: tokenError } = await supabaseAdmin
      .from("password_resets")
      .insert([{ user_id: foundUser.id, email: foundUser.email, token, expires_at: expires }]);

    if (tokenError) return res.status(500).json({ error: tokenError.message });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // ✅ Email translations
    const translations = {
      en: {
        subject: "Reset your YorubaTech password",
        hello: `Hello ${foundUser.email},`,
        body: "We received a request to reset your password.",
        btn: "Reset Password",
        ignore: "If you didn't request this, ignore this email.",
        team: "YorubaTech Team",
      },
      yo: {
        subject: "Tun ọrọigbaniwọle YorubaTech rẹ ṣe",
        hello: `Pẹlẹ o ${foundUser.email},`,
        body: "A gba ìbéèrè láti tún ọrọigbaniwọle rẹ ṣe.",
        btn: "Tún Ọrọigbaniwọle Ṣe",
        ignore: "Tí ìwọ kò bá ránṣẹ́ fún ìbéèrè yìí, má ṣe fiyesi lẹ́tà yìí.",
        team: "Ẹgbẹ YorubaTech",
      },
    };

    const t = translations[lang] || translations.en;

    // Send bilingual email
    await transporter.sendMail({
  from: `"YorubaTech Support" <${process.env.SMTP_EMAIL}>`,
  to: email,
  subject: t.subject,
  text: `${t.body}\n${resetLink}\n${t.ignore}\n${t.team}`, // ✅ Plain text
  html: `
    <h2>${t.hello}</h2>
    <p>${t.body}</p>
    <p>
      <a href="${resetLink}" 
        style="background:#FFD700;color:#0D1B2A;
        padding:10px 20px;text-decoration:none;border-radius:5px;">
        ${t.btn}
      </a>
    </p>
    <p>${t.ignore}</p>
    <p>${t.team}</p>
  `,
});


    return res.json({
      message: lang === "yo" ? "Ìjápọ̀ atunṣe ranṣẹ́!" : "Password reset link sent!"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Reset password endpoint
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword, lang } = req.body;

    const { data: resetData, error } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !resetData)
      return res.status(400).json({ error: lang === "yo" ? "Tókùn kò tọ́ tàbí ti pari" : "Invalid or expired token" });

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetData.user_id,
      { password: newPassword }
    );
    if (updateError) return res.status(500).json({ error: updateError.message });

    // Delete token
    await supabaseAdmin.from("password_resets").delete().eq("id", resetData.id);

    return res.json({
      message: lang === "yo" ? "Ọrọigbaniwọle ti tún ṣe aṣeyọri!" : "Password has been reset successfully!"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
