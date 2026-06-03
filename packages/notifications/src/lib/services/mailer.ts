import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, from } = options;

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
