import { Metadata } from "next";
import { ActivitiesView } from "./_components/activities-view";

export const metadata: Metadata = {
  title: "Activity Stream & Interactions",
  description:
    "Track sales team interactions, logged calls, meeting schedules, tasks, and historical client communications.",
  alternates: {
    canonical: "/activities",
  },
  openGraph: {
    title: "Activity Stream & Interactions | Scryme CRM",
    description:
      "Track sales team interactions, logged calls, meeting schedules, tasks, and historical client communications.",
    url: "https://crm.scryme.tech/activities",
  },
};

export default async function ActivitiesPage() {
  return <ActivitiesView />;
}
