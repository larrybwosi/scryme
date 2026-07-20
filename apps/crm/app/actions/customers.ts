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
      businessAccountId:
        validatedData.businessAccountId === ""
          ? null
          : validatedData.businessAccountId || null,
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
        ...cleanData,
        customId: finalCustomId || null,
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

    const cleanData = {
      ...validatedData,
      email: validatedData.email === "" ? null : validatedData.email || null,
      businessAccountId:
        validatedData.businessAccountId === ""
          ? null
          : validatedData.businessAccountId || null,
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
        ...cleanData,
        customId: validatedData.customId || null,
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
    const where: any = { organizationId };

    if (filter?.type === "B2C") {
      where.customerType = "B2C";
      where.businessAccountId = null;
    } else if (filter?.type === "CONTACT") {
      where.businessAccountId = { not: null };
    }

    if (filter?.businessAccountId) {
      where.businessAccountId = filter.businessAccountId;
    }

    const customers = await db.customer.findMany({
      where,
      include: {
        businessAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

export async function getCustomer(id: string): Promise<any> {
  try {
    let customer = await db.customer.findUnique({
      where: { id },
      include: {
        businessAccount: true,
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
        where: { id },
        data: { crmRecordId: record.id },
        include: {
          businessAccount: true,
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

    return customer;
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw new Error("Failed to fetch customer");
  }
}
