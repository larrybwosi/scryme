import React, { useEffect } from "react";
import { OpenPanel } from "@openpanel/web";

let openPanelInstance: OpenPanel | null = null;

export function getOpenPanelInstance(): OpenPanel | null {
  if (typeof window === "undefined") return null;

  const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID;
  if (!clientId) return null;

  if (!openPanelInstance) {
    openPanelInstance = new OpenPanel({
      clientId,
      apiUrl: import.meta.env.VITE_OPENPANEL_HOST || undefined,
      trackScreenViews: true,
      trackAttributes: true,
      trackOutgoingLinks: true,
    });
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
    op.track(event, properties);
  }
}

export function identifyPosUser(profile: { profileId: string; [key: string]: unknown }) {
  const op = getOpenPanelInstance();
  if (op) {
    op.identify(profile);
  }
}
