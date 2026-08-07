import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendBrevoEmail = async (toEmail: string, subject: string, htmlContent: string) => {
    try {
        const response = await axios.post(
            BREVO_API_URL,
            {
                sender: {
                    name: "SmartKidCare Support",
                    email: process.env.SMTP_USER || "noreply@smartkidcare.com"
                },
                to: [{ email: toEmail }],
                subject: subject,
                htmlContent: htmlContent
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY || "",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.error("Brevo API Error:", error.response.data);
        } else {
            console.error("Brevo API Error:", error.message);
        }
        throw new Error("Failed to send email via Brevo.");
    }
};
