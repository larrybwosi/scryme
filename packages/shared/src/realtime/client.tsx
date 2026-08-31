"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";

import { PresenceMember } from "./types";
import { applyDelta } from "./delta";

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  provider: "socketio";
  subscribe: (
    channel: string,
    event: string,
    callback: (data: any) => void,
    options?: { rewind?: number },
  ) => () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  presence: {
    enter: (channel: string, metadata?: any) => Promise<void>;
    leave: (channel: string) => Promise<void>;
    members: Record<string, PresenceMember[]>;
  };
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  isConnected: false,
  provider: "socketio",
  subscribe: () => () => {},
  publish: async () => {},
  presence: {
    enter: async () => {},
    leave: async () => {},
    members: {},
  },
});

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const provider = "socketio" as const;
  const [presenceMembers, setPresenceMembers] = useState<
    Record<string, PresenceMember[]>
  >({});

  useEffect(() => {
    // Default to same origin if no URL provided
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3001");

    const sessionToken = getCookie("better-auth.session_token") || getCookie("dealio_member_token");

    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      auth: {
        token: sessionToken,
      },
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket.io connected");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket.io disconnected");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribe = useCallback(
    (
      channelName: string,
      event: string,
      callback: (data: any) => void,
      options?: { rewind?: number },
    ) => {
      if (socket) {
        socket.emit("join", { channel: channelName, options });

        const presenceHandler = (data: {
          channel: string;
          members: PresenceMember[];
        }) => {
          if (data.channel === channelName) {
            setPresenceMembers((prev) => ({
              ...prev,
              [channelName]: data.members,
            }));
          }
        };

        let lastData: any = null;
        const wrappedCallback = (data: any) => {
          lastData = data;
          callback(data);
        };

        const deltaEvent = `${event}:delta`;
        const deltaHandler = (delta: any) => {
          if (lastData) {
            const newData = applyDelta(lastData, delta);
            lastData = newData;
            callback(newData);
          }
        };

        socket.on("presence:update", presenceHandler);
        socket.on(event, wrappedCallback);
        socket.on(deltaEvent, deltaHandler);

        return () => {
          socket.off(event, wrappedCallback);
          socket.off(deltaEvent, deltaHandler);
          socket.off("presence:update", presenceHandler);
        };
      }
      return () => {};
    },
    [socket],
  );

  const publish = useCallback(
    async (channelName: string, event: string, data: any) => {
      if (socket) {
        socket.emit("publish", { channel: channelName, event, data });
      }
    },
    [socket],
  );

  const enterPresence = useCallback(
    async (channelName: string, metadata?: any) => {
      if (socket) {
        socket.emit("presence:enter", { channel: channelName, metadata });
      }
    },
    [socket],
  );

  const leavePresence = useCallback(
    async (channelName: string) => {
      if (socket) {
        socket.emit("presence:leave", { channel: channelName });
      }
    },
    [socket],
  );

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        isConnected,
        provider,
        subscribe,
        publish,
        presence: {
          enter: enterPresence,
          leave: leavePresence,
          members: presenceMembers,
        },
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
