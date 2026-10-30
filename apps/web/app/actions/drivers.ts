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
    return { success: false, error: error.message || "Failed to fetch drivers" };
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
    /**
     * OPTIMIZATION & SECURITY (BOLA/IDOR):
     * Parallelize relational entity validation lookups (vehicle and delivery partner).
     * Replacing sequential DB query roundtrips with Promise.all reduces validation latency
     * from 2 sequential DB roundtrips to 1 concurrent roundtrip while guaranteeing BOLA multi-tenant isolation.
     */
    const [vehicle, partner] = await Promise.all([
      data.vehicleId
        ? db.vehicle.findFirst({
            where: {
              id: data.vehicleId,
              organizationId: session.organizationId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      data.deliveryPartnerId
        ? db.deliveryPartner.findFirst({
            where: {
              id: data.deliveryPartnerId,
              organizationId: session.organizationId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (data.vehicleId && !vehicle) {
      return { success: false, error: "Vehicle not found or belongs to another organization" };
    }

    if (data.deliveryPartnerId && !partner) {
      return { success: false, error: "Delivery partner not found or belongs to another organization" };
    }

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
    return { success: false, error: error.message || "Failed to create driver" };
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
  }
) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    /**
     * OPTIMIZATION & SECURITY (BOLA/IDOR):
     * Parallelize relational entity validation lookups (vehicle and delivery partner).
     * Replacing sequential DB query roundtrips with Promise.all reduces validation latency
     * from 2 sequential DB roundtrips to 1 concurrent roundtrip while guaranteeing BOLA multi-tenant isolation.
     */
    const hasVehicleId = Boolean(data.vehicleId && data.vehicleId !== "");
    const hasPartnerId = Boolean(data.deliveryPartnerId && data.deliveryPartnerId !== "");

    const [vehicle, partner] = await Promise.all([
      hasVehicleId
        ? db.vehicle.findFirst({
            where: {
              id: data.vehicleId,
              organizationId: session.organizationId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      hasPartnerId
        ? db.deliveryPartner.findFirst({
            where: {
              id: data.deliveryPartnerId,
              organizationId: session.organizationId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (hasVehicleId && !vehicle) {
      return { success: false, error: "Vehicle not found or belongs to another organization" };
    }

    if (hasPartnerId && !partner) {
      return { success: false, error: "Delivery partner not found or belongs to another organization" };
    }

    /**
     * SECURITY MITIGATION (BOLA/IDOR Isolation):
     * The `Driver` model lacks a composite unique constraint on `[id, organizationId]`.
     * Standard Prisma `update({ where: { id, organizationId } })` ignores non-unique `organizationId`
     * filters at database execution time. We use `updateMany` strictly scoped by `{ id, organizationId }`
     * followed by `findFirstOrThrow` to guarantee database-level tenant isolation.
     */
    const result = await db.driver.updateMany({
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
        deliveryPartnerId: data.deliveryPartnerId === "" ? null : data.deliveryPartnerId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Driver not found or access denied" };
    }

    const driver = await db.driver.findFirstOrThrow({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/staff/drivers");
    revalidatePath(`/staff/drivers/${id}`);
    return { success: true, data: driver };
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return { success: false, error: error.message || "Failed to update driver" };
  }
}

export async function deleteDriver(id: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    /**
     * SECURITY MITIGATION (BOLA/IDOR Isolation):
     * The `Driver` model lacks a composite unique constraint on `[id, organizationId]`.
     * Standard Prisma `delete({ where: { id, organizationId } })` ignores non-unique `organizationId`
     * filters at database execution time. We use `deleteMany` strictly scoped by `{ id, organizationId }`
     * to guarantee database-level multi-tenant isolation.
     */
    const result = await db.driver.deleteMany({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Driver not found or access denied" };
    }

    revalidatePath("/staff/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return { success: false, error: error.message || "Failed to delete driver" };
  }
}

export async function getDriverDetail(id: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    /**
     * SECURITY MITIGATION (BOLA/IDOR Isolation):
     * Use `findFirst` with explicit `organizationId` filtering instead of `findUnique`
     * because `Driver` lacks a composite unique key on `[id, organizationId]`.
     */
    const driver = await db.driver.findFirst({
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
    return { success: false, error: error.message || "Failed to fetch driver detail" };
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
