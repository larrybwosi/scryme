import { Metadata } from "next";
import { CustomersView } from "./_components/customers-view";

export const metadata: Metadata = {
  title: "Customer Profiles & Management",
  description:
    "Explore customer profiles, account lifecycles, active subscriptions, revenue attribution, and interaction logs.",
  alternates: {
    canonical: "/customers",
  },
  openGraph: {
    title: "Customer Profiles & Management | Scryme CRM",
    description:
      "Explore customer profiles, account lifecycles, active subscriptions, revenue attribution, and interaction logs.",
    url: "https://crm.scryme.tech/customers",
  },
};

export default async function CustomersPage() {
  return <CustomersView />;
}
