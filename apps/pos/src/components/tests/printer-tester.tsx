import { PrintMethod, useSilentPrinter } from '@/hooks/use-silent-printer';
import React, { useState } from 'react';

const PrintTester: React.FC = () => {
  const { printReceipt, loading, error, successMsg } = useSilentPrinter();

  // Form State
  const [method, setMethod] = useState<PrintMethod>('network');
  const [ip, setIp] = useState('192.168.1.200');
  const [printerName, setPrinterName] = useState('Thermal_Printer_01');
  const [vid, setVid] = useState('0x04b8');
  const [pid, setPid] = useState('0x0e15');

  const dummyItems = [
    { name: 'Burger', price: '$12.00' },
    { name: 'Fries', price: '$4.50' },
    { name: 'Soda', price: '$2.50' },
  ];

  const handlePrint = () => {
    printReceipt(method, { ip, printerName, vid, pid }, dummyItems);
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Silent Receipt Printer</h2>

      {/* Method Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Printing Method</label>
        <select
          value={method}
          onChange={e => setMethod(e.target.value as PrintMethod)}
          className="w-full p-2 border rounded mt-1"
        >
          <option value="network">Network (WiFi/Ethernet)</option>
          <option value="system">OS Driver (USB/Shared)</option>
          <option value="usb">Direct USB (Raw)</option>
        </select>
      </div>

      {/* Dynamic Inputs */}
      {method === 'network' && (
        <div className="mb-4">
          <label className="block text-sm">Printer IP Address</label>
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="192.168.x.x"
          />
        </div>
      )}

      {method === 'system' && (
        <div className="mb-4">
          <label className="block text-sm">OS Printer Name</label>
          <input
            type="text"
            value={printerName}
            onChange={e => setPrinterName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Name in Settings"
          />
        </div>
      )}

      {method === 'usb' && (
        <div className="flex gap-2 mb-4">
          <div>
            <label className="block text-sm">VID (Hex)</label>
            <input
              type="text"
              value={vid}
              onChange={e => setVid(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">PID (Hex)</label>
            <input
              type="text"
              value={pid}
              onChange={e => setPid(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handlePrint}
        disabled={loading}
        className={`w-full p-2 text-white font-bold rounded ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Printing...' : 'Print Receipt'}
      </button>

      {/* Status Feedback */}
      {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">Error: {error}</div>}
      {successMsg && <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}
    </div>
  );
};

export default PrintTester;
