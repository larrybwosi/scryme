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
import axios from "axios";

import { PresenceMember } from "./types";
import { applyDelta } from "./delta";
import { getAblyRealtime, Realtime } from "../ably/client";

interface RealtimeContextType {
  socket: Socket | null;
  ably: Realtime | null;
  isConnected: boolean;
  provider: "ably" | "socketio";
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
  ably: null,
  isConnected: false,
  provider: "ably",
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
  const [ably, setAbly] = useState<Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<"ably" | "socketio">("ably");
  const [presenceMembers, setPresenceMembers] = useState<
    Record<string, PresenceMember[]>
  >({});

  useEffect(() => {
    const providerType =
      (process.env.NEXT_PUBLIC_REALTIME_PROVIDER as any) || "ably";
    setProvider(providerType);

    if (providerType === "socketio") {
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
    } else {
      // Use the imported Ably client
      const ablyInstance = getAblyRealtime();

      if (ablyInstance) {
        // Set up connection event listeners
        const handleConnect = () => {
          setIsConnected(true);
          console.log("Ably connected");
        };

        const handleDisconnect = () => {
          setIsConnected(false);
        };

        ablyInstance.connection.on("connected", handleConnect);
        ablyInstance.connection.on("disconnected", handleDisconnect);

        setAbly(ablyInstance);

        return () => {
          ablyInstance.connection.off("connected", handleConnect);
          ablyInstance.connection.off("disconnected", handleDisconnect);
          // Don't close the instance here since it's a singleton
        };
      }
    }
  }, []);

  const subscribe = useCallback(
    (
      channelName: string,
      event: string,
      callback: (data: any) => void,
      options?: { rewind?: number },
    ) => {
      if (provider === "socketio" && socket) {
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
      } else if (provider === "ably" && ably) {
        const channel = ably.channels.get(channelName);
        const ablyOptions: any = {};
        if (options?.rewind) {
          // Ably uses [?rewind=N]channelName syntax for rewind
          const rewindChannel = ably.channels.get(
            `[?rewind=${options.rewind}]${channelName}`,
          );
          rewindChannel.subscribe(event, (message) => callback(message.data));
          return () => rewindChannel.unsubscribe(event);
        }

        channel.subscribe(event, (message) => callback(message.data));
        return () => {
          channel.unsubscribe(event);
        };
      }
      return () => {};
    },
    [provider, socket, ably],
  );

  const publish = useCallback(
    async (channelName: string, event: string, data: any) => {
      if (provider === "socketio" && socket) {
        socket.emit("publish", { channel: channelName, event, data });
      } else if (provider === "ably" && ably) {
        await ably.channels.get(channelName).publish(event, data);
      }
    },
    [provider, socket, ably],
  );

  const enterPresence = useCallback(
    async (channelName: string, metadata?: any) => {
      if (provider === "socketio" && socket) {
        socket.emit("presence:enter", { channel: channelName, metadata });
      } else if (provider === "ably" && ably) {
        const channel = ably.channels.get(channelName);
        await channel.presence.enter(metadata);
      }
    },
    [provider, socket, ably],
  );

  const leavePresence = useCallback(
    async (channelName: string) => {
      if (provider === "socketio" && socket) {
        socket.emit("presence:leave", { channel: channelName });
      } else if (provider === "ably" && ably) {
        const channel = ably.channels.get(channelName);
        await channel.presence.leave();
      }
    },
    [provider, socket, ably],
  );

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        ably,
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
