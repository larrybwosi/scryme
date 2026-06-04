"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getSuppliers(options?: { featured?: boolean; favorite?: boolean }): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const orgId = auth.organizationId;
  const userId = auth.user.id;

  // Find the member record for this user and organization
  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: userId,
      },
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const where: any = {
    organizationId: orgId,
    isActive: true,
  };

  if (options?.featured) {
    where.riskLevel = "low";
  }

  const suppliers = await db.supplier.findMany({
    where,
    include: {
      favorites: {
        where: {
          memberId: member.id,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          products: true,
          purchases: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const processedSuppliers = suppliers.map((s) => ({
    ...s,
    isFavorite: s.favorites.length > 0,
  }));

  if (options?.favorite) {
    return processedSuppliers.filter((s) => s.isFavorite);
  }

  return processedSuppliers;
}

export async function getSupplierById(id: string): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const orgId = auth.organizationId;
  const userId = auth.user.id;

  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: userId,
      },
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const supplier = await db.supplier.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    include: {
      favorites: {
        where: {
          memberId: member.id,
        },
      },
      products: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
          variant: true,
        },
      },
      purchases: {
        orderBy: { orderDate: "desc" },
        take: 10,
      },
      reviews: {
        include: {
          member: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!supplier) {
    return null;
  }

  return {
    ...supplier,
    isFavorite: supplier.favorites.length > 0,
  };
}

export async function toggleFavoriteSupplier(supplierId: string) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const orgId = auth.organizationId;
  const userId = auth.user.id;

  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: userId,
      },
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const existing = await db.favoriteSupplier.findUnique({
    where: {
      memberId_supplierId: {
        memberId: member.id,
        supplierId,
      },
    },
  });

  if (existing) {
    await db.favoriteSupplier.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await db.favoriteSupplier.create({
      data: {
        organizationId: orgId,
        memberId: member.id,
        supplierId,
      },
    });
  }

  revalidatePath("/inventory/supplier");
  revalidatePath(`/inventory/supplier/${supplierId}`);
}

export async function addSupplierReview(supplierId: string, rating: number, comment: string) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const orgId = auth.organizationId;
  const userId = auth.user.id;

  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: userId,
      },
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  await db.supplierReview.create({
    data: {
      organizationId: orgId,
      memberId: member.id,
      supplierId,
      rating,
      comment,
    },
  });

  revalidatePath(`/inventory/supplier/${supplierId}`);
}
