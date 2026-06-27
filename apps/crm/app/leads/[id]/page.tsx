import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@repo/db";
import { LeadDetailView } from "./_components/lead-detail-view";

interface LeadPageProps {
  params: Promise<{ id: string }>;
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
