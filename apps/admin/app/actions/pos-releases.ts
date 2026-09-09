"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export async function getPosReleaseSettings() {
  await requireSuperAdmin();

  const settings = await db.globalSetting.findMany({
    where: {
      key: {
        in: [
          "github_webhook_secret",
          "github_owner",
          "github_repo",
          "github_token",
        ],
      },
    },
  });

  const settingsMap = settings.reduce(
    (acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    webhookSecret: settingsMap["github_webhook_secret"] || "",
    owner: settingsMap["github_owner"] || "dealio-org",
    repo: settingsMap["github_repo"] || "scryme",
    token: settingsMap["github_token"] || "",
  };
}

export async function updatePosReleaseSettings(data: {
  webhookSecret?: string;
  owner?: string;
  repo?: string;
  token?: string;
}) {
  await requireSuperAdmin();

  const entries = [
    { key: "github_webhook_secret", value: data.webhookSecret || "" },
    { key: "github_owner", value: data.owner || "" },
    { key: "github_repo", value: data.repo || "" },
    { key: "github_token", value: data.token || "" },
  ];

  for (const entry of entries) {
    if (entry.value !== undefined) {
      await db.globalSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }
  }

  revalidatePath("/systems");
  revalidatePath("/settings");
  return { success: true };
}

export async function listPosReleaseBinaries() {
  await requireSuperAdmin();

  const binaries = await db.posReleaseBinary.findMany({
    orderBy: [{ platform: "asc" }, { variant: "asc" }, { createdAt: "desc" }],
  });

  return binaries.map((b) => ({
    ...b,
    sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function deletePosReleaseBinary(id: string) {
  await requireSuperAdmin();

  await db.posReleaseBinary.delete({
    where: { id },
  });

  revalidatePath("/systems");
  return { success: true };
}

export async function triggerGithubReleaseSync(tagOrVersion?: string) {
  await requireSuperAdmin();

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const url = `${apiUrl}/public/sync-release${tagOrVersion ? `?tag=${tagOrVersion}` : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to trigger GitHub release sync",
    );
  }

  revalidatePath("/systems");
  return response.json();
}
