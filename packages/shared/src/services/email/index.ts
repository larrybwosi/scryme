import { Resend } from "resend";
import { env } from "@repo/env";

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

type EmailResult = { success: boolean; id?: string; error?: string };

/**
 * Checks if an email recipient uses a dummy/placeholder domain (e.g. example.com)
 * which Resend rejects with a 422 validation_error.
 */
function isPlaceholderRecipient(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const lower = email.trim().toLowerCase();
  const domain = lower.split("@")[1];
  if (!domain) return false;

  return (
    domain === "example.com" ||
    domain === "example.org" ||
    domain === "example.net" ||
    domain.endsWith(".example") ||
    lower.startsWith("test@example.")
  );
}

/**
 * Send email using Resend API with fallback log mode for development if API key is not configured
 * or if placeholder recipients (e.g. example.com) are specified.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<EmailResult> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validRecipients = recipients.filter((email) => email && typeof email === "string" && !isPlaceholderRecipient(email));
  const placeholderRecipients = recipients.filter((email) => email && typeof email === "string" && isPlaceholderRecipient(email));

  if (placeholderRecipients.length > 0) {
    console.warn(
      `[Email Service Placeholder] Skipping Resend API delivery for placeholder recipient(s): ${placeholderRecipients.join(", ")} | Subject: "${payload.subject}"`
    );
  }

  if (validRecipients.length === 0) {
    return { success: true, id: "mock-placeholder-email-id-" + Date.now() };
  }

  const resend = getResendClient();
  const from = payload.from || env.EMAIL_FROM || process.env.EMAIL_FROM || "Scryme <no-reply@scryme.tech>";

  if (!resend) {
    console.warn(
      `[Email Service Mock/Fallback] RESEND_API_KEY is missing. Mock email sent to: ${validRecipients.join(", ")} | Subject: "${payload.subject}"`
    );
    return { success: true, id: "mock-email-id-" + Date.now() };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: validRecipients.length === 1 ? validRecipients[0] : validRecipients,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (response.error) {
      console.error("[Email Service] Resend API error:", response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (error: any) {
    console.error("[Email Service] Failed to send email via Resend:", error);
    return { success: false, error: error?.message || "Unknown email delivery error" };
  }
}

/* -------------------------------------------------------------------------- */
/*                               Design tokens                                */
/* -------------------------------------------------------------------------- */

const BRAND = {
  name: "Scryme",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  subtle: "#94a3b8",
  border: "#e2e8f0",
  surface: "#f8fafc",
  page: "#f1f5f9",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace",
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/** Escape user-supplied values before interpolating them into HTML. */
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function heading(text: string): string {
  return `<h2 style="margin: 0 0 12px 0; font-family: ${BRAND.font}; font-size: 22px; line-height: 1.3; font-weight: 700; letter-spacing: -0.3px; color: ${BRAND.ink};">${text}</h2>`;
}

function paragraph(html: string, opts: { muted?: boolean; small?: boolean } = {}): string {
  const color = opts.muted ? BRAND.muted : BRAND.body;
  const size = opts.small ? "14px" : "15px";
  return `<p style="margin: 0 0 20px 0; font-family: ${BRAND.font}; font-size: ${size}; line-height: 1.65; color: ${color};">${html}</p>`;
}

/** Table-based "bulletproof" button that renders consistently in Outlook, Gmail and Apple Mail. */
function button(label: string, href: string, color: string = BRAND.primary): string {
  const safeHref = escapeHtml(href);
  return `
<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 8px auto 28px auto;">
  <tr>
    <td align="center" bgcolor="${color}" style="border-radius: 8px;">
      <a href="${safeHref}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: ${BRAND.font}; font-size: 15px; font-weight: 600; line-height: 1; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid ${color};">${label}</a>
    </td>
  </tr>
</table>`;
}

/** Shows the raw URL as a fallback when the button can't be clicked. */
function fallbackLink(href: string): string {
  const safeHref = escapeHtml(href);
  return `
<p style="margin: 0 0 8px 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.5; color: ${BRAND.muted};">
  Button not working? Copy and paste this link into your browser:
</p>
<p style="margin: 0 0 24px 0; padding: 12px 14px; background-color: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 8px; font-family: ${BRAND.mono}; font-size: 12px; line-height: 1.5; word-break: break-all;">
  <a href="${safeHref}" target="_blank" style="color: ${BRAND.primary}; text-decoration: none;">${safeHref}</a>
</p>`;
}

/** Highlighted callout box (e.g. security notes). */
function callout(html: string): string {
  return `
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 14px 16px; background-color: ${BRAND.warningBg}; border: 1px solid ${BRAND.warningBorder}; border-radius: 8px; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.55; color: ${BRAND.warningText};">
      ${html}
    </td>
  </tr>
</table>`;
}

/** Small key/value summary card. */
function detailsCard(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (row, i) => `
    <tr>
      <td style="padding: 12px 16px; ${i > 0 ? `border-top: 1px solid ${BRAND.border};` : ""} font-family: ${BRAND.font}; font-size: 13px; color: ${BRAND.muted}; width: 40%;">${row.label}</td>
      <td style="padding: 12px 16px; ${i > 0 ? `border-top: 1px solid ${BRAND.border};` : ""} font-family: ${BRAND.font}; font-size: 14px; font-weight: 600; color: ${BRAND.ink};">${row.value}</td>
    </tr>`
    )
    .join("");

  return `
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0; background-color: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 10px;">
  ${body}
</table>`;
}

function expiryNote(text: string): string {
  return `<p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.5; color: ${BRAND.subtle};">${text}</p>`;
}

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

interface LayoutOptions {
  title: string;
  /** Short summary shown in inbox previews next to the subject line. */
  preheader?: string;
  bodyContent: string;
}

function renderEmailLayout({ title, preheader = "", bodyContent }: LayoutOptions): string {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  // Pads the preheader so email clients don't pull body text into the preview.
  const preheaderPadding = "&#847;&zwnj;&nbsp;".repeat(60);

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: ${BRAND.page}; font-family: ${BRAND.font}; color: ${BRAND.body};">
  <!-- Preheader (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${BRAND.page}; opacity: 0;">
    ${safePreheader}${preheaderPadding}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.page};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Brand wordmark -->
        <table role="presentation" class="container" width="560" border="0" cellspacing="0" cellpadding="0" style="width: 560px; max-width: 100%;">
          <tr>
            <td align="center" style="padding: 0 0 24px 0; font-family: ${BRAND.font}; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: ${BRAND.ink};">
              <span style="color: ${BRAND.primary};">&#9679;</span>&nbsp;${BRAND.name}
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" class="container" width="560" border="0" cellspacing="0" cellpadding="0" style="width: 560px; max-width: 100%; background-color: #ffffff; border: 1px solid ${BRAND.border}; border-radius: 14px; overflow: hidden;">
          <!-- Accent bar -->
          <tr>
            <td style="height: 4px; line-height: 4px; font-size: 4px; background-color: ${BRAND.primary};">&nbsp;</td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="px" style="padding: 40px 40px 36px 40px;">
              ${bodyContent}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" class="container" width="560" border="0" cellspacing="0" cellpadding="0" style="width: 560px; max-width: 100%;">
          <tr>
            <td class="px" align="center" style="padding: 24px 40px 0 40px; font-family: ${BRAND.font}; font-size: 12px; line-height: 1.6; color: ${BRAND.muted};">
              <p style="margin: 0 0 6px 0;">You're receiving this email because of activity on your ${BRAND.name} account. If you didn't expect it, you can safely ignore this message.</p>
              <p style="margin: 0; color: ${BRAND.subtle};">&copy; ${year} ${BRAND.name}. All rights reserved.</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/*                                 Templates                                  */
/* -------------------------------------------------------------------------- */

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(params: {
  email: string;
  url: string;
  user?: { name?: string | null };
}): Promise<EmailResult> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = [
    heading("Verify your email address"),
    paragraph(`Hi ${escapeHtml(name)}, welcome to ${BRAND.name}! Confirm your email address to activate your account and get started.`),
    button("Verify Email Address", url),
    fallbackLink(url),
    expiryNote("This verification link expires in 24 hours."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Verify your email address - ${BRAND.name}`,
    html: renderEmailLayout({
      title: "Verify your email address",
      preheader: `Confirm your email to activate your ${BRAND.name} account.`,
      bodyContent,
    }),
    text: `Hi ${name},\n\nWelcome to ${BRAND.name}! Please verify your email address by opening the following link:\n${url}\n\nThis link will expire in 24 hours.\n\n- The ${BRAND.name} Team`,
  });
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  url: string;
  user?: { name?: string | null };
}): Promise<EmailResult> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = [
    heading("Reset your password"),
    paragraph(`Hi ${escapeHtml(name)}, we received a request to reset the password for your ${BRAND.name} account. Click the button below to choose a new one.`),
    button("Reset Password", url),
    fallbackLink(url),
    callout(
      `<strong>Didn't request this?</strong> You can safely ignore this email &mdash; your password will not change. If you're concerned about your account's security, consider updating your password once you sign in.`
    ),
    expiryNote("This password reset link expires in 1 hour."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Reset your password - ${BRAND.name}`,
    html: renderEmailLayout({
      title: "Reset your password",
      preheader: "Use this link to choose a new password. It expires in 1 hour.",
      bodyContent,
    }),
    text: `Hi ${name},\n\nWe received a request to reset your password. You can set a new one using the following link:\n${url}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email and your password will remain unchanged.\n\n- The ${BRAND.name} Team`,
  });
}

/**
 * Send 2FA / One-Time Password (OTP) code via email
 */
export async function sendTwoFactorOTPEmail(params: {
  email: string;
  otp: string;
  user?: { name?: string | null };
}): Promise<EmailResult> {
  const { email, otp, user } = params;
  const name = user?.name || "there";
  const safeOtp = escapeHtml(otp);

  const otpBlock = `
<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 8px auto 28px auto;">
  <tr>
    <td align="center" style="padding: 18px 40px; background-color: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 12px;">
      <span style="font-family: ${BRAND.mono}; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: ${BRAND.ink}; padding-left: 10px;">${safeOtp}</span>
    </td>
  </tr>
</table>`;

  const bodyContent = [
    heading("Your verification code"),
    paragraph(`Hi ${escapeHtml(name)}, enter the code below to finish signing in to your ${BRAND.name} account.`),
    otpBlock,
    callout(
      `<strong>Keep this code private.</strong> ${BRAND.name} will never ask you for your verification code by email, phone or chat. If you didn't try to sign in, we recommend changing your password.`
    ),
    expiryNote("This code is valid for 10 minutes and can only be used once."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Your ${BRAND.name} verification code: ${otp}`,
    html: renderEmailLayout({
      title: "Your verification code",
      preheader: `Your ${BRAND.name} sign-in code is ${otp}. It expires in 10 minutes.`,
      bodyContent,
    }),
    text: `Hi ${name},\n\nYour ${BRAND.name} verification code is: ${otp}\n\nThis code expires in 10 minutes. Never share it with anyone - ${BRAND.name} will never ask for it.\n\nIf you didn't try to sign in, we recommend changing your password.\n\n- The ${BRAND.name} Team`,
  });
}

/**
 * Send organization invitation email to user
 */
export async function sendOrganizationInvitationEmail(params: {
  email: string;
  url: string;
  inviterName?: string | null;
  organizationName: string;
  role: string;
}): Promise<EmailResult> {
  const { email, url, inviterName, organizationName, role } = params;
  const inviter = inviterName || "A team member";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  const bodyContent = [
    heading(`Join ${escapeHtml(organizationName)} on ${BRAND.name}`),
    paragraph(`<strong style="color: ${BRAND.ink};">${escapeHtml(inviter)}</strong> has invited you to collaborate on ${BRAND.name}. Review the details below and accept to get started.`),
    detailsCard([
      { label: "Organization", value: escapeHtml(organizationName) },
      { label: "Your role", value: escapeHtml(roleLabel) },
      { label: "Invited by", value: escapeHtml(inviter) },
    ]),
    button("Accept Invitation", url, BRAND.ink),
    fallbackLink(url),
    expiryNote("This invitation expires in 7 days. If you weren't expecting it, you can ignore this email."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `${inviter} invited you to join ${organizationName} on ${BRAND.name}`,
    html: renderEmailLayout({
      title: `Invitation to join ${organizationName}`,
      preheader: `${inviter} invited you to join ${organizationName} as ${roleLabel}.`,
      bodyContent,
    }),
    text: `${inviter} has invited you to join ${organizationName} on ${BRAND.name} as ${roleLabel}.\n\nAccept your invitation using the following link:\n${url}\n\nThis invitation expires in 7 days. If you weren't expecting it, you can ignore this email.\n\n- The ${BRAND.name} Team`,
  });
}