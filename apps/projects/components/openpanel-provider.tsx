"use client";

import React from "react";
import { env, normalizeOpenPanelUrl } from "@repo/env";
import { OpenPanelComponent } from "@openpanel/nextjs";

export function OpenPanelProvider() {
  const clientId =
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID || process.env.OPENPANEL_CLIENT_ID
      : undefined) || env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;

  const host =
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_OPENPANEL_HOST || process.env.OPENPANEL_HOST
      : undefined) ||
    env.NEXT_PUBLIC_OPENPANEL_HOST ||
    "https://api.openpanel.dev";

  if (
    !clientId ||
    typeof clientId !== "string" ||
    clientId.includes("PLACEHOLDER") ||
    clientId === "your-openpanel-client-id" ||
    clientId.trim() === ""
  ) {
    return null;
  }

  const apiUrl = normalizeOpenPanelUrl(host);
  if (!apiUrl) {
    return null;
  }

  return (
    <OpenPanelComponent
      clientId={clientId}
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={true}
      apiUrl={apiUrl}
    />
  );
}
