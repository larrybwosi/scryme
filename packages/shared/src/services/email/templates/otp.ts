import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, callout, expiryNote, renderEmailLayout } from "../layout";

export interface SendTwoFactorOTPEmailParams {
  email: string;
  otp: string;
  user?: { name?: string | null };
}

/**
 * Send 2FA / One-Time Password (OTP) code via email
 */
export async function sendTwoFactorOTPEmail(params: SendTwoFactorOTPEmailParams): Promise<EmailResult> {
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
