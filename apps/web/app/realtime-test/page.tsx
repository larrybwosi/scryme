'use client'
import { useState, useEffect } from 'react';
import { useRealtime } from '@repo/shared';

export default function RealtimeTestPage() {
  const { isConnected, provider, subscribe, publish, presenceEnter } = useRealtime();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe('test-channel', 'test-event', (data) => {
      setMessages((prev) => [...prev, `Received: ${JSON.stringify(data)}`]);
    });

    presenceEnter('test-channel', { user: 'Test User', time: new Date().toISOString() });

    return () => unsub();
  }, [isConnected, subscribe, presenceEnter]);

  const handleSend = async () => {
    await publish('test-channel', 'test-event', { text: input, from: 'Web Test' });
    setInput('');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Realtime Verification</h1>
      <div className="mb-4">
        <p>Status: <span className={isConnected ? "text-green-500" : "text-red-500"}>{isConnected ? 'Connected' : 'Disconnected'}</span></p>
        <p>Provider: <span className="font-mono">{provider}</span></p>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded text-black"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send Event
        </button>
      </div>

      <div className="border rounded p-4 h-64 overflow-y-auto bg-gray-50 text-black">
        <h2 className="font-bold mb-2">Message Log:</h2>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm border-b py-1">{msg}</div>
        ))}
      </div>
    </div>
  );
}
