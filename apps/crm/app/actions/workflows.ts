import { db } from '@repo/db';

export async function getWorkflow(id: string) {
  return await db.campaignWorkflow.findUnique({
    where: { id },
    include: {
      organization: true,
    }
  });
}
