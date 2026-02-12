import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT || 587);
const secure = (process.env.SMTP_SECURE || "false") === "true";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional: check SMTP config on startup
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("✅ Mailer is ready");
  } catch (err) {
    console.error("❌ Mailer verification failed:", err);
  }
}
