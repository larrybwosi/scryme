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

    const logoUrl = rest.logoUrl === "" ? null : rest.logoUrl || null;
    const taxId = rest.taxId === "" ? null : rest.taxId || null;
    const customTheme = rest.customTheme === "" ? null : rest.customTheme || null;

    const company = await db.businessAccount.create({
      data: {
        name: rest.name,
        taxId,
        logoUrl,
        customTheme,
        isEnterprise: rest.isEnterprise,
        discountPercentage: rest.discountPercentage,
        paymentTermsDays: rest.paymentTermsDays,
        organizationId: auth.organizationId,
      },
    });

    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        const cleanContact = {
          name: contact.name,
          email: contact.email === "" ? null : contact.email || null,
          phone: contact.phone === "" ? null : contact.phone || null,
          organizationId: auth.organizationId,
          customerType: "B2B",
          businessAccountId: company.id,
        };

        const customer = await db.customer.create({
          data: cleanContact,
        });

        // Initialize CRM Record
        let objectDef = await db.crmObjectDefinition.findUnique({
          where: { organizationId_name: { organizationId: auth.organizationId, name: "customer" } },
        });

        if (!objectDef) {
          objectDef = await db.crmObjectDefinition.create({
            data: {
              organizationId: auth.organizationId,
              name: "customer",
              label: "Customer",
              labelPlural: "Customers",
              isSystem: true,
            },
          });
        }

        const record = await db.crmRecord.create({
          data: {
            objectId: objectDef.id,
            organizationId: auth.organizationId,
            data: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            },
          },
        });

        await db.customer.update({
          where: { id: customer.id },
          data: { crmRecordId: record.id },
        });
      }
    }

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
    const auth = await getServerAuth();
    if (!auth) redirect("/login");

    const { contacts, ...rest } = businessAccountSchema.parse(data);

    const logoUrl = rest.logoUrl === "" ? null : rest.logoUrl || null;
    const taxId = rest.taxId === "" ? null : rest.taxId || null;
    const customTheme = rest.customTheme === "" ? null : rest.customTheme || null;

    const company = await db.businessAccount.update({
      where: { id },
      data: {
        ...rest,
        logoUrl,
        taxId,
        customTheme,
      },
    });

    if (contacts) {
      // Get existing contacts for this company
      const existingCustomers = await db.customer.findMany({
        where: { businessAccountId: id },
        select: { id: true },
      });
      const existingIds = existingCustomers.map((c) => c.id);

      // Extract IDs from submitted contacts
      const submittedIds = contacts
        .map((c: any) => c.contactId)
        .filter(Boolean) as string[];

      // Contacts to delete/unlink
      const toDelete = existingIds.filter((extId) => !submittedIds.includes(extId));

      if (toDelete.length > 0) {
        await db.customer.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Contacts to update or create
      for (const contact of contacts) {
        const cleanContact = {
          name: contact.name,
          email: contact.email === "" ? null : contact.email || null,
          phone: contact.phone === "" ? null : contact.phone || null,
          organizationId: auth.organizationId,
          customerType: "B2B",
          businessAccountId: id,
        };

        if (contact.contactId) {
          await db.customer.update({
            where: { id: contact.contactId },
            data: cleanContact,
          });
        } else {
          const newCustomer = await db.customer.create({
            data: cleanContact,
          });

          // Proactively initialize CRM Record for customer
          let objectDef = await db.crmObjectDefinition.findUnique({
            where: { organizationId_name: { organizationId: auth.organizationId, name: "customer" } },
          });

          if (!objectDef) {
            objectDef = await db.crmObjectDefinition.create({
              data: {
                organizationId: auth.organizationId,
                name: "customer",
                label: "Customer",
                labelPlural: "Customers",
                isSystem: true,
              },
            });
          }

          const record = await db.crmRecord.create({
            data: {
              objectId: objectDef.id,
              organizationId: auth.organizationId,
              data: {
                name: newCustomer.name,
                email: newCustomer.email,
                phone: newCustomer.phone,
              },
            },
          });

          await db.customer.update({
            where: { id: newCustomer.id },
            data: { crmRecordId: record.id },
          });
        }
      }
    }

    revalidatePath("/companies");
    revalidatePath("/contacts");
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
        customers: true,
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
