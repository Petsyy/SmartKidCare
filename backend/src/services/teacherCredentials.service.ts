import { sendEmail } from "./email.service";

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

type SendTeacherCredentialsEmailParams = {
  to: string;
  firstName: string;
  employeeId: string;
  tempPassword: string;
};

export const sendTeacherCredentialsEmail = async ({
  to,
  firstName,
  employeeId,
  tempPassword,
}: SendTeacherCredentialsEmailParams): Promise<void> => {
  const info: any = await sendEmail({
    to,
    subject: "Your SmartKidCare teacher account credentials",
    text: `Hello ${firstName},

Your SmartKidCare teacher account has been created.

Login email: ${to}
Employee ID: ${employeeId}
Temporary password: ${tempPassword}

You will be required to change this password on your first login.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Hello ${firstName},</p>
        <p>Your SmartKidCare teacher account has been created.</p>
        <p><strong>Login email:</strong> ${to}</p>
        <p><strong>Employee ID:</strong> ${employeeId}</p>
        <p><strong>Temporary password:</strong> ${tempPassword}</p>
        <p>You will be required to change this password on your first login.</p>
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
