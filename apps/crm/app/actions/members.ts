"use server";

import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { redirect } from "next/navigation";

export async function getOrganizationMembers(): Promise<any[]> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;
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
