import { notFound } from "next/navigation";
import { getIntegrationBySlug } from "@/app/actions/integrations";
import { IntegrationDetailClientWrapper } from "@/components/integrations/integration-detail-client";

interface IntegrationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function IntegrationDetailPage({ params }: IntegrationDetailPageProps) {
  const { slug } = await params;

  try {
    const data = await getIntegrationBySlug(slug);

    return <IntegrationDetailClientWrapper initialData={data} slug={slug} />;
  } catch (error) {
    notFound();
  }
}
