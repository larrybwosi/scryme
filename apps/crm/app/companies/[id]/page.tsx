import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCompany } from "../../actions/companies";
import { CompanyDetailView } from "./_components/company-detail-view";
import { db } from "@repo/db";
import { getOrganizationContext } from "../../actions/auth";

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) {
    return {
      title: "Company Not Found",
    };
  }

  const name = company.name || "Company Account";

  return {
    title: `${name} | Company Profile`,
    description: `B2B business account details and organizational context for ${name} on Scryme CRM.`,
    alternates: {
      canonical: `/companies/${id}`,
    },
    openGraph: {
      title: `${name} | Company Profile | Scryme CRM`,
      description: `B2B business account details and organizational context for ${name} on Scryme CRM.`,
      url: `https://crm.scryme.tech/companies/${id}`,
    },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const [company, context] = await Promise.all([
    getCompany(id),
    getOrganizationContext(),
  ]);
  if (!company) notFound();

  const settings = context
    ? await db.organizationSettings.findUnique({
        where: { organizationId: context.organizationId },
      })
    : null;
  const currency = settings?.defaultCurrency || "USD";

  return (
    <Suspense fallback={<div>Loading company details...</div>}>
      <CompanyDetailView company={company as any} currency={currency} />
    </Suspense>
  );
}
