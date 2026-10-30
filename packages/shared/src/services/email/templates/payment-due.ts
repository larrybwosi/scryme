import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, button, detailsCard, fallbackLink, callout, renderEmailLayout } from "../layout";

export interface SendPaymentDueEmailParams {
  email: string;
  userName?: string | null;
  organizationName?: string | null;
  planName: string;
  dueDate: string;
  amount: string | number;
  currency?: string;
  actionUrl: string;
}

/**
 * Send email notification to user when their payment is almost due
 */
export async function sendPaymentDueEmail(params: SendPaymentDueEmailParams): Promise<EmailResult> {
  const { email, userName, organizationName, planName, dueDate, amount, currency = "USD", actionUrl } = params;
  const name = userName || "there";
  const formattedAmount = typeof amount === "number" ? `${currency} ${amount.toFixed(2)}` : `${currency} ${amount}`;

  const detailsRows = [
    { label: "Plan", value: escapeHtml(planName) },
    { label: "Due Date", value: escapeHtml(dueDate) },
    { label: "Amount Due", value: escapeHtml(formattedAmount) },
  ];

  if (organizationName) {
    detailsRows.unshift({ label: "Organization", value: escapeHtml(organizationName) });
  }

  const bodyContent = [
    heading("Payment Almost Due"),
    paragraph(`Hi ${escapeHtml(name)}, this is a friendly reminder that your subscription payment for ${BRAND.name} is due soon. Please review the payment details below to ensure uninterrupted service.`),
    detailsCard(detailsRows),
    button("Complete Payment", actionUrl, BRAND.primary),
    fallbackLink(actionUrl),
    callout("<strong>Avoid Service Interruption:</strong> Please complete your payment before the due date to ensure your features and team access remain active."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Action Required: Payment due soon for ${BRAND.name}`,
    html: renderEmailLayout({
      title: "Payment Almost Due",
      preheader: `Your ${BRAND.name} ${planName} subscription payment of ${formattedAmount} is due on ${dueDate}.`,
      bodyContent,
    }),
    text: `Hi ${name},\n\nYour ${BRAND.name} ${planName} subscription payment of ${formattedAmount} is due on ${dueDate}.\n\nPlease complete your payment to ensure uninterrupted service:\n${actionUrl}\n\n- The ${BRAND.name} Team`,
  });
}
