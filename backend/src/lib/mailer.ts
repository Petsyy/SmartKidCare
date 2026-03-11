import nodemailer from "nodemailer";

const host = String(process.env.SMTP_HOST || "");
const port = Number(process.env.SMTP_PORT || 587);
const secure = (process.env.SMTP_SECURE || "false") === "true";
const rawPass = String(process.env.SMTP_PASS || "");
const smtpPass = host.toLowerCase().includes("gmail.com")
  ? rawPass.replace(/\s+/g, "")
  : rawPass;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
});

export async function verifyMailer() {
  try {
    await transporter.verify();
  } catch (err) {
    console.error("Mailer verification failed:", err);
  }
}
