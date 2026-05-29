import React, { useState, useEffect } from 'react';
import { usePrinter } from '@/hooks/use-printer';
import { PrinterJobType } from '@/store/printer-store';
import { Printer, Settings, RefreshCcw, Receipt, Utensils, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function PrinterSettings() {
  const { availablePrinters, assignments, assignPrinter, refreshPrinters, printDocument, loading, error } =
    usePrinter();

  // console.log("availablePrinters", availablePrinters);
  // console.log("assignments", assignments);

  const [testMessage, setTestMessage] = useState('Hello World\nThis is a raw print test.\n----------------\nEND');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Auto-refresh on mount
  useEffect(() => {
    refreshPrinters();
  }, [refreshPrinters]);

  const handleAssign = (type: PrinterJobType, e: React.ChangeEvent<HTMLSelectElement>) => {
    const printerId = e.target.value;
    if (printerId === 'none') return;
    assignPrinter(type, printerId);
  };

  const handleTestPrint = async (type: PrinterJobType, content: string) => {
    setStatusMsg(null);
    try {
      await printDocument(type, content, false); // false = raw text mode
      setStatusMsg(`✅ Successfully sent to ${type} printer`);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message || err}`);
    }
  };

  // Sample Ticket Data
  const sampleReceipt = `
   MY AWESOME STORE
   123 Main Street
   ----------------------
   Order: #1001
   Date: ${new Date().toLocaleTimeString()}
   
   1x Burger        $10.00
   1x Fries          $5.00
   1x Soda           $2.00
   ----------------------
   TOTAL:           $17.00
   ----------------------
   Thank you!
  `;

  const sampleKitchen = `
   KITCHEN TICKET
   Order: #1001
   ----------------------
   [ ] 1x Burger
       - No Onions
       - Extra Cheese
   [ ] 1x Fries
   ----------------------
  `;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" /> Printer Configuration
          </h1>
          <p className="text-gray-500">Manage device assignments and test connections</p>
        </div>
        <button
          onClick={refreshPrinters}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Refresh Devices'}
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* SUCCESS/STATUS BANNER */}
      {statusMsg && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 border ${statusMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
        >
          {statusMsg.startsWith('✅') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: ASSIGNMENTS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" /> Device Assignments
          </h2>

          <div className="space-y-4">
            {/* Receipt Printer Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Receipt Printer
              </label>
              <select
                value={assignments.receipt || 'none'}
                onChange={e => handleAssign('receipt', e)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="none">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.driver_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Kitchen Printer Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Utensils className="w-4 h-4" /> Kitchen Printer
              </label>
              <select
                value={assignments.kitchen || 'none'}
                onChange={e => handleAssign('kitchen', e)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="none">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.driver_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Printer Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Invoice Printer
              </label>
              <select
                value={assignments.invoice || 'none'}
                onChange={e => handleAssign('invoice', e)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="none">-- Select Printer --</option>
                {availablePrinters.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.driver_name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: DIAGNOSTICS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" /> Diagnostics
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTestPrint('receipt', sampleReceipt)}
                disabled={!assignments.receipt}
                className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Test Receipt Print
              </button>

              <button
                onClick={() => handleTestPrint('kitchen', sampleKitchen)}
                disabled={!assignments.kitchen}
                className="p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Test Kitchen Print
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Raw Text Test</label>
              <textarea
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="w-full h-24 p-2 text-xs font-mono border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                onClick={() => handleTestPrint('receipt', testMessage)}
                disabled={!assignments.receipt}
                className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
              >
                Send Raw to Receipt Printer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
