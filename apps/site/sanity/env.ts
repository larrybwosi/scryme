export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-07-15";

function getSanitizedProjectId(rawProjectId?: string): string {
  if (
    !rawProjectId ||
    rawProjectId.includes("PLACEHOLDER") ||
    !/^[a-z0-9-]+$/.test(rawProjectId)
  ) {
    return "l0v9sncz";
  }
  return rawProjectId;
}

function getSanitizedDataset(rawDataset?: string): string {
  if (
    !rawDataset ||
    rawDataset.includes("PLACEHOLDER") ||
    !/^[a-z0-9~_.-]+$/.test(rawDataset)
  ) {
    return "production";
  }
  return rawDataset;
}

const rawProjectId =
  process.env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID;

const rawDataset =
  process.env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET;

export const dataset = getSanitizedDataset(rawDataset);
export const projectId = getSanitizedProjectId(rawProjectId);
