"use server";

import { db } from "@repo/db";
import { customerSchema, type CustomerFormValues } from "../../lib/validations";
import { revalidatePath } from "next/cache";

export async function createCustomer(
  data: CustomerFormValues,
  organizationId: string,
): Promise<any> {
  try {
    const validatedData = customerSchema.parse(data);

    const customer = await db.customer.create({
      data: {
        ...validatedData,
        organizationId,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/contacts");
    return { success: true, data: customer };
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

    const customer = await db.customer.update({
      where: { id },
      data: validatedData,
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
    await db.customer.delete({
      where: { id },
    });

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

export async function getCustomers(
  organizationId: string,
  filter?: { type?: "B2C" | "B2B" | "CONTACT"; businessAccountId?: string },
): Promise<any[]> {
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
    const customer = await db.customer.findUnique({
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
    return customer;
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw new Error("Failed to fetch customer");
  }
}
