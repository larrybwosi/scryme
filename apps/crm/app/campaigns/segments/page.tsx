import { Metadata } from "next";
import { SegmentsView } from "./_components/segments-view";

export const metadata: Metadata = {
  title: "Audience Segments",
  description:
    "Build custom audience groups, segment leads by behavior and demographic traits, and target high-value clients.",
  alternates: {
    canonical: "/campaigns/segments",
  },
  openGraph: {
    title: "Audience Segments | Scryme CRM",
    description:
      "Build custom audience groups, segment leads by behavior and demographic traits, and target high-value clients.",
    url: "https://crm.scryme.tech/campaigns/segments",
  },
};

export default async function SegmentsPage() {
  return <SegmentsView />;
}
