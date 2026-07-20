"use server";

import { db } from "@repo/db";
import {
  businessAccountSchema,
  type BusinessAccountFormValues,
} from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function createCompany(data: BusinessAccountFormValues) {
  try {
    const auth = await getServerAuth();
    if (!auth) redirect("/login");
    const { contacts, ...rest } = businessAccountSchema.parse(data);

    const company = await db.businessAccount.create({
      data: {
        ...rest,
        organizationId: auth.organizationId,
        customers:
          contacts && contacts.length > 0
            ? {
                create: contacts.map((contact) => ({
                  ...contact,
                  organizationId: auth.organizationId,
                  customerType: "B2B",
                })),
              }
            : undefined,
      },
    });

    // Proactively initialize CRM Record for business account / company
    let objectDef = await db.crmObjectDefinition.findUnique({
      where: {
        organizationId_name: {
          organizationId: auth.organizationId,
          name: "business_account",
        },
      },
    });

    if (!objectDef) {
      objectDef = await db.crmObjectDefinition.create({
        data: {
          organizationId: auth.organizationId,
          name: "business_account",
          label: "Business Account",
          labelPlural: "Business Accounts",
          isSystem: true,
        },
      });
    }

    const record = await db.crmRecord.create({
      data: {
        objectId: objectDef.id,
        organizationId: auth.organizationId,
        data: {
          name: company.name,
          taxId: company.taxId,
        },
      },
    });

    const updatedCompany = await db.businessAccount.update({
      where: { id: company.id },
      data: { crmRecordId: record.id },
    });

    revalidatePath("/companies");
    revalidatePath("/contacts");
    return { success: true, data: updatedCompany };
  } catch (error: any) {
    console.error("Error creating company:", error);
    return {
      success: false,
      error: error.message || "Failed to create company",
    };
  }
}

export async function updateCompany(
  id: string,
  data: BusinessAccountFormValues,
) {
  try {
    const { contacts, ...rest } = businessAccountSchema.parse(data);

    const company = await db.businessAccount.update({
      where: { id },
      data: rest,
    });

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    return { success: true, data: company };
  } catch (error: any) {
    console.error("Error updating company:", error);
    return {
      success: false,
      error: error.message || "Failed to update company",
    };
  }
}

export async function deleteCompany(id: string) {
  try {
    await db.businessAccount.delete({
      where: { id },
    });

    revalidatePath("/companies");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return {
      success: false,
      error: error.message || "Failed to delete company",
    };
  }
}

export async function getCompanies() {
  try {
    const auth = await getServerAuth();
    if (!auth) redirect("/login");

    const companies = await db.businessAccount.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return companies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw new Error("Failed to fetch companies");
  }
}

export async function getCompany(id: string): Promise<any> {
  try {
    let company = await db.businessAccount.findUnique({
      where: { id },
      include: {
        customers: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        crmRecord: {
          include: {
            activities: {
              include: {
                member: {
                  include: {
                    user: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            notes: {
              include: {
                createdBy: {
                  include: {
                    user: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            followUps: {
              include: {
                assignedTo: {
                  include: {
                    user: true,
                  },
                },
              },
              orderBy: { dueDate: "asc" },
              take: 10,
            },
          },
        },
      },
    });

    if (company && !company.crmRecordId) {
      let objectDef = await db.crmObjectDefinition.findUnique({
        where: {
          organizationId_name: {
            organizationId: company.organizationId,
            name: "business_account",
          },
        },
      });

      if (!objectDef) {
        objectDef = await db.crmObjectDefinition.create({
          data: {
            organizationId: company.organizationId,
            name: "business_account",
            label: "Business Account",
            labelPlural: "Business Accounts",
            isSystem: true,
          },
        });
      }

      const record = await db.crmRecord.create({
        data: {
          objectId: objectDef.id,
          organizationId: company.organizationId,
          data: {
            name: company.name,
            taxId: company.taxId,
          },
        },
      });

      company = await db.businessAccount.update({
        where: { id },
        data: { crmRecordId: record.id },
        include: {
          customers: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          crmRecord: {
            include: {
              activities: {
                include: {
                  member: {
                    include: {
                      user: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              notes: {
                include: {
                  createdBy: {
                    include: {
                      user: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              followUps: {
                include: {
                  assignedTo: {
                    include: {
                      user: true,
                    },
                  },
                },
                orderBy: { dueDate: "asc" },
                take: 10,
              },
            },
          },
        },
      });
    }

    return company;
  } catch (error) {
    console.error("Error fetching company:", error);
    throw new Error("Failed to fetch company");
  }
}
