"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { DriverStatus } from "@repo/db";

export async function getDrivers() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const drivers = await db.driver.findMany({
      where: {
        organizationId: session.organizationId,
      },
      include: {
        vehicle: true,
        deliveryPartner: true,
        _count: {
          select: { fulfillments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: drivers };
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch drivers",
    };
  }
}

export async function createDriver(data: {
  name: string;
  email?: string;
  phone: string;
  vehicleId?: string;
  deliveryPartnerId?: string;
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const driver = await db.driver.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        organizationId: session.organizationId,
        vehicleId: data.vehicleId || null,
        deliveryPartnerId: data.deliveryPartnerId || null,
      },
    });

    revalidatePath("/staff/drivers");
    return { success: true, data: driver };
  } catch (error: any) {
    console.error("Error creating driver:", error);
    return {
      success: false,
      error: error.message || "Failed to create driver",
    };
  }
}

export async function updateDriver(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    availability?: DriverStatus;
    vehicleId?: string;
    deliveryPartnerId?: string;
  },
) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const driver = await db.driver.update({
      where: {
        id,
        organizationId: session.organizationId,
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        availability: data.availability,
        vehicleId: data.vehicleId === "" ? null : data.vehicleId,
        deliveryPartnerId:
          data.deliveryPartnerId === "" ? null : data.deliveryPartnerId,
      },
    });

    revalidatePath("/staff/drivers");
    revalidatePath(`/staff/drivers/${id}`);
    return { success: true, data: driver };
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return {
      success: false,
      error: error.message || "Failed to update driver",
    };
  }
}

export async function deleteDriver(id: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.driver.delete({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/staff/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return {
      success: false,
      error: error.message || "Failed to delete driver",
    };
  }
}

export async function getDriverDetail(id: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const driver = await db.driver.findUnique({
      where: {
        id,
        organizationId: session.organizationId,
      },
      include: {
        vehicle: true,
        deliveryPartner: true,
        fulfillments: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            transaction: {
              select: {
                number: true,
                finalTotal: true,
                currencyCode: true,
              },
            },
          },
        },
      },
    });

    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    return { success: true, data: driver };
  } catch (error: any) {
    console.error("Error fetching driver detail:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch driver detail",
    };
  }
}

export async function getVehicles() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const vehicles = await db.vehicle.findMany({
      where: {
        organizationId: session.organizationId,
        isActive: true,
      },
    });

    return { success: true, data: vehicles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeliveryPartners() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const partners = await db.deliveryPartner.findMany({
      where: {
        organizationId: session.organizationId,
        isActive: true,
      },
    });

    return { success: true, data: partners };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
