"use client";

import React from "react";
import { OpenPanelComponent } from "@openpanel/nextjs";

export function OpenPanelProvider() {
  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  return (
    <OpenPanelComponent
      clientId={clientId}
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={true}
      apiUrl={process.env.NEXT_PUBLIC_OPENPANEL_HOST}
    />
  );
}
