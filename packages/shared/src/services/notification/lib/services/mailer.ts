import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, from } = options;

  const isDevOrTest =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  if (isDevOrTest && !process.env.SMTP_HOST && !process.env.SMTP_USER) {
    console.log(`[Email Service - Dev Mode] To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`[Email Service - Dev Mode] Subject: ${subject}`);
    console.log(`[Email Service - Dev Mode] Content preview: ${html.substring(0, 150)}...`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || "noreply@scryme.com",
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  });
}
