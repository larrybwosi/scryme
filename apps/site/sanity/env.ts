export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-07-15";

export const dataset =
  process.env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  "production";

export const projectId =
  process.env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  "ce88cj7n";
