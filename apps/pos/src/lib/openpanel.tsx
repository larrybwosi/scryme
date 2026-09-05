import React, { useEffect } from "react";
import { OpenPanel } from "@openpanel/web";

let openPanelInstance: OpenPanel | null = null;

export function getOpenPanelInstance(): OpenPanel | null {
  if (typeof window === "undefined") return null;

  const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID;
  if (
    !clientId ||
    clientId.includes("PLACEHOLDER") ||
    clientId === "your-openpanel-client-id"
  ) {
    return null;
  }

  const host = import.meta.env.VITE_OPENPANEL_HOST;
  const apiUrl =
    host && !host.includes("PLACEHOLDER")
      ? host
      : undefined;

  if (!openPanelInstance) {
    try {
      openPanelInstance = new OpenPanel({
        clientId,
        apiUrl,
        trackScreenViews: true,
        trackAttributes: true,
        trackOutgoingLinks: true,
      });
    } catch {
      return null;
    }
  }

  return openPanelInstance;
}

export function OpenPanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getOpenPanelInstance();
  }, []);

  return <>{children}</>;
}

export function trackPosEvent(event: string, properties?: Record<string, unknown>) {
  const op = getOpenPanelInstance();
  if (op) {
    try {
      op.track(event, properties);
    } catch {
      // Ignore tracking errors in POS UI
    }
  }
}

export function identifyPosUser(profile: { profileId: string; [key: string]: unknown }) {
  const op = getOpenPanelInstance();
  if (op) {
    try {
      op.identify(profile);
    } catch {
      // Ignore identify errors in POS UI
    }
  }
}
