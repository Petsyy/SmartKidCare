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

const maskEmail = (value: string): string => {
  const [localPart = "", domainPart = ""] = String(value || "").split("@");
  if (!domainPart || localPart.length < 2) {
    return value || "";
  }

  return `${localPart[0]}***${localPart.slice(-1)}@${domainPart}`;
};

export const getMailerSummary = () => ({
  host,
  port,
  secure,
  userMasked: maskEmail(String(process.env.SMTP_USER || "")),
  from: String(process.env.MAIL_FROM || ""),
});

export type MailerHealthResult = {
  ok: boolean;
  summary: ReturnType<typeof getMailerSummary>;
  error?: {
    code?: string;
    responseCode?: number;
    message: string;
  };
};

export const checkMailerHealth = async (): Promise<MailerHealthResult> => {
  try {
    await transporter.verify();
    return {
      ok: true,
      summary: getMailerSummary(),
    };
  } catch (error: any) {
    return {
      ok: false,
      summary: getMailerSummary(),
      error: {
        code: String(error?.code || ""),
        responseCode: Number(error?.responseCode || 0) || undefined,
        message: String(error?.message || "Mailer verification failed"),
      },
    };
  }
};

export async function verifyMailer() {
  const health = await checkMailerHealth();

  if (health.ok) {
    return;
  }

  console.error("Mailer verification failed:", {
    ...health.summary,
    error: health.error,
  });
}
