import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCompany } from "../../actions/companies";
import { CompanyDetailView } from "./_components/company-detail-view";

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <Suspense fallback={<div>Loading company details...</div>}>
      <CompanyDetailView company={company as any} />
    </Suspense>
  );
}
