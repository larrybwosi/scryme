"use client";

import { Wifi, WifiOff, CheckCircle2, Clock } from "lucide-react";

const syncQueue = [
  { id: "TXN-8821", amount: "$148.50", status: "synced", time: "09:14 AM" },
  { id: "TXN-8822", amount: "$34.99", status: "synced", time: "09:19 AM" },
  { id: "TXN-8823", amount: "$212.00", status: "pending", time: "09:31 AM" },
  { id: "TXN-8824", amount: "$67.40", status: "pending", time: "09:35 AM" },
];

export function PosOfflineMock() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
      {/* status bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-amber-500/10">
        <WifiOff className="w-4 h-4 text-amber-500" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-500">Offline mode active</p>
          <p className="text-[10px] text-muted">Transactions queued for sync when connectivity restores</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
          2 pending
        </span>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
          Sync queue
        </p>
        <div className="space-y-2">
          {syncQueue.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
            >
              {txn.status === "synced" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{txn.id}</p>
                <p className="text-[10px] text-muted">{txn.time}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">{txn.amount}</p>
                <p
                  className={`text-[10px] font-medium ${
                    txn.status === "synced" ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {txn.status === "synced" ? "Synced" : "Queued"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-2 border border-border px-4 py-3">
          <Wifi className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted">
            <span className="font-semibold text-foreground">Auto-sync enabled.</span> All
            pending transactions will upload instantly when online.
          </p>
        </div>
      </div>
    </div>
  );
}
