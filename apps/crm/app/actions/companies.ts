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
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;
    const { contacts, addresses, ...rest } = businessAccountSchema.parse(data);

    const logoUrl = rest.logoUrl === "" ? null : rest.logoUrl || null;
    const taxId = rest.taxId === "" ? null : rest.taxId || null;
    const customTheme =
      rest.customTheme === "" ? null : rest.customTheme || null;

    const company = await db.businessAccount.create({
      data: {
        name: rest.name,
        taxId,
        logoUrl,
        customTheme,
        isEnterprise: rest.isEnterprise,
        discountPercentage: rest.discountPercentage,
        paymentTermsDays: rest.paymentTermsDays,
        organizationId,
      },
    });

    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        await db.companyContact.create({
          data: {
            name: contact.name,
            email: contact.email === "" ? null : contact.email || null,
            phone: contact.phone === "" ? null : contact.phone || null,
            organizationId,
            businessAccountId: company.id,
          },
        });
      }
    }

    if (addresses && addresses.length > 0) {
      for (const addr of addresses) {
        await db.address.create({
          data: {
            businessAccountId: company.id,
            label: addr.label || null,
            street1: addr.street1,
            street2: addr.street2 || null,
            city: addr.city,
            state: addr.state || null,
            postalCode: addr.postalCode || null,
            country: addr.country,
            isDefault: addr.isDefault,
            type: addr.type,
          },
        });
      }
    }

    // Proactively initialize CRM Record for business account / company
    let objectDef = await db.crmObjectDefinition.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: "business_account",
        },
      },
    });

    if (!objectDef) {
      objectDef = await db.crmObjectDefinition.create({
        data: {
          organizationId,
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
        organizationId,
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
    if (!auth?.organizationId) redirect("/login");
    const organizationId = auth.organizationId;

    const { contacts, addresses, ...rest } = businessAccountSchema.parse(data);

    const logoUrl = rest.logoUrl === "" ? null : rest.logoUrl || null;
    const taxId = rest.taxId === "" ? null : rest.taxId || null;
    const customTheme =
      rest.customTheme === "" ? null : rest.customTheme || null;

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
      const existingContacts = await db.companyContact.findMany({
        where: { businessAccountId: id },
        select: { id: true },
      });
      const existingIds = existingContacts.map((c) => c.id);

      // Extract IDs from submitted contacts
      const submittedIds = contacts
        .map((c: any) => c.contactId)
        .filter(Boolean) as string[];

      // Contacts to delete/unlink
      const toDelete = existingIds.filter(
        (extId) => !submittedIds.includes(extId),
      );

      if (toDelete.length > 0) {
        await db.companyContact.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Contacts to update or create
      for (const contact of contacts) {
        const cleanContact = {
          name: contact.name,
          email: contact.email === "" ? null : contact.email || null,
          phone: contact.phone === "" ? null : contact.phone || null,
          organizationId,
          businessAccountId: id,
        };

        if (contact.contactId) {
          await db.companyContact.update({
            where: { id: contact.contactId },
            data: cleanContact,
          });
        } else {
          await db.companyContact.create({
            data: cleanContact,
          });
        }
      }
    }

    if (addresses) {
      // Get existing addresses for this company
      const existingAddresses = await db.address.findMany({
        where: { businessAccountId: id },
        select: { id: true },
      });
      const existingIds = existingAddresses.map((a) => a.id);

      // Extract IDs from submitted addresses
      const submittedIds = addresses
        .map((a: any) => a.id)
        .filter(Boolean) as string[];

      // Addresses to delete/unlink
      const toDelete = existingIds.filter(
        (extId) => !submittedIds.includes(extId),
      );

      if (toDelete.length > 0) {
        await db.address.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Addresses to update or create
      for (const addr of addresses) {
        const cleanAddr = {
          label: addr.label || null,
          street1: addr.street1,
          street2: addr.street2 || null,
          city: addr.city,
          state: addr.state || null,
          postalCode: addr.postalCode || null,
          country: addr.country,
          isDefault: addr.isDefault,
          type: addr.type,
          businessAccountId: id,
        };

        if (addr.id) {
          await db.address.update({
            where: { id: addr.id },
            data: cleanAddr,
          });
        } else {
          await db.address.create({
            data: cleanAddr,
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
    if (!auth?.organizationId) redirect("/login");

    const companies = await db.businessAccount.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        contacts: true,
        _count: {
          select: { contacts: true },
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
        contacts: true,
        addresses: true,
        invoices: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
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
          contacts: true,
          addresses: true,
          invoices: {
            include: { items: true },
            orderBy: { createdAt: "desc" },
          },
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
