import { sendBrevoEmail } from "./brevo.service";
import type { SendEmailParams } from "../types/email.types";

// Generic email sender using Brevo API (maintains compatibility with existing code)
export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("Email service misconfigured: missing BREVO_API_KEY");
  }

  const htmlContent = html || `<p>${text || subject}</p>`;
  return sendBrevoEmail(to, subject, htmlContent);
}

export const sendPasswordResetEmail = async (email: string, otp: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #0d9488; text-align: center;">Smart KidCare</h2>
            <h3 style="color: #333;">Password Reset Request</h3>
            <p style="color: #555; line-height: 1.5;">
                You are receiving this email because you (or someone else) have requested the reset of the password for your account.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Please use the following 6-digit OTP code to complete the password reset process:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f4f4f4; border: 2px dashed #0d9488; color: #0d9488; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 32px; letter-spacing: 5px; display: inline-block;">
                    ${otp}
                </div>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 16px;">
                If you did not request this, please ignore this email and your password will remain unchanged. This OTP code is valid for 15 minutes.
            </p>
        </div>
    `;

    try {
        await sendBrevoEmail(email, "Password Reset OTP Code", html);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Could not send password reset email.");
    }
};

export const sendVerificationEmail = async (email: string, otp: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #0d9488; text-align: center;">Smart KidCare</h2>
            <h3 style="color: #333;">Welcome to Smart KidCare!</h3>
            <p style="color: #555; line-height: 1.5;">
                Thank you for registering. Please verify your email address to complete your account setup.
            </p>
            <p style="color: #555; line-height: 1.5;">
                Here is your 6-digit verification code:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f4f4f4; border: 2px dashed #0d9488; color: #0d9488; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 32px; letter-spacing: 5px; display: inline-block;">
                    ${otp}
                </div>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 16px;">
                If you did not register for an account, please ignore this email. This OTP code is valid for 15 minutes.
            </p>
        </div>
    `;

    try {
        await sendBrevoEmail(email, "Verify Your Email Address", html);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Could not send verification email.");
    }
};
