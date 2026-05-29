"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  ChefHat,
  CheckCircle2,
  Clock,
  Keyboard,
  Search,
  Flame,
  Snowflake,
  GlassWater,
  Cake,
  Beef,
  Layers,
  X,
  AlertTriangle,
  Undo2,
  Play,
  CheckCheck,
  Trash2,
  Info,
  Plus,
  ShieldAlert,
  RefreshCcw,
  Printer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types and Store ────────────────────────────────────────────────────────
import { useKdsStore, KdsOrder as Order, OrderStatus, OrderType, ItemStatus, Station } from '@/store/kds-store';
import { usePosStore } from '@/store/store';
import { updateOrderStatusInKitchen, sendOrderEtaResponse } from '@/lib/kds';

type SortKey = "time_asc" | "time_desc" | "priority" | "table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function timerLevel(ms: number): "ok" | "warn" | "late" {
  const m = ms / 60_000;
  if (m < 8) return "ok";
  if (m < 15) return "warn";
  return "late";
}

// ─── Station Config ────────────────────────────────────────────────────────────

const STATION_CONFIG: Record<
  Station,
  { label: string; color: string; icon: React.ReactNode; desc: string }
> = {
  all: {
    label: "All Stations",
    color: "#e8a020",
    icon: <Layers className="w-3.5 h-3.5" />,
    desc: "View every active order",
  },
  hot: {
    label: "Hot Line",
    color: "#ff6b35",
    icon: <Flame className="w-3.5 h-3.5" />,
    desc: "Pasta, pizza, fried items",
  },
  cold: {
    label: "Cold Station",
    color: "#3b9eff",
    icon: <Snowflake className="w-3.5 h-3.5" />,
    desc: "Salads & cold starters",
  },
  grill: {
    label: "Grill",
    color: "#ef9f27",
    icon: <Beef className="w-3.5 h-3.5" />,
    desc: "Steaks, burgers & chops",
  },
  dessert: {
    label: "Desserts",
    color: "#d4537e",
    icon: <Cake className="w-3.5 h-3.5" />,
    desc: "Sweet courses",
  },
  bar: {
    label: "Bar",
    color: "#a78bfa",
    icon: <GlassWater className="w-3.5 h-3.5" />,
    desc: "Drinks & cocktails",
  },
};

// ─── Keyboard Shortcuts Guide ─────────────────────────────────────────────────

const SHORTCUTS = [
  { key: "Space / Enter", label: "Bump selected order (mark done)" },
  { key: "S", label: "Start selected order (begin cooking)" },
  { key: "U", label: "Mark selected order as URGENT" },
  { key: "Del", label: "Void selected order" },
  { key: "R", label: "Toggle recall tray" },
  { key: "F", label: "Focus search box" },
  { key: "↑ ↓ ← →", label: "Navigate between orders" },
  { key: "Esc", label: "Deselect / close dialogs" },
];

// ─── Item Status Cycle Indicator ──────────────────────────────────────────────

function ItemStatusDot({
  status,
  onClick,
}: {
  status: ItemStatus;
  onClick: (e: React.MouseEvent) => void;
}) {
  const config = {
    pending: {
      label: "Pending",
      next: "cooking",
      cls: "bg-[#3a3f4a] hover:bg-[#555b68]",
    },
    cooking: {
      label: "Cooking",
      next: "ready",
      cls: "bg-[#e8a020] shadow-[0_0_6px_rgba(232,160,32,0.6)] hover:bg-amber-400",
    },
    ready: {
      label: "Ready",
      next: "pending",
      cls: "bg-[#2ecc71] shadow-[0_0_6px_rgba(46,204,113,0.6)] hover:bg-emerald-400",
    },
  };
  const c = config[status];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0 mt-0.5 transition-all duration-150 cursor-pointer hover:scale-150 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-[#111318]",
              c.cls
            )}
            aria-label={`Item is ${c.label}. Click to mark as ${c.next}`}
          />
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]"
        >
          <p>
            <span className="font-bold">{c.label}</span> — click → {c.next}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  now: number;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onBump: () => void;
  onVoid: () => void;
  onRecall: () => void;
  onCycleItem: (itemId: string) => void;
}

function OrderCard({
  order,
  now,
  selected,
  onSelect,
  onStart,
  onBump,
  onVoid,
  onRecall,
  onCycleItem,
}: OrderCardProps) {
  const elapsed = now - order.createdAt;
  const level = timerLevel(elapsed);

  const typeLabels: Record<OrderType, string> = {
    dine: "Dine In",
    takeout: "Takeout",
    delivery: "Delivery",
    drive: "Drive-Thru",
  };
  const typeColors: Record<OrderType, string> = {
    dine: "text-[#3b9eff] border-[#3b9eff]/40 bg-[#3b9eff]/10",
    takeout: "text-[#e8a020] border-[#e8a020]/40 bg-[#e8a020]/10",
    delivery: "text-[#2ecc71] border-[#2ecc71]/40 bg-[#2ecc71]/10",
    drive: "text-[#a78bfa] border-[#a78bfa]/40 bg-[#a78bfa]/10",
  };

  const statusBorderColor: Record<OrderStatus, string> = {
    new: "border-l-[#e8a020]",
    in_progress: "border-l-[#3b9eff]",
    done: "border-l-[#2ecc71]",
    urgent: "border-l-[#ff4757]",
    voided: "border-l-[#555b68]",
  };

  const statusBadge: Record<
    OrderStatus,
    { label: string; cls: string }
  > = {
    new: { label: "NEW", cls: "bg-[#e8a020]/15 text-[#e8a020] border-[#e8a020]/40" },
    in_progress: {
      label: "COOKING",
      cls: "bg-[#3b9eff]/15 text-[#3b9eff] border-[#3b9eff]/40",
    },
    done: { label: "DONE", cls: "bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/40" },
    urgent: {
      label: "URGENT",
      cls: "bg-[#ff4757]/15 text-[#ff4757] border-[#ff4757]/40",
    },
    voided: { label: "VOIDED", cls: "bg-[#555b68]/15 text-[#555b68] border-[#555b68]/40" },
  };

  const timerColors = {
    ok: "text-[#2ecc71] border-[#2ecc71]/30 bg-[#2ecc71]/8",
    warn: "text-[#e8a020] border-[#e8a020]/40 bg-[#e8a020]/10",
    late: "text-[#ff4757] border-[#ff4757]/40 bg-[#ff4757]/10",
  };

  const isUrgentPulse = order.status === "urgent";
  const canStart = order.status === "new" || order.status === "urgent";
  const canBump =
    order.status === "in_progress" ||
    order.status === "new" ||
    order.status === "urgent";
  const isDoneOrVoided =
    order.status === "done" || order.status === "voided";

  const allItemsReady = order.items.every((i) => i.status === "ready");

  return (
    <div
      id={`card-${order.id}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Order ${order.num}, ${order.table}, ${order.status}`}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "flex flex-col rounded-xl border border-[#252830] bg-[#111318] overflow-hidden cursor-pointer",
        "border-l-4",
        statusBorderColor[order.status],
        "hover:-translate-y-0.5 hover:border-[#353a44] hover:shadow-lg hover:shadow-black/40",
        "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b9eff]",
        selected &&
          "!border-[#3b9eff] !border-l-4 shadow-[0_0_0_2px_rgba(59,158,255,0.25)] hover:!border-[#3b9eff]",
        isUrgentPulse && "animate-[urgentPulse_1.5s_ease-in-out_infinite]",
        isDoneOrVoided && "opacity-55"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1d2128]">
        <span className="font-mono text-[17px] font-bold text-[#f0f2f5] leading-none tracking-tight">
          {order.num}
        </span>

        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
            typeColors[order.type]
          )}
        >
          {typeLabels[order.type]}
        </span>

        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
            statusBadge[order.status].cls
          )}
        >
          {statusBadge[order.status].label}
        </span>

        {order.status === "urgent" && (
          <span
            className="flex items-center gap-1 text-[#ff4757]"
            title="URGENT ORDER"
          >
            <AlertTriangle className="w-3 h-3 fill-[#ff4757]" />
          </span>
        )}

        {allItemsReady && !isDoneOrVoided && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2ecc71]" />
              </TooltipTrigger>
              <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                All items ready — bump now!
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-[#555b68] font-mono hidden sm:inline">
            {order.table}
            {order.covers ? ` · ${order.covers}pax` : ""}
          </span>

          {/* Timer */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <span
                  className={cn(
                    "font-mono text-[12px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1",
                    timerColors[level],
                    level === "late" &&
                      "animate-[timerFlash_0.8s_ease-in-out_infinite_alternate]"
                  )}
                >
                  <Clock className="w-3 h-3 opacity-70" />
                  {formatTimer(elapsed)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                {level === "ok" && "On time"}
                {level === "warn" && "Getting slow — check on this order"}
                {level === "late" && "⚠️ Very late! Prioritize immediately"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="px-3 py-1 flex-1">
        {order.items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-2 py-[5px]",
              i < order.items.length - 1 && "border-b border-[#1d2128]"
            )}
          >
            <span className="font-mono text-[13px] font-bold text-[#e8a020] min-w-[20px] pt-px leading-tight">
              ×{item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#f0f2f5] truncate leading-tight">
                {item.name}
              </div>
              {item.modifiers && (
                <div
                  className={cn(
                    "text-[10px] truncate leading-tight mt-0.5",
                    item.isAllergy
                      ? "text-[#ff4757] font-bold not-italic flex items-center gap-1"
                      : "text-[#555b68] italic"
                  )}
                >
                  {item.isAllergy && (
                    <AlertTriangle className="w-2.5 h-2.5 inline flex-shrink-0" />
                  )}
                  {item.modifiers}
                </div>
              )}
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ItemStatusDot
                      status={item.status}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCycleItem(item.id);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="text-[10px] bg-[#1a1d24] border-[#353a44] text-[#8b919e]"
                >
                  Tap to advance item status
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>

      {/* ── Note ── */}
      {order.note && (
        <div className="mx-3 mb-2 mt-1 px-2 py-1.5 rounded-md bg-[#e8a020]/8 border border-[#e8a020]/20 flex items-center gap-1.5">
          <Bell className="w-2.5 h-2.5 text-[#e8a020] flex-shrink-0" />
          <span className="text-[10px] text-[#e8a020] italic truncate">
            {order.note}
          </span>
        </div>
      )}

      {/* ── Footer / Actions ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-[#1d2128]">
        <span className="text-[10px] text-[#3a3f4a] truncate flex-1 min-w-0">
          {order.server}
        </span>
        <div className="flex gap-1.5 ml-auto flex-shrink-0">
          {isDoneOrVoided ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecall();
                    }}
                    className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wide border-[#353a44] text-[#8b919e] bg-transparent hover:bg-[#1a1d24] hover:text-[#f0f2f5]"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Recall
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                  Bring this order back to active
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              {canStart && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStart();
                        }}
                        className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wide bg-[#3b9eff]/15 text-[#3b9eff] border border-[#3b9eff]/40 hover:bg-[#3b9eff]/25 shadow-none"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                      Begin cooking this order
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {canBump && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBump();
                        }}
                        className={cn(
                          "h-7 px-2.5 text-[10px] font-bold uppercase tracking-wide border shadow-none",
                          allItemsReady
                            ? "bg-[#2ecc71]/25 text-[#2ecc71] border-[#2ecc71]/50 hover:bg-[#2ecc71]/35 ring-1 ring-[#2ecc71]/30"
                            : "bg-[#2ecc71]/12 text-[#2ecc71] border-[#2ecc71]/30 hover:bg-[#2ecc71]/22"
                        )}
                      >
                        <CheckCheck className="w-3 h-3 mr-1" />
                        Bump
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                      Mark complete & remove from screen
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVoid();
                      }}
                      className="h-7 px-2 text-[10px] font-bold text-[#3a3f4a] hover:text-[#ff4757] hover:bg-[#ff4757]/10 border border-transparent hover:border-[#ff4757]/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                    Void (cancel) this order
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3b9eff] rounded-b-xl" />
      )}
    </div>
  );
}

// ─── Recall Sheet ─────────────────────────────────────────────────────────────

function RecallSheet({
  open,
  bumped,
  onClose,
  onRecall,
}: {
  open: boolean;
  bumped: Order[];
  onClose: () => void;
  onRecall: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[300px] bg-[#111318] border-l border-[#252830] text-[#f0f2f5] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-[#252830]">
          <SheetTitle className="text-[12px] font-bold uppercase tracking-widest text-[#8b919e] flex items-center gap-2">
            <RefreshCcw className="w-3.5 h-3.5" />
            Bumped Orders — Recall
          </SheetTitle>
          <p className="text-[11px] text-[#555b68]">
            Recently completed orders. Tap Recall to reopen.
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {bumped.length === 0 ? (
            <div className="text-center py-12 text-[#555b68]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No bumped orders yet</p>
            </div>
          ) : (
            bumped.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#252830] bg-[#0d0f12] hover:border-[#353a44] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-sm text-[#2ecc71]">
                    {o.num}
                  </div>
                  <div className="text-[11px] text-[#555b68]">
                    {o.table} · {o.items.length} item
                    {o.items.length !== 1 ? "s" : ""}
                  </div>
                  {o.bumpedAt && (
                    <div className="text-[10px] text-[#3a3f4a]">
                      Cook: {formatTimer(o.bumpedAt - o.createdAt)}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => onRecall(o.id)}
                  className="h-7 text-[10px] font-bold text-[#3b9eff] border border-[#3b9eff]/35 bg-[#3b9eff]/10 hover:bg-[#3b9eff]/20 shadow-none uppercase tracking-wide"
                >
                  <Undo2 className="w-3 h-3 mr-1" />
                  Recall
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Keyboard Shortcuts Dialog ────────────────────────────────────────────────

function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#111318] border border-[#252830] text-[#f0f2f5] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#f0f2f5]">
            <Keyboard className="w-4 h-4 text-[#e8a020]" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-[#555b68]">
            Use these shortcuts to work faster. Select an order card first, then
            use the shortcut.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          {SHORTCUTS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-1.5 border-b border-[#1d2128] last:border-0"
            >
              <span className="text-[12px] text-[#8b919e]">{label}</span>
              <kbd className="font-mono text-[11px] bg-[#1a1d24] border border-[#353a44] rounded px-2 py-0.5 text-[#e8a020]">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#353a44] text-[#8b919e] bg-transparent hover:bg-[#1a1d24] hover:text-[#f0f2f5]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Onboarding Tip Banner ────────────────────────────────────────────────────

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#3b9eff]/10 border-b border-[#3b9eff]/25 text-[#3b9eff] shrink-0">
      <Info className="w-4 h-4 flex-shrink-0" />
      <p className="text-[11px] flex-1">
        <strong>Quick start:</strong> Click any order to select it, then tap{" "}
        <strong>Start</strong> → <strong>Bump ✓</strong> when ready. Dots on
        each item track cooking progress. Green = ready, orange = cooking.
      </p>
      <button
        onClick={onDismiss}
        className="text-[#3b9eff]/60 hover:text-[#3b9eff] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  count,
  label,
  color,
  dotColor,
  pulse,
}: {
  count: number;
  label: string;
  color: string;
  dotColor: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full border ${color}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="font-mono font-bold">{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// ─── Main KDS Page ────────────────────────────────────────────────────────────

export default function KDSPage() {
  const orders = useKdsStore(state => state.orders);
  const [operator, setOperator] = useState<string>(localStorage.getItem('ASSIGNED_USER_NAME') || '');
  const [etaQueryTarget, setEtaQueryTarget] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      setOperator(e.detail.userName || '');
    };
    window.addEventListener('assignment-updated', handler);
    return () => window.removeEventListener('assignment-updated', handler);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const { orderId } = e.detail;
      setEtaQueryTarget(orderId);
      toast.info(`ETA Query for Order #${orders.find(o => o.id === orderId)?.num}`, {
        description: "Hub is asking for an ETA",
        duration: 5000,
      });
    };
    window.addEventListener('order-eta-query', handler);
    return () => window.removeEventListener('order-eta-query', handler);
  }, [orders]);

  const autoPrintKds = usePosStore(state => state.settings.kitchenTicketConfig.autoPrintKds);
  const [bumped, setBumped] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [station, setStation] = useState<Station>("all");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("time_asc");
  const [cols, setCols] = useState(3);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now());
  const [recallOpen, setRecallOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-incoming orders logic intentionally removed. WebSockets will handle this.

  // Derived list
  const visibleOrders = (() => {
    const q = search.toLowerCase();
    let list = orders.filter((o) => {
      if (station !== "all" && o.station !== station) return false;
      if (filter !== "all" && o.status !== filter) return false;
      if (
        q &&
        !o.num.toLowerCase().includes(q) &&
        !o.table.toLowerCase().includes(q) &&
        !o.items.some((i) => i.name.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
    const priorityMap: Record<OrderStatus, number> = {
      urgent: 0,
      new: 1,
      in_progress: 2,
      done: 3,
      voided: 4,
    };
    if (sort === "time_asc") list.sort((a, b) => a.createdAt - b.createdAt);
    else if (sort === "time_desc")
      list.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "priority")
      list.sort((a, b) => priorityMap[a.status] - priorityMap[b.status]);
    else list.sort((a, b) => a.table.localeCompare(b.table));
    return list;
  })();

  // Stats
  const countNew = orders.filter((o) => o.status === "new").length;
  const countProg = orders.filter((o) => o.status === "in_progress").length;
  const countDone = orders.filter((o) => o.status === "done").length;
  const countUrgent = orders.filter((o) => o.status === "urgent").length;

  const stationCount = (s: Station) =>
    s === "all"
      ? orders.filter((o) => o.status !== "done" && o.status !== "voided")
          .length
      : orders.filter(
          (o) =>
            o.station === s &&
            o.status !== "done" &&
            o.status !== "voided"
        ).length;

  const avgTime = (() => {
    const recent = bumped.slice(0, 20);
    if (!recent.length) return null;
    return formatTimer(
      recent.reduce((a, o) => a + (o.bumpedAt! - o.createdAt), 0) /
        recent.length
    );
  })();

  // Actions
  const startOrder = useCallback(
    (id: string) => {
      useKdsStore.getState().updateOrderStatus(id, "in_progress");
      updateOrderStatusInKitchen(id, "in_progress");
      const o = orders.find((x) => x.id === id);
      if (o)
        toast.info(`Order ${o.num} started`, {
          description: `${o.table} · Begin cooking`,
          duration: 2500,
        });
    },
    [orders]
  );

  const bumpOrder = useCallback(
    (id: string) => {
      const o = orders.find((x) => x.id === id);
      useKdsStore.getState().bumpOrder(id);
      updateOrderStatusInKitchen(id, "done");
      if (o) {
        setBumped((prev) =>
          [{ ...o, status: "done", bumpedAt: Date.now() } as Order, ...prev].slice(
            0,
            50
          )
        );
        toast.success(`Order ${o.num} bumped`, {
          description: `${o.table} · Ready for service`,
          duration: 3000,
        });
      }
    },
    [orders]
  );

  const recallOrder = useCallback(
    (id: string) => {
      const fromBumped = bumped.find((x) => x.id === id);
      if (fromBumped) {
        setBumped((prev) => prev.filter((x) => x.id !== id));
        useKdsStore.getState().addOrder({ ...fromBumped, status: "in_progress", bumpedAt: undefined });
      }
      useKdsStore.getState().recallOrder(id);
      updateOrderStatusInKitchen(id, "in_progress");
      
      toast(`Order recalled`, {
        description: "Moved back to In Progress",
        icon: "↩️",
        duration: 2500,
      });
    },
    [bumped]
  );

  const voidOrder = useCallback(
    (id: string) => {
      useKdsStore.getState().updateOrderStatus(id, "voided");
      updateOrderStatusInKitchen(id, "voided");
      const o = orders.find((x) => x.id === id);
      if (o)
        toast.error(`Order ${o.num} voided`, {
          description: `${o.table} · Order cancelled`,
          duration: 3000,
        });
      setVoidTarget(null);
    },
    [orders]
  );

  const handleSendEta = (minutes: number) => {
    if (etaQueryTarget) {
      sendOrderEtaResponse(etaQueryTarget, minutes);
      setEtaQueryTarget(null);
      toast.success('ETA sent to hub');
    }
  };

  const cycleItemStatus = useCallback((orderId: string, itemId: string) => {
    const o = useKdsStore.getState().orders.find(o => o.id === orderId);
    if (!o) return;
    const item = o.items.find(i => i.id === itemId);
    if (!item) return;

    const cycle: Record<ItemStatus, ItemStatus> = {
      pending: "cooking",
      cooking: "ready",
      ready: "pending",
    };
    useKdsStore.getState().updateItemStatus(orderId, itemId, cycle[item.status]);
    
    if (o.status === "new" || o.status === "urgent") {
      useKdsStore.getState().updateOrderStatus(orderId, "in_progress");
      updateOrderStatusInKitchen(orderId, "in_progress");
    }
  }, []);

  const addTestOrder = () => {};

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (selectedId) {
          const o = orders.find((x) => x.id === selectedId);
          if (o && ["new", "in_progress", "urgent"].includes(o.status))
            bumpOrder(selectedId);
        }
      }
      if (e.key === "s" || e.key === "S") {
        if (selectedId) {
          const o = orders.find((x) => x.id === selectedId);
          if (o && (o.status === "new" || o.status === "urgent"))
            startOrder(selectedId);
        }
      }
      if (e.key === "u" || e.key === "U") {
        if (selectedId) {
          useKdsStore.getState().updateOrderStatus(selectedId, "urgent");
          updateOrderStatusInKitchen(selectedId, "urgent");
          toast.warning("Order marked urgent", {
            description: "Will be highlighted immediately",
            duration: 2500,
          });
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const o = orders.find((x) => x.id === selectedId);
          if (o) setVoidTarget(o);
        }
      }
      if (e.key === "r" || e.key === "R") setRecallOpen((v) => !v);
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "?" || e.key === "/") setShortcutsOpen((v) => !v);
      if (e.key === "Escape") {
        setSelectedId(null);
        setVoidTarget(null);
        setShortcutsOpen(false);
      }
      if (
        ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)
      ) {
        e.preventDefault();
        if (!visibleOrders.length) return;
        const idx = visibleOrders.findIndex((o) => o.id === selectedId);
        const isNext = e.key === "ArrowRight" || e.key === "ArrowDown";
        const next =
          idx === -1
            ? visibleOrders[0]
            : visibleOrders[
                isNext
                  ? Math.min(idx + 1, visibleOrders.length - 1)
                  : Math.max(idx - 1, 0)
              ];
        setSelectedId(next.id);
        document
          .getElementById(`card-${next.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, orders, visibleOrders, bumpOrder, startOrder]);

  const clockStr = new Date(now).toTimeString().slice(0, 8);
  const dateStr = new Date(now).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const gridCols =
    (
      {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
      } as Record<number, string>
    )[cols] ?? "grid-cols-3";



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes urgentPulse { 0%,100% { box-shadow:0 0 0 0 rgba(255,71,87,0); } 50% { box-shadow:0 0 0 4px rgba(255,71,87,0.12); } }
        @keyframes timerFlash { from { opacity:0.6; } to { opacity:1; } }
        @keyframes connBlink { 0%,90%,100% { opacity:1; } 95% { opacity:0.2; } }
        @keyframes pulseAlert { from { opacity:0.75; } to { opacity:1; } }
        * { font-family: 'Syne', sans-serif; box-sizing: border-box; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #353a44; border-radius: 3px; }
      `}</style>

      <div className="flex flex-col h-screen w-screen bg-[#0a0b0d] text-[#f0f2f5] overflow-hidden select-none">

        {/* ── TOP BAR ── */}
        <div className="flex items-center gap-2 h-[52px] shrink-0 bg-[#111318] border-b border-[#252830] px-4 z-10">
          <div className="flex items-center gap-2 mr-3">
            <ChefHat className="w-5 h-5 text-[#e8a020]" />
            <span className="text-[13px] font-bold tracking-[0.12em] uppercase text-[#e8a020]">
              KDS
            </span>
          </div>

          <Badge
            variant="outline"
            className="font-mono text-[10px] text-[#8b919e] bg-[#1a1d24] border-[#353a44] hidden sm:flex items-center gap-1 mr-2"
          >
            {STATION_CONFIG[station].icon}
            {STATION_CONFIG[station].label}
          </Badge>

          {operator && (
            <Badge
              variant="outline"
              className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border-blue-500/30 hidden md:flex items-center gap-1 mr-2"
            >
              <Users className="w-3 h-3" />
              Op: {operator}
            </Badge>
          )}

          <div className="flex items-center gap-1.5 font-mono mr-3">
            <span className="text-[18px] font-bold text-[#f0f2f5] tracking-tight">
              {clockStr}
            </span>
            <span className="text-[11px] text-[#555b68] hidden sm:inline">
              {dateStr}
            </span>
          </div>

          <Separator orientation="vertical" className="h-6 bg-[#252830] mx-1" />

          {/* Stats */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {countUrgent > 0 && (
              <StatPill
                count={countUrgent}
                label="Urgent"
                color="text-[#ff4757] border-[#ff4757]/40 bg-[#ff4757]/10"
                dotColor="bg-[#ff4757]"
                pulse
              />
            )}
            <StatPill
              count={countNew}
              label="New"
              color="text-[#e8a020] border-[#e8a020]/35 bg-[#e8a020]/10"
              dotColor="bg-[#e8a020]"
            />
            <StatPill
              count={countProg}
              label="Cooking"
              color="text-[#3b9eff] border-[#3b9eff]/35 bg-[#3b9eff]/10"
              dotColor="bg-[#3b9eff]"
            />
            <StatPill
              count={countDone}
              label="Done"
              color="text-[#2ecc71] border-[#2ecc71]/30 bg-[#2ecc71]/8"
              dotColor="bg-[#2ecc71]"
            />
          </div>

          <div className="flex-1" />

          {avgTime && (
            <span className="text-[12px] text-[#555b68] hidden md:flex items-center gap-1 mr-2">
              <Clock className="w-3 h-3" />
              Avg:{" "}
              <span className="font-mono font-bold text-[#f0f2f5]">
                {avgTime}
              </span>
            </span>
          )}

          <Separator orientation="vertical" className="h-6 bg-[#252830] mx-1" />

          <div className="flex items-center gap-1">
            {/* Auto-Print Settings Toggle */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const current = usePosStore.getState().settings.kitchenTicketConfig.autoPrintKds;
                      usePosStore.getState().updateKitchenTicketConfig({ autoPrintKds: !current });
                      toast.info(`Auto-print ${!current ? 'Enabled' : 'Disabled'}`, {
                        description: "New tickets will be printed automatically",
                        icon: <Printer className="w-4 h-4" />
                      });
                    }}
                    className={cn(
                      "h-8 px-2 text-[10px] font-bold uppercase tracking-wide gap-1.5",
                      autoPrintKds
                        ? "text-[#2ecc71] bg-[#2ecc71]/10 border-[#2ecc71]/30"
                        : "text-[#555b68] hover:text-[#f0f2f5] hover:bg-[#1a1d24]"
                    )}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Auto-Print</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                  Toggle auto-printing for incoming tickets
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setRecallOpen((v) => !v)}
                    className="w-8 h-8 text-[#555b68] hover:text-[#f0f2f5] hover:bg-[#1a1d24] border border-transparent hover:border-[#353a44]"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                  Recall bumped orders (R)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={addTestOrder}
                    className="w-8 h-8 text-[#555b68] hover:text-[#f0f2f5] hover:bg-[#1a1d24] border border-transparent hover:border-[#353a44]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                  Add test order
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShortcutsOpen(true)}
                    className="w-8 h-8 text-[#555b68] hover:text-[#f0f2f5] hover:bg-[#1a1d24] border border-transparent hover:border-[#353a44]"
                  >
                    <Keyboard className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                  Keyboard shortcuts (?)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* ── URGENT BANNER ── */}
        {countUrgent > 0 && (
          <div
            className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-[#ff4757] bg-[#ff4757]/10 border-b border-[#ff4757]/40 py-1.5 shrink-0"
            style={{ animation: "pulseAlert 1.2s ease-in-out infinite alternate" }}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {countUrgent} URGENT ORDER{countUrgent > 1 ? "S" : ""} — IMMEDIATE
            ATTENTION REQUIRED
          </div>
        )}

        {/* ── ONBOARDING TIP ── */}
        {showOnboarding && (
          <OnboardingBanner onDismiss={() => setShowOnboarding(false)} />
        )}

        {/* ── STATION TABS ── */}
        <div className="flex items-center h-11 shrink-0 bg-[#111318] border-b border-[#252830] px-3 gap-0.5 overflow-x-auto">
          {(
            ["all", "hot", "cold", "grill", "dessert", "bar"] as Station[]
          ).map((s) => {
            const cfg = STATION_CONFIG[s];
            const active = station === s;
            return (
              <TooltipProvider key={s} delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStation(s)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap",
                        active
                          ? "text-[#f0f2f5] bg-[#1a1d24] border-[#353a44]"
                          : "text-[#555b68] border-transparent hover:text-[#8b919e] hover:bg-[#1a1d24]"
                      )}
                    >
                      <span
                        style={{ color: active ? cfg.color : undefined }}
                        className="transition-colors"
                      >
                        {cfg.icon}
                      </span>
                      <span className="hidden sm:inline">{cfg.label}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[9px] font-bold h-4 px-1 rounded-full border",
                          active
                            ? "bg-[#e8a020]/10 text-[#e8a020] border-[#e8a020]/35"
                            : "bg-[#0a0b0d] text-[#555b68] border-[#252830]"
                        )}
                      >
                        {stationCount(s)}
                      </Badge>
                      {active && (
                        <span
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-sm"
                          style={{ background: cfg.color }}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[11px] bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]">
                    {cfg.desc}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          <div className="flex-1" />
        </div>

        {/* ── FILTER / TOOLBAR ROW ── */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0d] border-b border-[#252830] shrink-0 overflow-x-auto">
          {/* Status filters */}
          <div className="flex items-center gap-1 mr-1">
            {(
              [
                ["all", "All"],
                ["new", "New"],
                ["in_progress", "Cooking"],
                ["done", "Done"],
                ["urgent", "Urgent"],
              ] as [string, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f as OrderStatus | "all")}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded border transition-all whitespace-nowrap",
                  filter === f
                    ? "bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]"
                    : "border-[#252830] text-[#3a3f4a] hover:text-[#8b919e] hover:border-[#353a44]",
                  f === "urgent" && filter !== f
                    ? "!text-[#ff4757]/50 !border-[#ff4757]/15 hover:!text-[#ff4757] hover:!border-[#ff4757]/40"
                    : "",
                  f === "urgent" && filter === f
                    ? "!text-[#ff4757] !border-[#ff4757]/40 !bg-[#ff4757]/10"
                    : ""
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5 bg-[#252830] mx-0.5" />

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortKey)}
          >
            <SelectTrigger className="h-7 w-[130px] text-[11px] bg-[#111318] border-[#252830] text-[#8b919e] focus:ring-0 focus:border-[#353a44]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111318] border-[#252830] text-[#f0f2f5]">
              <SelectItem value="time_asc" className="text-[11px]">
                Oldest First
              </SelectItem>
              <SelectItem value="time_desc" className="text-[11px]">
                Newest First
              </SelectItem>
              <SelectItem value="priority" className="text-[11px]">
                By Priority
              </SelectItem>
              <SelectItem value="table" className="text-[11px]">
                By Table
              </SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5 bg-[#252830] mx-0.5" />

          {/* Columns */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#3a3f4a] hidden sm:inline">
              Cols:
            </span>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setCols(n)}
                className={cn(
                  "w-7 h-7 rounded border text-[11px] font-bold transition-all",
                  cols === n
                    ? "bg-[#1a1d24] border-[#353a44] text-[#f0f2f5]"
                    : "border-[#252830] text-[#3a3f4a] hover:text-[#8b919e] hover:border-[#353a44]"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555b68]" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, table, item…"
              className="h-7 w-[180px] pl-6 text-[12px] bg-[#111318] border-[#252830] text-[#f0f2f5] placeholder:text-[#3a3f4a] focus:border-[#353a44] focus-visible:ring-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555b68] hover:text-[#f0f2f5]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── ORDER GRID ── */}
        <div
          className={cn(
            "flex-1 overflow-auto p-3 grid gap-3 content-start",
            gridCols
          )}
        >
          {visibleOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-[#555b68]">
              <ChefHat className="w-12 h-12 mb-3 opacity-15" />
              <p className="text-base font-bold mb-1 text-[#3a3f4a]">
                All Clear
              </p>
              <p className="text-xs">No orders match the current filters</p>
              {(filter !== "all" || search) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  className="mt-3 h-7 text-[11px] border-[#353a44] text-[#8b919e] bg-transparent hover:bg-[#1a1d24]"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                selected={order.id === selectedId}
                onSelect={() =>
                  setSelectedId(order.id === selectedId ? null : order.id)
                }
                onStart={() => startOrder(order.id)}
                onBump={() => bumpOrder(order.id)}
                onVoid={() => setVoidTarget(order)}
                onRecall={() => recallOrder(order.id)}
                onCycleItem={(itemId) => cycleItemStatus(order.id, itemId)}
              />
            ))
          )}
        </div>

        {/* ── BOTTOM STATUS BAR ── */}
        <div className="flex items-center gap-3 h-10 shrink-0 bg-[#111318] border-t border-[#252830] px-4 overflow-x-auto">
          <div className="flex items-center gap-3">
            {[
              ["Space", "Bump"],
              ["S", "Start"],
              ["U", "Urgent"],
              ["Del", "Void"],
              ["R", "Recall"],
              ["?", "Help"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-[10px] text-[#3a3f4a] whitespace-nowrap"
              >
                <kbd className="font-mono text-[9px] bg-[#1a1d24] border border-[#2a2f38] rounded px-1.5 py-px text-[#555b68]">
                  {key}
                </kbd>
                <span className="hidden md:inline">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex-1" />
          {selectedId && (
            <span className="text-[10px] text-[#3b9eff] font-mono hidden sm:inline">
              {orders.find((o) => o.id === selectedId)?.num} selected
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2ecc71]">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]"
              style={{ animation: "connBlink 2s ease-in-out infinite" }}
            />
            <span className="hidden sm:inline">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── RECALL SHEET ── */}
      <RecallSheet
        open={recallOpen}
        bumped={bumped}
        onClose={() => setRecallOpen(false)}
        onRecall={recallOrder}
      />

      {/* ── VOID CONFIRMATION ── */}
      <AlertDialog
        open={!!voidTarget}
        onOpenChange={(v) => !v && setVoidTarget(null)}
      >
        <AlertDialogContent className="bg-[#111318] border border-[#252830] text-[#f0f2f5] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#f0f2f5]">
              <Trash2 className="w-4 h-4 text-[#ff4757]" />
              Void Order {voidTarget?.num}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#555b68]">
              This will cancel order{" "}
              <strong className="text-[#f0f2f5]">{voidTarget?.num}</strong> for{" "}
              <strong className="text-[#f0f2f5]">{voidTarget?.table}</strong>{" "}
              with {voidTarget?.items.length} item
              {(voidTarget?.items.length ?? 0) > 1 ? "s" : ""}. This cannot be
              undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#353a44] text-[#8b919e] bg-transparent hover:bg-[#1a1d24] hover:text-[#f0f2f5]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidTarget && voidOrder(voidTarget.id)}
              className="bg-[#ff4757]/15 text-[#ff4757] border border-[#ff4757]/40 hover:bg-[#ff4757]/25 shadow-none"
            >
              Void Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── ETA QUERY DIALOG ── */}
      <Dialog open={!!etaQueryTarget} onOpenChange={(v) => !v && setEtaQueryTarget(null)}>
        <DialogContent className="bg-[#111318] border border-[#252830] text-[#f0f2f5] max-w-sm">
          <DialogHeader>
            <DialogTitle>Send ETA to Hub</DialogTitle>
            <DialogDescription className="text-[#555b68]">
              How many minutes until Order #{orders.find(o => o.id === etaQueryTarget)?.num} is ready?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[2, 5, 10, 15, 20, 30].map(mins => (
              <Button
                key={mins}
                variant="outline"
                onClick={() => handleSendEta(mins)}
                className="border-[#353a44] hover:bg-[#3b9eff]/20 hover:text-[#3b9eff]"
              >
                {mins} mins
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom mins..."
              className="bg-[#0a0b0d] border-[#252830]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendEta(parseInt((e.target as HTMLInputElement).value));
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEtaQueryTarget(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SHORTCUTS DIALOG ── */}
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}