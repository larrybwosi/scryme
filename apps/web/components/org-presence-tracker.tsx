"use client";

import { useEffect } from "react";
import { useRealtime } from "@repo/shared/realtime/client";
import { useOrganizationStore } from "../lib/stores/organization-store";

export function OrgPresenceTracker() {
  const { socket, isConnected, presence } = useRealtime();
  const organization = useOrganizationStore((state) => state.organization);

  useEffect(() => {
    if (!isConnected || !socket || !organization?.id) return;

    const channel = `presence:org:${organization.id}`;

    presence.enter(channel, {
      app: "web",
      orgId: organization.id,
      timestamp: Date.now(),
    });

    return () => {
      presence.leave(channel);
    };
  }, [isConnected, socket, organization?.id, presence]);

  return null;
}
