"use server";

import { db } from "@repo/db";
import { customerSchema, type CustomerFormValues } from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { realtimeService } from "@repo/shared/realtime";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function getLocations(): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    return await db.inventoryLocation.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function getCustomerIdSettings(): Promise<any> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { customFields: true },
  });
  const customFields = org?.customFields as any;
  return (
    customFields?.customerIdSettings || {
      autoGenerate: false,
      prefix: "CUST-",
      sequence: 1001,
    }
  );
}

export async function saveCustomerIdSettings(settings: any): Promise<any> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { customFields: true },
    });
    const customFields = (org?.customFields || {}) as any;
    await db.organization.update({
      where: { id: organizationId },
      data: {
        customFields: {
          ...customFields,
          customerIdSettings: {
            autoGenerate: settings.autoGenerate,
            prefix: settings.prefix || "CUST-",
            sequence: parseInt(settings.sequence) || 1001,
          },
        },
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateNextCustomId(): Promise<string | null> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { customFields: true },
  });
  if (!org) return null;
  const customFields = org.customFields as any;
  const settings = customFields?.customerIdSettings;
  if (!settings || !settings.autoGenerate) return null;

  const prefix = settings.prefix || "CUST-";
  const sequence = settings.sequence || 1001;
  const nextSequence = sequence + 1;

  await db.organization.update({
    where: { id: organizationId },
    data: {
      customFields: {
        ...customFields,
        customerIdSettings: {
          ...settings,
          sequence: nextSequence,
        },
      },
    },
  });

  return `${prefix}${sequence}`;
}

export async function createCustomer(data: CustomerFormValues): Promise<any> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const validatedData = customerSchema.parse(data);

    // If it's a B2B Company Contact
    if (validatedData.businessAccountId) {
      const contact = await db.companyContact.create({
        data: {
          name: validatedData.name,
          email: validatedData.email === "" ? null : validatedData.email || null,
          phone: validatedData.phone === "" ? null : validatedData.phone || null,
          businessAccountId: validatedData.businessAccountId,
          organizationId,
        },
      });
      revalidatePath("/customers");
      revalidatePath("/contacts");
      return { success: true, data: contact };
    }

    let finalCustomId = validatedData.customId;
    if (!finalCustomId) {
      const generated = await generateNextCustomId();
      if (generated) {
        finalCustomId = generated;
      }
    }

    const cleanData = {
      ...validatedData,
      email: validatedData.email === "" ? null : validatedData.email || null,
      phone: validatedData.phone === "" ? null : validatedData.phone || null,
      company:
        validatedData.company === "" ? null : validatedData.company || null,
      taxId: validatedData.taxId === "" ? null : validatedData.taxId || null,
      deliveryNotes:
        validatedData.deliveryNotes === ""
          ? null
          : validatedData.deliveryNotes || null,
      defaultLocationId:
        validatedData.defaultLocationId === "" ||
        validatedData.defaultLocationId === "none"
          ? null
          : validatedData.defaultLocationId || null,
    };

    const customer = await db.customer.create({
      data: {
        name: cleanData.name,
        email: cleanData.email,
        phone: cleanData.phone,
        company: cleanData.company,
        customerType: cleanData.customerType,
        taxId: cleanData.taxId,
        isActive: cleanData.isActive,
        deliveryNotes: cleanData.deliveryNotes,
        defaultLocationId: cleanData.defaultLocationId,
        customId: finalCustomId || null,
        tags: cleanData.tags || [],
        organizationId,
      },
    });

    // Proactively initialize CRM Record for customer
    let objectDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: "customer" } },
    });

    if (!objectDef) {
      objectDef = await db.crmObjectDefinition.create({
        data: {
          organizationId,
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
        organizationId,
        data: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
    });

    const updatedCustomer = await db.customer.update({
      where: { id: customer.id },
      data: { crmRecordId: record.id },
    });

    revalidatePath("/customers");
    revalidatePath("/contacts");
    return { success: true, data: updatedCustomer };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return {
      success: false,
      error: error.message || "Failed to create customer",
    };
  }
}

export async function updateCustomer(
  id: string,
  data: CustomerFormValues,
): Promise<any> {
  try {
    const validatedData = customerSchema.parse(data);

    // If B2B Company Contact
    if (validatedData.businessAccountId) {
      const contact = await db.companyContact.update({
        where: { id },
        data: {
          name: validatedData.name,
          email: validatedData.email === "" ? null : validatedData.email || null,
          phone: validatedData.phone === "" ? null : validatedData.phone || null,
          businessAccountId: validatedData.businessAccountId,
        },
      });
      revalidatePath("/customers");
      revalidatePath("/contacts");
      revalidatePath(`/customers/${id}`);
      return { success: true, data: contact };
    }

    const cleanData = {
      ...validatedData,
      email: validatedData.email === "" ? null : validatedData.email || null,
      phone: validatedData.phone === "" ? null : validatedData.phone || null,
      company:
        validatedData.company === "" ? null : validatedData.company || null,
      taxId: validatedData.taxId === "" ? null : validatedData.taxId || null,
      deliveryNotes:
        validatedData.deliveryNotes === ""
          ? null
          : validatedData.deliveryNotes || null,
      defaultLocationId:
        validatedData.defaultLocationId === "" ||
        validatedData.defaultLocationId === "none"
          ? null
          : validatedData.defaultLocationId || null,
    };

    const customer = await db.customer.update({
      where: { id },
      data: {
        name: cleanData.name,
        email: cleanData.email,
        phone: cleanData.phone,
        company: cleanData.company,
        customerType: cleanData.customerType,
        taxId: cleanData.taxId,
        isActive: cleanData.isActive,
        deliveryNotes: cleanData.deliveryNotes,
        defaultLocationId: cleanData.defaultLocationId,
        customId: validatedData.customId || null,
        tags: cleanData.tags || [],
      },
    });

    revalidatePath("/customers");
    revalidatePath("/contacts");
    revalidatePath(`/customers/${id}`);
    return { success: true, data: customer };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return {
      success: false,
      error: error.message || "Failed to update customer",
    };
  }
}

export async function deleteCustomer(id: string): Promise<any> {
  try {
    // Check if it's a company contact first
    const companyContact = await db.companyContact.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (companyContact) {
      await db.companyContact.delete({
        where: { id },
      });
      revalidatePath("/customers");
      revalidatePath("/contacts");
      return { success: true };
    }

    const customer = await db.customer.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    await db.customer.delete({
      where: { id },
    });

    if (customer?.organizationId) {
      await realtimeService.publish(
        `organization:${customer.organizationId}:customers`,
        "customer-deleted",
        { customerId: id },
      );
    }

    revalidatePath("/customers");
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return {
      success: false,
      error: error.message || "Failed to delete customer",
    };
  }
}

export async function getCustomers(filter?: {
  type?: "B2C" | "B2B" | "CONTACT";
  businessAccountId?: string;
}): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    if (filter?.type === "CONTACT" || filter?.businessAccountId) {
      const where: any = { organizationId };
      if (filter.businessAccountId) {
        where.businessAccountId = filter.businessAccountId;
      }
      const contacts = await db.companyContact.findMany({
        where,
        include: {
          businessAccount: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return contacts.map(c => ({ ...c, customerType: "B2B" }));
    }

    const where: any = { organizationId };

    if (filter?.type === "B2C") {
      where.customerType = "B2C";
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return customers.map(c => ({ ...c, businessAccount: null }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

export async function getCustomer(id: string): Promise<any> {
  try {
    // Check if it's a company contact first
    const companyContact = await db.companyContact.findUnique({
      where: { id },
      include: {
        businessAccount: true,
      },
    });

    if (companyContact) {
      return {
        ...companyContact,
        customerType: "B2B",
        isActive: true,
        addresses: [],
        invoices: [],
        transactions: [],
        crmRecord: null,
      };
    }

    let customer = await db.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        invoices: {
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        transactions: {
          include: {
            items: true,
            fulfillments: {
              include: {
                items: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
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
              take: 20,
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
              take: 20,
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
              take: 20,
            },
          },
        },
      },
    });

    if (customer && !customer.crmRecordId) {
      let objectDef = await db.crmObjectDefinition.findUnique({
        where: {
          organizationId_name: {
            organizationId: customer.organizationId,
            name: "customer",
          },
        },
      });

      if (!objectDef) {
        objectDef = await db.crmObjectDefinition.create({
          data: {
            organizationId: customer.organizationId,
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
          organizationId: customer.organizationId,
          data: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
        },
      });

      customer = await db.customer.update({
        where: { id: customer.id },
        data: { crmRecordId: record.id },
        include: {
          addresses: true,
          invoices: {
            include: {
              items: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          transactions: {
            include: {
              items: true,
              fulfillments: {
                include: {
                  items: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
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
                take: 20,
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
                take: 20,
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
                take: 20,
              },
            },
          },
        },
      });
    }

    return { ...customer, businessAccount: null };
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw new Error("Failed to fetch customer");
  }
}

export async function bulkAddTagsToCustomers(
  customerIds: string[],
  tags: string[],
): Promise<any> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const cleanTags = tags
      .map((t) => t.trim())
      .filter((t) => t !== "");

    if (cleanTags.length === 0) {
      return { success: true, message: "No tags to add" };
    }

    // Fetch the customers to get their existing tags and ensure multi-tenant isolation
    const customersToUpdate = await db.customer.findMany({
      where: {
        id: { in: customerIds },
        organizationId,
      },
      select: {
        id: true,
        tags: true,
      },
    });

    // Update each customer's tags
    await Promise.all(
      customersToUpdate.map(async (customer) => {
        const mergedTags = Array.from(
          new Set([...customer.tags, ...cleanTags])
        );

        return db.customer.update({
          where: { id: customer.id },
          data: {
            tags: mergedTags,
          },
        });
      })
    );

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Error bulk adding tags:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk add tags",
    };
  }
}
