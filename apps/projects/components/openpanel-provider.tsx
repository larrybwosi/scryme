"use client";

import React from "react";
import { normalizeOpenPanelUrl } from "@repo/env";
import { OpenPanelComponent } from "@openpanel/nextjs";

export function OpenPanelProvider() {
  const clientId =
    process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ||
    process.env.OPENPANEL_CLIENT_ID;
  const host =
    process.env.NEXT_PUBLIC_OPENPANEL_HOST ||
    process.env.OPENPANEL_HOST ||
    "https://api.openpanel.dev";

  if (
    !clientId ||
    clientId.includes("PLACEHOLDER") ||
    clientId === "your-openpanel-client-id" ||
    clientId === ""
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
