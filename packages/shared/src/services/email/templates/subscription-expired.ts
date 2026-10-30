import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, button, detailsCard, fallbackLink, callout, renderEmailLayout } from "../layout";

export interface SendSubscriptionExpiredEmailParams {
  email: string;
  userName?: string | null;
  organizationName?: string | null;
  planName: string;
  expirationDate: string;
  amount: string | number;
  currency?: string;
  actionUrl: string;
}

/**
 * Send email notification to user when their subscription has expired
 */
export async function sendSubscriptionExpiredEmail(params: SendSubscriptionExpiredEmailParams): Promise<EmailResult> {
  const { email, userName, organizationName, planName, expirationDate, amount, currency = "USD", actionUrl } = params;
  const name = userName || "there";
  const formattedAmount = typeof amount === "number" ? `${currency} ${amount.toFixed(2)}` : `${currency} ${amount}`;

  const detailsRows = [
    { label: "Plan", value: escapeHtml(planName) },
    { label: "Expired On", value: escapeHtml(expirationDate) },
    { label: "Renewal Amount", value: escapeHtml(formattedAmount) },
  ];

  if (organizationName) {
    detailsRows.unshift({ label: "Organization", value: escapeHtml(organizationName) });
  }

  const bodyContent = [
    heading("Subscription Expired"),
    paragraph(`Hi ${escapeHtml(name)}, your ${BRAND.name} subscription has expired. Some features may be restricted until your account is renewed.`),
    detailsCard(detailsRows),
    button("Reactivate Subscription", actionUrl, BRAND.primaryDark),
    fallbackLink(actionUrl),
    callout("<strong>Reactivate anytime:</strong> Renew your subscription now to restore full access to all features and data."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Your ${BRAND.name} subscription has expired`,
    html: renderEmailLayout({
      title: "Subscription Expired",
      preheader: `Your ${BRAND.name} ${planName} subscription expired on ${expirationDate}. Reactivate now to restore access.`,
      bodyContent,
    }),
    text: `Hi ${name},\n\nYour ${BRAND.name} ${planName} subscription expired on ${expirationDate}.\n\nReactivate your subscription to restore full access:\n${actionUrl}\n\n- The ${BRAND.name} Team`,
  });
}
