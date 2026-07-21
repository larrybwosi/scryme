import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCompany } from '../../actions/companies';
import { CompanyDetailView } from './_components/company-detail-view';
import { db } from "@repo/db";
import { getOrganizationContext } from "../../actions/auth";

interface CompanyPageProps {
  params: Promise<{ id: string }>;
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
