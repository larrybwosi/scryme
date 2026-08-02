"use server";

import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getOrCreateDealDefinition(organizationId: string) {
  let dealDef = await db.crmObjectDefinition.findUnique({
    where: { organizationId_name: { organizationId, name: "deal" } },
  });

  if (!dealDef) {
    dealDef = await db.crmObjectDefinition.create({
      data: {
        organizationId,
        name: "deal",
        label: "Deal",
        labelPlural: "Deals",
        isSystem: true,
      },
    });
  }

  return dealDef;
}

export async function getDeals() {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;
    const dealDef = await getOrCreateDealDefinition(organizationId);

    return await db.crmRecord.findMany({
      where: {
        objectId: dealDef.id,
        organizationId,
      },
      include: {
        targetAssociations: {
          include: {
            sourceRecord: {
              include: {
                customer: true,
                businessAccount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
}

export async function updateDealStage(dealId: string, stage: string) {
  try {
    const deal = await db.crmRecord.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error("Deal not found");

    const data = (deal.data as any) || {};

    await db.crmRecord.update({
      where: { id: dealId },
      data: {
        data: {
          ...data,
          stage,
        },
      },
    });

    revalidatePath("/pipeline");
    return { success: true };
  } catch (error) {
    console.error("Error updating deal stage:", error);
    return { success: false };
  }
}

export async function createDeal(input: any) {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;
    const { associatedCustomerId, associatedCompanyId, ...data } = input;

    const dealDef = await getOrCreateDealDefinition(organizationId);

    const deal = await db.crmRecord.create({
      data: {
        objectId: dealDef.id,
        organizationId,
        data,
      },
    });

    // Handle associations
    if (associatedCustomerId && associatedCustomerId !== "none") {
      const customer = await db.customer.findUnique({
        where: { id: associatedCustomerId },
      });
      if (customer?.crmRecordId) {
        await createAssociation(customer.crmRecordId, deal.id, "contact_deals");
      }
    }

    if (associatedCompanyId && associatedCompanyId !== "none") {
      const company = await db.businessAccount.findUnique({
        where: { id: associatedCompanyId },
      });
      if (company?.crmRecordId) {
        await createAssociation(company.crmRecordId, deal.id, "company_deals");
      }
    }

    revalidatePath("/pipeline");
    return { success: true, data: deal };
  } catch (error) {
    console.error("Error creating deal:", error);
    return { success: false, error: (error as any).message };
  }
}

async function createAssociation(
  sourceId: string,
  targetId: string,
  relationshipName: string,
) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return;
  const organizationId = auth.organizationId;

  let rel = await db.crmRelationshipDefinition.findUnique({
    where: { organizationId_name: { organizationId, name: relationshipName } },
  });

  if (!rel) {
    let sourceName = "";
    let targetName = "deal";
    let sourceLabel = "";
    let targetLabel = "Deal";

    if (relationshipName === "contact_deals" || relationshipName === "person_deals") {
      sourceName = "customer";
      sourceLabel = "Customer";
    } else if (relationshipName === "company_deals" || relationshipName === "business_account_deals") {
      sourceName = "business_account";
      sourceLabel = "Business Account";
    }

    if (sourceName) {
      let sourceDef = await db.crmObjectDefinition.findUnique({
        where: { organizationId_name: { organizationId, name: sourceName } },
      });
      if (!sourceDef) {
        sourceDef = await db.crmObjectDefinition.create({
          data: {
            organizationId,
            name: sourceName,
            label: sourceLabel,
            labelPlural: sourceLabel + "s",
            isSystem: true,
          },
        });
      }

      let targetDef = await db.crmObjectDefinition.findUnique({
        where: { organizationId_name: { organizationId, name: targetName } },
      });
      if (!targetDef) {
        targetDef = await db.crmObjectDefinition.create({
          data: {
            organizationId,
            name: targetName,
            label: targetLabel,
            labelPlural: targetLabel + "s",
            isSystem: true,
          },
        });
      }

      rel = await db.crmRelationshipDefinition.create({
        data: {
          organizationId,
          name: relationshipName,
          type: "ONE_TO_MANY",
          sourceObjectId: sourceDef.id,
          targetObjectId: targetDef.id,
          sourceLabel: "Deals",
          targetLabel: sourceLabel,
        },
      });
    }
  }

  if (!rel) return;

  // Check if association already exists to prevent unique constraints errors
  const existing = await db.crmAssociation.findUnique({
    where: {
      relationshipId_sourceRecordId_targetRecordId: {
        relationshipId: rel.id,
        sourceRecordId: sourceId,
        targetRecordId: targetId,
      },
    },
  });

  if (!existing) {
    await db.crmAssociation.create({
      data: {
        relationshipId: rel.id,
        sourceRecordId: sourceId,
        targetRecordId: targetId,
      },
    });
  }
}

export async function updateDeal(dealId: string, input: any) {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;
    const { associatedCustomerId, associatedCompanyId, ...data } = input;

    const deal = await db.crmRecord.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error("Deal not found");

    await db.crmRecord.update({
      where: { id: dealId },
      data: {
        data,
      },
    });

    // Clean up old associations
    await db.crmAssociation.deleteMany({
      where: {
        targetRecordId: dealId,
      },
    });

    // Handle associations
    if (associatedCustomerId && associatedCustomerId !== "none") {
      const customer = await db.customer.findUnique({
        where: { id: associatedCustomerId },
      });
      if (customer?.crmRecordId) {
        await createAssociation(customer.crmRecordId, dealId, "contact_deals");
      }
    }

    if (associatedCompanyId && associatedCompanyId !== "none") {
      const company = await db.businessAccount.findUnique({
        where: { id: associatedCompanyId },
      });
      if (company?.crmRecordId) {
        await createAssociation(company.crmRecordId, dealId, "company_deals");
      }
    }

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${dealId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating deal:", error);
    return { success: false, error: (error as any).message };
  }
}
