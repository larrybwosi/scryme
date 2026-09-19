"use client";

import { normalizeOpenPanelUrl } from "@repo/env";

import React from "react";
import { OpenPanelComponent } from "@openpanel/nextjs";

export function OpenPanelProvider() {
  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
  const host = process.env.NEXT_PUBLIC_OPENPANEL_HOST;

  if (
    !clientId ||
    clientId.includes("PLACEHOLDER") ||
    clientId === "your-openpanel-client-id"
  ) {
    return null;
  }

  const apiUrl = normalizeOpenPanelUrl(host);

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
