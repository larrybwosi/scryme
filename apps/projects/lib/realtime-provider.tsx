"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext, QUERY_KEYS } from "./hooks/use-projects";
import { authClient } from "./auth-client";

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  isConnected: false,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: workspace } = useWorkspaceContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    let currentSocket: Socket | null = null;

    async function initSocket() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || apiUrl;

      let token = "socket-io-realtime";
      try {
        const session = await authClient.getSession();
        if (session?.data?.session?.token) {
          token = session.data.session.token;
        }
      } catch {
        // Fallback
      }

      currentSocket = io(wsUrl.replace(/\/v3$/, "") + "/v3", {
        transports: ["websocket", "polling"],
        auth: { token },
        withCredentials: true,
      });

      currentSocket.on("connect", () => {
        setIsConnected(true);
        if (workspace?.organizationId) {
          currentSocket?.emit("join", { channel: `tasks:${workspace.organizationId}` });
          currentSocket?.emit("join", { channel: `projects:${workspace.organizationId}` });
          currentSocket?.emit("join", { channel: `organization:${workspace.organizationId}:tasks` });
        }
      });

      currentSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      currentSocket.on("task:created", () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      });

      currentSocket.on("task:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      });

      currentSocket.on("task:deleted", () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      });

      currentSocket.on("project:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      });

      setSocket(currentSocket);
    }

    initSocket();

    return () => {
      if (currentSocket) {
        currentSocket.disconnect();
      }
    };
  }, [workspace?.organizationId, queryClient]);

  return (
    <RealtimeContext.Provider value={{ socket, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
