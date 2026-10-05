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
          "github_app_id",
          "github_client_id",
          "github_client_secret",
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
    appId: settingsMap["github_app_id"] || "",
    clientId: settingsMap["github_client_id"] || "",
    clientSecret: settingsMap["github_client_secret"] || "",
    webhookSecret: settingsMap["github_webhook_secret"] || "",
    owner: settingsMap["github_owner"] || "dealio-org",
    repo: settingsMap["github_repo"] || "scryme",
    token: settingsMap["github_token"] || "",
  };
}

export async function updatePosReleaseSettings(data: {
  appId?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  owner?: string;
  repo?: string;
  token?: string;
}) {
  await requireSuperAdmin();

  const entries = [
    { key: "github_app_id", value: data.appId || "" },
    { key: "github_client_id", value: data.clientId || "" },
    { key: "github_client_secret", value: data.clientSecret || "" },
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

export async function testGithubAppConnection() {
  await requireSuperAdmin();

  const settings = await getPosReleaseSettings();
  const owner = settings.owner || "dealio-org";
  const repo = settings.repo || "scryme";
  const token = settings.token;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Scryme-Admin-App",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `GitHub API responded with status ${response.status}`,
      };
    }

    const repoData = await response.json();
    return {
      success: true,
      message: `Successfully connected to repository ${repoData.full_name} (${repoData.private ? "Private" : "Public"})`,
      repo: {
        fullName: repoData.full_name,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to reach GitHub API",
    };
  }
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

  const isDev = process.env.NODE_ENV === "development";
  const defaultApiUrl = isDev ? "http://localhost:3000" : "https://api.scryme.tech";
  const rawApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiUrl =
    rawApiUrl &&
    typeof rawApiUrl === "string" &&
    !rawApiUrl.includes("PLACEHOLDER") &&
    (rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://"))
      ? rawApiUrl
      : defaultApiUrl;

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
