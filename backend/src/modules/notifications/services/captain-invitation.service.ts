import { sendEmail } from "./email.service";

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
      character
    ] || character,
  );

export const getCaptainActivationUrl = (token: string): string => {
  const configuredUrl = String(process.env.FRONTEND_URL || "")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
  const baseUrl = configuredUrl || "http://localhost:5173";
  return `${baseUrl}/activate-captain?token=${encodeURIComponent(token)}`;
};

export const sendCaptainInvitationEmail = async (params: {
  to: string;
  firstName: string;
  centerName: string;
  activationUrl: string;
  expiresAt: Date;
}): Promise<void> => {
  const firstName = escapeHtml(params.firstName);
  const centerName = escapeHtml(params.centerName);
  const activationUrl = escapeHtml(params.activationUrl);
  const expiresAt = params.expiresAt.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

  await sendEmail({
    to: params.to,
    subject: "Activate your SmartKidCare Barangay Captain account",
    text: `Hello ${params.firstName},\n\nYou have been invited to manage ${params.centerName} in SmartKidCare. Activate your account before ${expiresAt}: ${params.activationUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
      <div style="background:#0f766e;color:white;padding:24px;border-radius:16px 16px 0 0"><h1 style="margin:0">SmartKidCare</h1></div>
      <div style="padding:28px;border:1px solid #d1fae5;border-top:0;border-radius:0 0 16px 16px">
        <h2>Hello ${firstName},</h2>
        <p>You have been invited to manage <strong>${centerName}</strong> as its Barangay Captain.</p>
        <p><a href="${activationUrl}" style="display:inline-block;background:#0d9488;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold">Activate account</a></p>
        <p style="font-size:13px;color:#64748b">This one-time link expires on ${escapeHtml(expiresAt)}. If you did not expect this invitation, ignore this email.</p>
      </div>
    </div>`,
  });
};
