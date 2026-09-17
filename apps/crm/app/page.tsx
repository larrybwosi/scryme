import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "CRM | Client Relationship Management",
  description:
    "Enterprise CRM & Client Relationship Management platform by Scryme. Track leads, manage customer contacts, automate sales pipelines, run marketing campaigns, and analyze deals seamlessly.",
  keywords: [
    "CRM",
    "Client Relationship Management",
    "Sales Pipeline",
    "Lead Management",
    "Customer Insights",
    "Contact Directory",
    "Marketing Campaigns",
    "Workflow Automation",
    "Business Intelligence",
    "Scryme CRM",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scryme CRM | Enterprise Client Relationship Management",
    description:
      "Enterprise CRM & Client Relationship Management platform by Scryme. Track leads, manage customer contacts, automate sales pipelines, run marketing campaigns, and analyze deals seamlessly.",
    url: "https://crm.scryme.tech",
    siteName: "Scryme CRM",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scryme CRM Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme CRM | Enterprise Client Relationship Management",
    description:
      "Enterprise CRM & Client Relationship Management platform by Scryme. Track leads, manage customer contacts, automate sales pipelines, run marketing campaigns, and analyze deals seamlessly.",
    creator: "@scryme",
    images: ["/og-image.png"],
  },
};

export default function Home() {
  redirect('/dashboard');
}
