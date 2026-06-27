"use server";

import { db } from "@repo/db";

export async function getOrganizationMembers(
  organizationId: string,
): Promise<any[]> {
  try {
    const members = await db.member.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });
    return members;
  } catch (error) {
    console.error("Error fetching organization members:", error);
    throw new Error("Failed to fetch organization members");
  }
}
