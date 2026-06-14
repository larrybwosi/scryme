import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@repo/db';
import { DealDetailView } from './_components/deal-detail-view';

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;

  const deal = await db.crmRecord.findUnique({
    where: { id },
    include: {
      objectDefinition: true,
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
      targetAssociations: {
        include: {
          sourceRecord: {
            include: {
              customer: true,
              businessAccount: true,
            }
          }
        }
      }
    },
  });

  if (!deal || deal.objectDefinition.name !== 'deal') notFound();

  return (
    <Suspense fallback={<div>Loading deal details...</div>}>
      <DealDetailView deal={deal as any} />
    </Suspense>
  );
}
