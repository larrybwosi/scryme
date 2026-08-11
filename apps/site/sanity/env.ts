import { env } from "@repo/env";

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-07-15";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  env.NEXT_PUBLIC_SITE_SANITY_DATASET;

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID;
