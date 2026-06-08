"use server";

import { db, LocationType, StorageUnitType, UnitType } from "@repo/db";
import { getOrganizationContext } from "./auth";
import { revalidatePath } from "next/cache";

export async function getLocations(): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.inventoryLocation.findMany({
    where: {
      organizationId: context.organizationId,
    },
    include: {
      _count: {
        select: {
          childLocations: true,
          zones: true,
          storageUnits: true,
          variantStocks: true,
        },
      },
      parentLocation: {
        select: {
          name: true,
        },
      },
      manager: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

<<<<<<< HEAD
export async function getMembersForSelect(): Promise<any[]> {
=======
export async function getMembersForSelect() {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.member.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

<<<<<<< HEAD
export async function getLocation(id: string): Promise<any> {
=======
export async function getLocation(id: string) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) return null;

  return db.inventoryLocation.findUnique({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      parentLocation: true,
      childLocations: true,
      zones: {
        include: {
          _count: {
            select: {
              storageUnits: true,
            },
          },
        },
      },
      storageUnits: {
        where: {
          zoneId: null,
        },
      },
      manager: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function createLocation(data: {
  name: string;
  code?: string;
  description?: string;
  locationType: LocationType;
  isDefault?: boolean;
  parentLocationId?: string;
  managerId?: string;
  address?: any;
  contact?: any;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const location = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.inventoryLocation.updateMany({
        where: { organizationId: context.organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.inventoryLocation.create({
      data: {
        ...data,
        organizationId: context.organizationId,
      },
    });
  });

  revalidatePath("/locations");
  return location;
}

export async function updateLocation(id: string, data: {
  name?: string;
  code?: string;
  description?: string;
  locationType?: LocationType;
  isActive?: boolean;
  isDefault?: boolean;
  parentLocationId?: string;
  managerId?: string;
  address?: any;
  contact?: any;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const location = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.inventoryLocation.updateMany({
        where: {
          organizationId: context.organizationId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false },
      });
    }

    return tx.inventoryLocation.update({
      where: { id, organizationId: context.organizationId },
      data,
    });
  });

  revalidatePath("/locations");
  revalidatePath(`/locations/${id}`);
  return location;
}

export async function deleteLocation(id: string) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // Check for dependencies
  const dependencies = await db.inventoryLocation.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      _count: {
        select: {
          childLocations: true,
          variantStocks: true,
        },
      },
    },
  });

  if (dependencies?._count.childLocations && dependencies._count.childLocations > 0) {
    throw new Error("Cannot delete location with sub-locations.");
  }

  if (dependencies?._count.variantStocks && dependencies._count.variantStocks > 0) {
    throw new Error("Cannot delete location with existing stock.");
  }

<<<<<<< HEAD
  const locationCount = await db.inventoryLocation.count({
    where: { organizationId: context.organizationId },
  });

  if (locationCount <= 1) {
    throw new Error("Cannot delete the last location in the system. At least one location is required.");
  }

=======
>>>>>>> main
  await db.inventoryLocation.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/locations");
}

// Zone Actions
export async function createZone(data: {
  name: string;
  description?: string;
  locationId: string;
  capacity?: number;
  capacityUnit?: UnitType;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const zone = await db.storageZone.create({
    data: {
      ...data,
      organizationId: context.organizationId,
    },
  });

  revalidatePath(`/locations/${data.locationId}`);
  return zone;
}

export async function updateZone(id: string, data: {
  name?: string;
  description?: string;
  capacity?: number;
  capacityUnit?: UnitType;
  isActive?: boolean;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const zone = await db.storageZone.update({
    where: { id, organizationId: context.organizationId },
    data,
  });

  revalidatePath(`/locations/${zone.locationId}`);
  return zone;
}

export async function deleteZone(id: string) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const zone = await db.storageZone.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      _count: {
        select: { storageUnits: true }
      }
    }
  });

  if (!zone) throw new Error("Zone not found");
  if (zone._count.storageUnits > 0) throw new Error("Cannot delete zone with storage units");

  await db.storageZone.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath(`/locations/${zone.locationId}`);
}

// Unit Actions
export async function createUnit(data: {
  name: string;
  reference?: string;
  unitType: StorageUnitType;
  locationId: string;
  zoneId?: string;
  capacity?: number;
  capacityUnit?: UnitType;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const unit = await db.storageUnit.create({
    data: {
      ...data,
      organizationId: context.organizationId,
    },
  });

  revalidatePath(`/locations/${data.locationId}`);
  return unit;
}

export async function updateUnit(id: string, data: {
  name?: string;
  reference?: string;
  unitType?: StorageUnitType;
  zoneId?: string;
  isActive?: boolean;
<<<<<<< HEAD
}): Promise<any> {
=======
}) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const unit = await db.storageUnit.update({
    where: { id, organizationId: context.organizationId },
    data,
  });

  revalidatePath(`/locations/${unit.locationId}`);
  return unit;
}

export async function deleteUnit(id: string) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const unit = await db.storageUnit.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      _count: {
        select: { stockBatches: true }
      }
    }
  });

  if (!unit) throw new Error("Unit not found");
  if (unit._count.stockBatches > 0) throw new Error("Cannot delete unit with stock batches");

  await db.storageUnit.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath(`/locations/${unit.locationId}`);
}

<<<<<<< HEAD
export async function getZoneWithUnits(zoneId: string): Promise<any> {
=======
export async function getZoneWithUnits(zoneId: string) {
>>>>>>> main
  const context = await getOrganizationContext();
  if (!context?.organizationId) return null;

  return db.storageZone.findUnique({
    where: { id: zoneId, organizationId: context.organizationId },
    include: {
      storageUnits: true,
    },
  });
}
