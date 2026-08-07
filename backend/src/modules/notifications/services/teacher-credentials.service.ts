import { sendEmail } from "./email.service";
import type { SendTeacherCredentialsEmailParams } from "../types/teacher-credentials.types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmailAddress = (email: string): boolean =>
  emailRegex.test(email);

export const mapCredentialDeliveryError = (error: any): string => {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "");
  const lowerMessage = message.toLowerCase();

  if (message.includes("Email service misconfigured")) {
    return message;
  }

  if (
    code === "EENVELOPE" ||
    lowerMessage.includes("invalid recipient") ||
    lowerMessage.includes("mailbox unavailable")
  ) {
    return "The recipient email address was rejected by the mail server.";
  }

  if (code === "EAUTH" || lowerMessage.includes("invalid login")) {
    return "SMTP authentication failed. Check SMTP_USER and SMTP_PASS.";
  }

  if (
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND"
  ) {
    return "Cannot connect to SMTP server. Check SMTP_HOST/SMTP_PORT/SMTP_SECURE and internet access.";
  }

  return "Unable to send account credentials by email right now.";
};
export const sendTeacherCredentialsEmail = async ({
  to,
  firstName,
  tempPassword,
}: SendTeacherCredentialsEmailParams): Promise<void> => {
  const info: any = await sendEmail({
    to,
    subject: "Your SmartKidCare teacher account credentials",
    text: `Hello ${firstName},

Your SmartKidCare teacher account has been created.

Login email: ${to}
Temporary password: ${tempPassword}

You will be required to change this password on your first login.`,
    html: `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Smart KidCare</h1>
          </div>
          <div style="padding: 40px;">
            <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f766e; text-align: center;">Welcome, ${firstName}!</h2>
            <p style="color: #64748b; margin-bottom: 24px; font-size: 16px; text-align: center;">Your SmartKidCare teacher account has been successfully created.</p>
            
            <div style="background: #f0fdfa; border-radius: 12px; padding: 24px; border: 1px solid #ccfbf1; margin-bottom: 24px;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0; font-size: 12px; color: #0d9488; text-transform: uppercase; font-weight: 800;">Login Email</p>
                <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 500;">${to}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 12px; color: #0d9488; text-transform: uppercase; font-weight: 800;">Temporary Password</p>
                <p style="margin: 4px 0 0; font-size: 16px; color: #0f766e; font-weight: 600; font-family: 'Courier New', Courier, monospace;">${tempPassword}</p>
              </div>
            </div>
            
            <div style="background: #fff9eb; border-radius: 8px; padding: 16px; border: 1px solid #fef3c7; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">🔔 Action Required</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #b45309;">You will be required to change this password on your first login.</p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Smart KidCare. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  });

  const acceptedRecipients = Array.isArray(info?.accepted)
    ? info.accepted.map((value: unknown) => String(value).toLowerCase())
    : [];
  const rejectedRecipients = Array.isArray(info?.rejected)
    ? info.rejected.map((value: unknown) => String(value).toLowerCase())
    : [];
  const normalizedTo = to.toLowerCase();

  if (
    rejectedRecipients.includes(normalizedTo) ||
    acceptedRecipients.length === 0
  ) {
    const recipientError = new Error(
      "The recipient email address was rejected by the mail server.",
    ) as Error & { code?: string };
    recipientError.code = "EENVELOPE";
    throw recipientError;
  }
};
