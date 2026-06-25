"use client";
import { Realtime } from "ably";
import axios from "axios";
import { useEffect, useState } from "react";

// Create a custom hook to access the Ably client
export const useAblyRealtime = () => {
  const [ablyRealtime, setAblyRealtime] = useState<Realtime | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only create the Ably instance on the client side
    if (typeof window === "undefined") {
      return;
    }

    try {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const tokenRequest = await axios.post(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/ably`,
              {},
              { withCredentials: true },
            );
            callback(null, tokenRequest.data);
          } catch (err: any) {
            console.error("Error fetching Ably token:", err);
            callback(err, null);
          }
        },
        recover: (_, cb) => {
          cb(true);
        },
        logLevel: 1,
      });

      setAblyRealtime(realtime);

      // Cleanup function
      return () => {
        if (realtime) {
          realtime.close();
        }
      };
    } catch (err) {
      console.error("Error creating Ably realtime instance:", err);
      setError(err as Error);
    }
  }, []);

  return { ablyRealtime, error };
};

// Alternative: Direct instance with client-side check
let ablyRealtimeInstance: Realtime | null = null;

export const getAblyRealtime = (): Realtime | null => {
  // Return null during server-side rendering
  if (typeof window === "undefined") {
    return null;
  }

  // Create instance only once on the client
  if (!ablyRealtimeInstance) {
    try {
      ablyRealtimeInstance = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const tokenRequest = await axios.post(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/ably`,
              {},
              { withCredentials: true },
            );
            callback(null, tokenRequest.data);
          } catch (err: any) {
            console.error("Error fetching Ably token:", err);
            callback(err, null);
          }
        },
        recover: (_, cb) => {
          cb(true);
        },
        logLevel: 1,
      });
    } catch (err) {
      console.error("Error creating Ably realtime instance:", err);
    }
  }

  return ablyRealtimeInstance;
};

// For backward compatibility - returns null on server
export const ablyRealtime =
  typeof window !== "undefined" ? getAblyRealtime() : null;
export type { Realtime };
