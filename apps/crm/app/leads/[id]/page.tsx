import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@repo/db";
import { LeadDetailView } from "./_components/lead-detail-view";

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: LeadPageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await db.crmRecord
    .findUnique({
      where: { id },
      include: { objectDefinition: true },
    })
    .catch(() => null);

  const data = (lead?.data as Record<string, any>) || {};
  const nameFromParts = `${data.first_name || ""} ${data.last_name || ""}`.trim();
  const title = data.name || data.title || nameFromParts || "Lead Record";

  return {
    title: `${title} | Lead Details`,
    description: `Track prospect status, qualification criteria, activity logs, and follow-ups for ${title}.`,
    alternates: {
      canonical: `/leads/${id}`,
    },
    openGraph: {
      title: `${title} | Lead Details | Scryme CRM`,
      description: `Track prospect status, qualification criteria, activity logs, and follow-ups for ${title}.`,
      url: `https://crm.scryme.tech/leads/${id}`,
    },
  };
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params;

  const lead = await db.crmRecord.findUnique({
    where: { id },
    include: {
      objectDefinition: {
        include: { fields: { orderBy: { order: "asc" } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { member: { include: { user: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { include: { user: true } } },
      },
      followUps: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { include: { user: true } } },
      },
    },
  });

  if (!lead || lead.objectDefinition.name !== "lead") notFound();

  return (
    <Suspense fallback={<div>Loading lead details...</div>}>
      <LeadDetailView lead={lead as any} />
    </Suspense>
  );
}
