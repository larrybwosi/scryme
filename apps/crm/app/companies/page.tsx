import { Metadata } from "next";
import { CompaniesView } from "./_components/companies-view";

export const metadata: Metadata = {
  title: "Company & Business Accounts",
  description:
    "Manage B2B company accounts, corporate clients, parent organizations, and associate key stakeholders.",
  alternates: {
    canonical: "/companies",
  },
  openGraph: {
    title: "Company & Business Accounts | Scryme CRM",
    description:
      "Manage B2B company accounts, corporate clients, parent organizations, and associate key stakeholders.",
    url: "https://crm.scryme.tech/companies",
  },
};

export default async function CompaniesPage() {
  return <CompaniesView />;
}
