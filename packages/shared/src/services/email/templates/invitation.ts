import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, button, detailsCard, fallbackLink, expiryNote, renderEmailLayout } from "../layout";

export interface SendOrganizationInvitationEmailParams {
  email: string;
  url: string;
  inviterName?: string | null;
  organizationName: string;
  role: string;
}

/**
 * Send organization invitation email to user
 */
export async function sendOrganizationInvitationEmail(params: SendOrganizationInvitationEmailParams): Promise<EmailResult> {
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
