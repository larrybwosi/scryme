"use server";

import { db } from "@repo/db";
import {
  crmObjectDefinitionSchema,
  type CrmObjectDefinitionFormValues,
} from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function createObjectDefinition(
  data: CrmObjectDefinitionFormValues,
) {
  const validatedData = crmObjectDefinitionSchema.parse(data);

  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;
  const definition = await db.crmObjectDefinition.create({
    data: {
      ...validatedData,
      organizationId,
    },
  });

  revalidatePath("/settings/crm");
  return definition;
}

export async function getObjectDefinitions(): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;
  return await db.crmObjectDefinition.findMany({
    where: { organizationId },
    include: {
      fields: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getObjectDefinition(id: string): Promise<any> {
  return await db.crmObjectDefinition.findUnique({
    where: { id },
    include: {
      fields: true,
    },
  });
}
