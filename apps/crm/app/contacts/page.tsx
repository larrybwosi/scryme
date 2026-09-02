import { Metadata } from "next";
import { ContactsView } from "./_components/contacts-view";

export const metadata: Metadata = {
  title: "Contact Directory",
  description:
    "Manage client contacts, organization members, communication logs, and individual outreach history.",
  alternates: {
    canonical: "/contacts",
  },
  openGraph: {
    title: "Contact Directory | Scryme CRM",
    description:
      "Manage client contacts, organization members, communication logs, and individual outreach history.",
    url: "https://crm.scryme.tech/contacts",
  },
};

export default async function ContactsPage() {
  return <ContactsView />;
}
