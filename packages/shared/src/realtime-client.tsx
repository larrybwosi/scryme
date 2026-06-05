'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Realtime } from 'ably';
import axios from 'axios';

interface RealtimeContextType {
  socket: Socket | null;
  ably: Realtime | null;
  isConnected: boolean;
  provider: 'ably' | 'socketio';
  subscribe: (channel: string, event: string, callback: (data: any) => void) => () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  ably: null,
  isConnected: false,
  provider: 'ably',
  subscribe: () => () => {},
  publish: async () => {},
});

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ably, setAbly] = useState<Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<'ably' | 'socketio'>('ably');

  useEffect(() => {
    const providerType = (process.env.NEXT_PUBLIC_REALTIME_PROVIDER as any) || 'ably';
    setProvider(providerType);

    if (providerType === 'socketio') {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      const socketInstance = io(socketUrl, {
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Socket.io connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket.io disconnected');
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } else {
      const ablyInstance = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
            const response = await axios.post(`${baseUrl}/api/auth/ably`, {}, { withCredentials: true });
            callback(null, response.data);
          } catch (err: any) {
            callback(err, null);
          }
        },
      });

      ablyInstance.connection.on('connected', () => {
        setIsConnected(true);
        console.log('Ably connected');
      });

      ablyInstance.connection.on('disconnected', () => {
        setIsConnected(false);
      });

      setAbly(ablyInstance);

      return () => {
        ablyInstance.close();
      };
    }
  }, []);

  const subscribe = useCallback((channelName: string, event: string, callback: (data: any) => void) => {
    if (provider === 'socketio' && socket) {
      socket.emit('join', { channel: channelName });
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    } else if (provider === 'ably' && ably) {
      const channel = ably.channels.get(channelName);
      channel.subscribe(event, (message) => callback(message.data));
      return () => {
        channel.unsubscribe(event);
      };
    }
    return () => {};
  }, [provider, socket, ably]);

  const publish = useCallback(async (channelName: string, event: string, data: any) => {
    if (provider === 'socketio' && socket) {
      socket.emit('publish', { channel: channelName, event, data });
    } else if (provider === 'ably' && ably) {
      await ably.channels.get(channelName).publish(event, data);
    }
  }, [provider, socket, ably]);

  return (
    <RealtimeContext.Provider value={{ socket, ably, isConnected, provider, subscribe, publish }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
