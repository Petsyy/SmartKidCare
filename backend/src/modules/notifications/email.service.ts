import { transporter } from "../../shared/lib/mailer";

type SendEmailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const missingEnv = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "MAIL_FROM",
  ].filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    throw new Error(
      `Email service misconfigured: missing ${missingEnv.join(", ")}`,
    );
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return info;
}
