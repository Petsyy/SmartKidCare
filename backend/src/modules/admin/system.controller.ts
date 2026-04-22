import { Request, Response } from "express";
import { checkMailerHealth } from "../../shared/lib/mailer";
import { sendEmail } from "../notifications/email.service";

const parseBooleanFlag = (value: unknown): boolean => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

const isSmtpHealthEndpointEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  parseBooleanFlag(process.env.ENABLE_SMTP_HEALTH);

export const getSmtpHealth = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    if (!isSmtpHealthEndpointEnabled()) {
      return res.status(404).json({ message: "Not found" });
    }

    const health = await checkMailerHealth();
    const shouldSendTestEmail = parseBooleanFlag(req.query.sendTest);

    let sendTest:
      | {
          attempted: false;
        }
      | {
          attempted: true;
          ok: boolean;
          to: string;
          messageId?: string;
          rejected?: string[];
          error?: {
            code?: string;
            responseCode?: number;
            message: string;
          };
        } = { attempted: false };

    if (shouldSendTestEmail) {
      const targetEmail = String(
        req.query.to || process.env.SMTP_USER || "",
      ).trim();

      if (!targetEmail) {
        sendTest = {
          attempted: true,
          ok: false,
          to: "",
          error: {
            message: "Missing test recipient. Provide ?to=<email> or SMTP_USER.",
          },
        };
      } else {
        try {
          const info: any = await sendEmail({
            to: targetEmail,
            subject: "SmartKidCare SMTP health test",
            text: `SMTP health check succeeded at ${new Date().toISOString()}.`,
          });

          sendTest = {
            attempted: true,
            ok: true,
            to: targetEmail,
            messageId: String(info?.messageId || ""),
            rejected: Array.isArray(info?.rejected)
              ? info.rejected.map((value: unknown) => String(value))
              : [],
          };
        } catch (error: any) {
          sendTest = {
            attempted: true,
            ok: false,
            to: targetEmail,
            error: {
              code: String(error?.code || ""),
              responseCode: Number(error?.responseCode || 0) || undefined,
              message: String(error?.message || "SMTP send test failed"),
            },
          };
        }
      }
    }

    const statusCode =
      health.ok && (!sendTest.attempted || sendTest.ok) ? 200 : 503;

    return res.status(statusCode).json({
      checkedAt: new Date().toISOString(),
      endpointEnabled: true,
      health,
      sendTest,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to run SMTP health check",
      error: String(error?.message || error),
    });
  }
};
