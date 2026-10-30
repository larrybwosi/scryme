import { env } from "@repo/env";

export const BRAND = {
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

/** Escape user supplied values before interpolating them into HTML. */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function heading(text: string): string {
  return `<h2 style="margin: 0 0 12px 0; font-family: ${BRAND.font}; font-size: 22px; line-height: 1.3; font-weight: 700; letter-spacing: -0.3px; color: ${BRAND.ink};">${text}</h2>`;
}

export function paragraph(html: string, opts: { muted?: boolean; small?: boolean } = {}): string {
  const color = opts.muted ? BRAND.muted : BRAND.body;
  const size = opts.small ? "14px" : "15px";
  return `<p style="margin: 0 0 20px 0; font-family: ${BRAND.font}; font-size: ${size}; line-height: 1.65; color: ${color};">${html}</p>`;
}

/** Table based bulletproof button that renders consistently in Outlook, Gmail and Apple Mail. */
export function button(label: string, href: string, color: string = BRAND.primary): string {
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

/** Shows the raw URL as a fallback when the button cannot be clicked. */
export function fallbackLink(href: string): string {
  const safeHref = escapeHtml(href);
  return `
<p style="margin: 0 0 8px 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.5; color: ${BRAND.muted};">
  Button not working? Copy and paste this link into your browser:
</p>
<p style="margin: 0 0 24px 0; padding: 12px 14px; background-color: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 8px; font-family: ${BRAND.mono}; font-size: 12px; line-height: 1.5; word-break: break-all;">
  <a href="${safeHref}" target="_blank" style="color: ${BRAND.primary}; text-decoration: none;">${safeHref}</a>
</p>`;
}

/** Highlighted callout box for notifications and security notes. */
export function callout(html: string): string {
  return `
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 14px 16px; background-color: ${BRAND.warningBg}; border: 1px solid ${BRAND.warningBorder}; border-radius: 8px; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.55; color: ${BRAND.warningText};">
      ${html}
    </td>
  </tr>
</table>`;
}

/** Key value summary card. */
export function detailsCard(rows: Array<{ label: string; value: string }>): string {
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

export function expiryNote(text: string): string {
  return `<p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 1.5; color: ${BRAND.subtle};">${text}</p>`;
}

export interface LayoutOptions {
  title: string;
  preheader?: string;
  bodyContent: string;
}

export function renderEmailLayout({ title, preheader = "", bodyContent }: LayoutOptions): string {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
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
