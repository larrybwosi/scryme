"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  AlertTriangle,
  Beef,
  Bell,
  Cake,
  Check,
  CheckCheck,
  CheckCircle2,
  ChefHat,
  Circle,
  Clock,
  Flame,
  GlassWater,
  Info,
  Keyboard,
  Layers,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  Play,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  ShieldAlert,
  Snowflake,
  Sun,
  Trash2,
  Undo2,
  Users,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types and Store ────────────────────────────────────────────────────────
import {
  useKdsStore,
  KdsOrder as Order,
  OrderStatus,
  OrderType,
  ItemStatus,
  Station,
} from "@/store/kds-store";
import { usePosStore } from "@/store/store";
import { updateOrderStatusInKitchen, sendOrderEtaResponse } from "@/lib/kds";

type Tone =
  | "amber"
  | "blue"
  | "green"
  | "red"
  | "violet"
  | "orange"
  | "pink"
  | "slate";
type Filter = OrderStatus | "all" | "active";
type SortKey = "time_asc" | "time_desc" | "priority" | "table";
type ThemePref = "light" | "dark" | "system";
type TimerLevel = "ok" | "warn" | "late" | "idle";

// ─── Design tokens ──────────────────────────────────────────────────────────
// Status colours are defined once, with separate light/dark values so every
// tint keeps WCAG-friendly contrast in both themes. Surfaces, borders and text
// come from the shared shadcn tokens (bg-card, border-border, text-foreground…)
// so the page follows the app's theme automatically.

const KDS_STYLES = `
:root{
  --kds-amber:#b45309; --kds-blue:#1d4ed8; --kds-green:#15803d; --kds-red:#dc2626;
  --kds-violet:#6d28d9; --kds-orange:#c2410c; --kds-pink:#be185d; --kds-slate:#64748b;
  --kds-on-tone:#ffffff;
}
.dark{
  --kds-amber:#fbbf24; --kds-blue:#60a5fa; --kds-green:#4ade80; --kds-red:#f87171;
  --kds-violet:#a78bfa; --kds-orange:#fb923c; --kds-pink:#f472b6; --kds-slate:#94a3b8;
  --kds-on-tone:#0b0d10;
}
.tone-amber{--tone:var(--kds-amber)} .tone-blue{--tone:var(--kds-blue)}
.tone-green{--tone:var(--kds-green)} .tone-red{--tone:var(--kds-red)}
.tone-violet{--tone:var(--kds-violet)} .tone-orange{--tone:var(--kds-orange)}
.tone-pink{--tone:var(--kds-pink)} .tone-slate{--tone:var(--kds-slate)}
.kds-text{color:var(--tone)}
.kds-bar{background:var(--tone)}
.kds-accent{border-left:4px solid var(--tone)}
.kds-chip{color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);border:1px solid color-mix(in srgb,var(--tone) 32%,transparent)}
.kds-chip-btn:hover{background:color-mix(in srgb,var(--tone) 22%,transparent)}
.kds-solid{background:var(--tone);color:var(--kds-on-tone);border:1px solid var(--tone)}
.kds-solid:hover{filter:brightness(1.08)}
@keyframes kdsUrgent{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 5px color-mix(in srgb,var(--kds-red) 22%,transparent)}}
@keyframes kdsFlash{from{opacity:.65}to{opacity:1}}
@keyframes kdsBlink{0%,90%,100%{opacity:1}95%{opacity:.25}}
.kds-urgent{animation:kdsUrgent 1.6s ease-in-out infinite}
.kds-late{animation:kdsFlash .9s ease-in-out infinite alternate}
.kds-blink{animation:kdsBlink 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.kds-urgent,.kds-late,.kds-blink{animation:none}}
`;

const tone = (t: Tone) => `tone-${t}`;

const STATION_ORDER: Station[] = ["all", "hot", "cold", "grill", "dessert", "bar"];

const STATION_CONFIG: Record<
  Station,
  { label: string; tone: Tone; icon: LucideIcon; desc: string }
> = {
  all: { label: "All Stations", tone: "amber", icon: Layers, desc: "View every active order" },
  hot: { label: "Hot Line", tone: "orange", icon: Flame, desc: "Pasta, pizza, fried items" },
  cold: { label: "Cold Station", tone: "blue", icon: Snowflake, desc: "Salads & cold starters" },
  grill: { label: "Grill", tone: "amber", icon: Beef, desc: "Steaks, burgers & chops" },
  dessert: { label: "Desserts", tone: "pink", icon: Cake, desc: "Sweet courses" },
  bar: { label: "Bar", tone: "violet", icon: GlassWater, desc: "Drinks & cocktails" },
};

const STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "amber" },
  in_progress: { label: "Cooking", tone: "blue" },
  done: { label: "Done", tone: "green" },
  urgent: { label: "Urgent", tone: "red" },
  voided: { label: "Voided", tone: "slate" },
};

const TYPE_META: Record<OrderType, { label: string; tone: Tone }> = {
  dine: { label: "Dine In", tone: "blue" },
  takeout: { label: "Takeout", tone: "amber" },
  delivery: { label: "Delivery", tone: "green" },
  drive: { label: "Drive-Thru", tone: "violet" },
};

const TIMER_TONE: Record<TimerLevel, Tone> = {
  ok: "green",
  warn: "amber",
  late: "red",
  idle: "slate",
};

const ITEM_STATUS_META: Record<
  ItemStatus,
  { label: string; next: ItemStatus; nextLabel: string; tone: Tone; icon: LucideIcon }
> = {
  pending: { label: "Pending", next: "cooking", nextLabel: "cooking", tone: "slate", icon: Circle },
  cooking: { label: "Cooking", next: "ready", nextLabel: "ready", tone: "amber", icon: Flame },
  ready: { label: "Ready", next: "pending", nextLabel: "pending", tone: "green", icon: Check },
};

const FILTERS: { id: Filter; label: string; tone?: Tone }[] = [
  { id: "active", label: "Active" },
  { id: "new", label: "New" },
  { id: "in_progress", label: "Cooking" },
  { id: "urgent", label: "Urgent", tone: "red" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Space", "Enter", "B"], label: "Bump selected order (mark done)" },
  { keys: ["S"], label: "Start selected order" },
  { keys: ["U"], label: "Toggle urgent on selected order" },
  { keys: ["Del"], label: "Void selected order (asks to confirm)" },
  { keys: ["R"], label: "Open recall tray" },
  { keys: ["/", "F"], label: "Focus search" },
  { keys: ["?"], label: "Show this help" },
  { keys: ["↑", "↓", "←", "→"], label: "Move between orders" },
  { keys: ["Esc"], label: "Deselect order / close panels" },
];

const LATE_AFTER_MIN = 15;
const WARN_AFTER_MIN = 8;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, "0")}`;
}

function timerLevel(ms: number): TimerLevel {
  const m = ms / 60_000;
  if (m < WARN_AFTER_MIN) return "ok";
  if (m < LATE_AFTER_MIN) return "warn";
  return "late";
}

const isActiveStatus = (s: OrderStatus) => s !== "done" && s !== "voided";

function matchesFilter(status: OrderStatus, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "active") return isActiveStatus(status);
  return status === filter;
}

const getOrder = (id: string) =>
  useKdsStore.getState().orders.find((o) => o.id === id);

// ─── Audio (single shared context, unlocked on first interaction) ───────────

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function playOrderChime() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

// One shared 1s ticker for every timer on screen.
const tickListeners = new Set<() => void>();
let tickValue = 0;
let tickHandle: ReturnType<typeof setInterval> | null = null;

function subscribeNow(cb: () => void) {
  tickListeners.add(cb);
  if (!tickHandle) {
    tickValue = Date.now();
    tickHandle = setInterval(() => {
      tickValue = Date.now();
      tickListeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    tickListeners.delete(cb);
    if (!tickListeners.size && tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  };
}

function useNow() {
  return useSyncExternalStore(subscribeNow, () => tickValue || Date.now(), () => 0);
}

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true
  );
}

/** localStorage-backed state that is safe for SSR / hydration. */
function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

/**
 * Light / dark / system preference. Toggles the `dark` class on <html> and
 * stores the choice under the same key next-themes uses ("theme"), so it stays
 * compatible if your app already has a ThemeProvider.
 */
function useThemePreference() {
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    let stored: ThemePref = "system";
    try {
      const s = localStorage.getItem("theme");
      if (s === "light" || s === "dark" || s === "system") stored = s;
    } catch {
      /* ignore */
    }
    setPref(stored);
  }, []);

  useEffect(() => {
    if (pref === null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = pref === "dark" || (pref === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  const update = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }, []);

  return [pref ?? "system", update] as const;
}

function useElapsed(order: Order) {
  const now = useNow();
  const terminal = order.status === "done" || order.status === "voided";
  const end =
    order.status === "done" && order.bumpedAt ? order.bumpedAt : now;
  const elapsed = Math.max(0, end - order.createdAt);
  const level: TimerLevel = terminal ? "idle" : timerLevel(elapsed);
  return { elapsed, level };
}

// ─── Small building blocks ──────────────────────────────────────────────────

function Tip({
  label,
  side = "bottom",
  children,
}: {
  label: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function IconAction({
  label,
  onClick,
  pressed,
  active,
  badge,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  active?: boolean;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Tip label={label}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          "relative size-9 text-muted-foreground hover:text-foreground",
          active && "text-primary"
        )}
      >
        {children}
        {!!badge && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Button>
    </Tip>
  );
}

function StatPill({
  count,
  label,
  tone: t,
  pulse,
}: {
  count: number;
  label: string;
  tone: Tone;
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        "kds-chip inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tone(t)
      )}
      title={`${count} ${label}`}
    >
      <span
        className={cn("kds-bar size-1.5 rounded-full", pulse && "animate-pulse")}
        aria-hidden
      />
      <span className="font-mono text-sm font-bold tabular-nums">{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function LiveClock() {
  const now = useNow();
  const ready = now > 0;
  const d = new Date(now);
  return (
    <div className="flex items-baseline gap-2 font-mono">
      <span className="text-xl font-bold tabular-nums tracking-tight">
        {ready ? d.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
      </span>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {ready
          ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
          : ""}
      </span>
    </div>
  );
}

const THEME_META: Record<ThemePref, { icon: LucideIcon; label: string }> = {
  system: { icon: Monitor, label: "System" },
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
};
const THEME_NEXT: Record<ThemePref, ThemePref> = {
  system: "light",
  light: "dark",
  dark: "system",
};

function ThemeToggle({
  pref,
  onChange,
}: {
  pref: ThemePref;
  onChange: (p: ThemePref) => void;
}) {
  const Icon = THEME_META[pref].icon;
  const next = THEME_NEXT[pref];
  return (
    <IconAction
      label={`Theme: ${THEME_META[pref].label}. Switch to ${THEME_META[next].label}`}
      onClick={() => onChange(next)}
    >
      <Icon className="size-4" />
    </IconAction>
  );
}

// ─── Item status button ─────────────────────────────────────────────────────

function ItemStatusButton({
  name,
  status,
  onClick,
}: {
  name: string;
  status: ItemStatus;
  onClick: () => void;
}) {
  const c = ITEM_STATUS_META[status];
  const Icon = c.icon;
  return (
    <Tip label={`${c.label} — tap to mark ${c.nextLabel}`} side="left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`${name}: ${c.label}. Activate to mark ${c.nextLabel}`}
        className={cn(
          "kds-chip kds-chip-btn grid size-9 shrink-0 place-items-center rounded-full transition active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          tone(c.tone),
          status === "ready" && "kds-solid"
        )}
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </Tip>
  );
}

// ─── Order card ─────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  selected: boolean;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onBump: (id: string) => void;
  onVoid: (id: string) => void;
  onRecall: (id: string) => void;
  onToggleUrgent: (id: string) => void;
  onToggleFire: (id: string) => void;
  onCycleItem: (orderId: string, itemId: string) => void;
}

const actionBase =
  "inline-flex h-10 select-none items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wide transition active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

const OrderCard = memo(function OrderCard({
  order,
  selected,
  onSelect,
  onStart,
  onBump,
  onVoid,
  onRecall,
  onToggleUrgent,
  onToggleFire,
  onCycleItem,
}: OrderCardProps) {
  const { elapsed, level } = useElapsed(order);
  const status = STATUS_META[order.status];
  const type = TYPE_META[order.type];
  const terminal = order.status === "done" || order.status === "voided";
  const canStart = order.status === "new" || order.status === "urgent";
  const canBump = !terminal;
  const readyCount = order.items.filter((i) => i.status === "ready").length;
  const allReady = order.items.length > 0 && readyCount === order.items.length;
  const progress = terminal ? 0 : Math.min(elapsed / (LATE_AFTER_MIN * 60_000), 1) * 100;

  return (
    <li
      id={`card-${order.id}`}
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      aria-label={`Order ${order.num}, ${order.table || type.label}, ${status.label}`}
      onClick={() => onSelect(order.id)}
      onFocus={() => !selected && onSelect(order.id)}
      className={cn(
        "kds-accent relative flex select-none flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all",
        "motion-safe:animate-in motion-safe:fade-in-0",
        "focus-visible:outline-none",
        tone(status.tone),
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:border-foreground/25 hover:shadow-md",
        order.status === "urgent" && "kds-urgent",
        terminal && "opacity-60"
      )}
    >
      {/* Ageing bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-muted" aria-hidden>
        <div
          className={cn("kds-bar h-full transition-[width] duration-1000", tone(TIMER_TONE[level]))}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 px-3 pb-2 pt-3.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-xl font-bold leading-none tracking-tight">
                {order.num}
              </span>
              <span className="text-sm font-semibold">
                {order.table || type.label}
                {order.covers ? (
                  <span className="font-normal text-muted-foreground"> · {order.covers} pax</span>
                ) : null}
              </span>
            </div>
          </div>
          <Tip
            label={
              level === "ok"
                ? "On time"
                : level === "warn"
                  ? "Getting slow — check on this order"
                  : level === "late"
                    ? "Very late — prioritise now"
                    : "Timer stopped"
            }
          >
            <span
              className={cn(
                "kds-chip inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-sm font-bold tabular-nums",
                tone(TIMER_TONE[level]),
                level === "late" && "kds-late"
              )}
            >
              <Clock className="size-3.5 opacity-70" aria-hidden />
              {formatTimer(elapsed)}
            </span>
          </Tip>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "kds-chip rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              tone(type.tone)
            )}
          >
            {type.label}
          </span>
          <span
            className={cn(
              "kds-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              tone(status.tone)
            )}
          >
            {order.status === "urgent" && <AlertTriangle className="size-3" aria-hidden />}
            {status.label}
          </span>
          {!terminal && (
            <Tip label="Toggle course fire pacing">
              <button
                type="button"
                aria-pressed={!!order.isFired}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFire(order.id);
                }}
                className={cn(
                  "kds-chip kds-chip-btn inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  order.isFired ? tone("orange") : tone("slate")
                )}
              >
                <Flame className={cn("size-3", order.isFired && "animate-pulse")} aria-hidden />
                {order.isFired ? "Fired" : "Fire"}
              </button>
            </Tip>
          )}
          {allReady && !terminal && (
            <span
              className={cn(
                "kds-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                tone("green")
              )}
            >
              <CheckCircle2 className="size-3" aria-hidden />
              All ready
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <ul className="flex-1 divide-y divide-border border-t border-border px-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-2.5">
            <span className={cn("kds-text min-w-7 pt-px font-mono text-lg font-bold leading-tight", tone("amber"))}>
              ×{item.quantity}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-1.5 text-sm font-semibold leading-snug",
                  item.status === "ready" && "text-muted-foreground"
                )}
              >
                <span className="break-words">{item.name}</span>
                {item.course && (
                  <span className="rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                    {item.course}
                  </span>
                )}
              </div>
              {item.modifiers &&
                (item.isAllergy ? (
                  <div
                    className={cn(
                      "kds-chip mt-1 flex items-start gap-1.5 rounded-md px-2 py-1 text-xs font-semibold",
                      tone("red")
                    )}
                  >
                    <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span className="break-words">
                      <span className="uppercase">Allergy: </span>
                      {item.modifiers}
                    </span>
                  </div>
                ) : (
                  <div className="mt-0.5 break-words text-xs italic text-muted-foreground">
                    {item.modifiers}
                  </div>
                ))}
            </div>
            <ItemStatusButton
              name={item.name}
              status={item.status}
              onClick={() => onCycleItem(order.id, item.id)}
            />
          </li>
        ))}
      </ul>

      {/* Note */}
      {order.note && (
        <div
          className={cn(
            "kds-chip mx-3 mb-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs",
            tone("amber")
          )}
        >
          <Bell className="mt-px size-3.5 shrink-0" aria-hidden />
          <span className="break-words italic">{order.note}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          <div className="truncate">{order.server}</div>
          {!terminal && order.items.length > 0 && (
            <div className="font-mono tabular-nums">
              {readyCount}/{order.items.length} ready
            </div>
          )}
        </div>

        {terminal ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRecall(order.id);
            }}
            className={cn(actionBase, "border border-border text-foreground hover:bg-muted")}
          >
            <Undo2 className="size-4" aria-hidden />
            Recall
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Tip label={order.status === "urgent" ? "Remove urgent flag" : "Flag as urgent"}>
              <button
                type="button"
                aria-pressed={order.status === "urgent"}
                aria-label={order.status === "urgent" ? "Remove urgent flag" : "Flag as urgent"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleUrgent(order.id);
                }}
                className={cn(
                  actionBase,
                  "kds-chip kds-chip-btn w-10 px-0",
                  order.status === "urgent" ? "tone-red kds-solid" : "tone-slate"
                )}
              >
                <AlertTriangle className="size-4" aria-hidden />
              </button>
            </Tip>
            <Tip label="Void (cancel) this order">
              <button
                type="button"
                aria-label="Void order"
                onClick={(e) => {
                  e.stopPropagation();
                  onVoid(order.id);
                }}
                className={cn(actionBase, "kds-chip kds-chip-btn tone-slate w-10 px-0 hover:tone-red")}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </Tip>
            {canStart && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart(order.id);
                }}
                className={cn(actionBase, "kds-chip kds-chip-btn tone-blue")}
              >
                <Play className="size-4" aria-hidden />
                Start
              </button>
            )}
            {canBump && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBump(order.id);
                }}
                className={cn(
                  actionBase,
                  "tone-green",
                  allReady ? "kds-solid shadow-sm" : "kds-chip kds-chip-btn"
                )}
              >
                <CheckCheck className="size-4" aria-hidden />
                Bump
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
});

// ─── Panels & dialogs ───────────────────────────────────────────────────────

function PrepSummarySheet({
  open,
  station,
  onClose,
}: {
  open: boolean;
  station: Station;
  onClose: () => void;
}) {
  const orders = useKdsStore((s) => s.orders);
  const getAggregatedPrepItems = useKdsStore((s) => s.getAggregatedPrepItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => getAggregatedPrepItems(station), [orders, station, getAggregatedPrepItems]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ChefHat className="size-4 text-primary" aria-hidden />
            Prep view
            <span className="text-sm font-normal text-muted-foreground">
              · {STATION_CONFIG[station].label}
            </span>
          </SheetTitle>
          <SheetDescription>
            Pending and cooking quantities combined across active orders.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.length === 0 ? (
            <EmptyPanel icon={CheckCircle2} text="No active items to prepare" />
          ) : (
            items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className="mt-0.5 flex gap-3 font-mono text-xs">
                    {item.cookingCount > 0 && (
                      <span className={cn("kds-text", tone("amber"))}>{item.cookingCount} cooking</span>
                    )}
                    {item.pendingCount > 0 && (
                      <span className="text-muted-foreground">{item.pendingCount} pending</span>
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "kds-chip rounded-lg px-3 py-1 font-mono text-xl font-bold tabular-nums",
                    tone("amber")
                  )}
                >
                  ×{item.totalQuantity}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EmptyPanel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Icon className="mx-auto mb-3 size-9 opacity-30" aria-hidden />
      <p className="text-sm">{text}</p>
    </div>
  );
}

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
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <RefreshCcw className="size-4 text-muted-foreground" aria-hidden />
            Recall bumped orders
          </SheetTitle>
          <SheetDescription>Recently completed orders. Recall to reopen one.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {bumped.length === 0 ? (
            <EmptyPanel icon={CheckCircle2} text="No bumped orders yet" />
          ) : (
            bumped.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground/25"
              >
                <div className="min-w-0 flex-1">
                  <div className={cn("kds-text font-mono text-sm font-bold", tone("green"))}>{o.num}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.table} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                  </div>
                  {o.bumpedAt && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      Cook time {formatTimer(o.bumpedAt - o.createdAt)}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => onRecall(o.id)} className="h-9 gap-1.5">
                  <Undo2 className="size-4" aria-hidden />
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

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4 text-primary" aria-hidden />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Select an order (click it or use the arrow keys), then use a shortcut.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="flex shrink-0 gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EtaForm({
  orderNum,
  onSend,
  onCancel,
}: {
  orderNum?: string;
  onSend: (minutes: number) => void;
  onCancel: () => void;
}) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitCustom = () => {
    const n = Number(custom);
    if (!Number.isInteger(n) || n < 1 || n > 180) {
      setError("Enter a whole number between 1 and 180.");
      return;
    }
    onSend(n);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Send ETA to hub</DialogTitle>
        <DialogDescription>
          How many minutes until order {orderNum ? `#${orderNum}` : ""} is ready?
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-3 gap-2">
        {[2, 5, 10, 15, 20, 30].map((m) => (
          <Button key={m} variant="outline" className="h-12 text-base font-semibold" onClick={() => onSend(m)}>
            {m} min
          </Button>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            placeholder="Custom minutes…"
            aria-label="Custom ETA in minutes"
            aria-invalid={!!error}
            className="h-10"
          />
          <Button onClick={submitCustom} disabled={!custom} className="h-10">
            Send
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className={cn(
        "kds-chip flex shrink-0 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-2 text-sm",
        tone("blue")
      )}
    >
      <Info className="size-4 shrink-0" aria-hidden />
      <p className="flex-1">
        <strong>Quick start:</strong> tap an order to select it, then <strong>Start</strong> and{" "}
        <strong>Bump</strong> when it&apos;s ready. Tap the circle on each item to track progress. Bumped
        by mistake? Use <strong>Undo</strong> in the notification.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        className="rounded p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── Main KDS page ──────────────────────────────────────────────────────────

export default function KDSPage() {
  const orders = useKdsStore((s) => s.orders);
  const station = useKdsStore((s) => s.assignedStation);
  const setStation = useKdsStore((s) => s.setAssignedStation);
  const autoPrintKds = usePosStore((s) => s.settings.kitchenTicketConfig.autoPrintKds);

  const [theme, setTheme] = useThemePreference();
  const online = useOnline();

  const [operator, setOperator] = useState("");
  const [etaTarget, setEtaTarget] = useState<string | null>(null);
  const [bumped, setBumped] = useState<Order[]>([]);
  const bumpedRef = useRef<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [sort, setSort] = usePersistentState<SortKey>("kds:sort", "time_asc");
  const [cols, setCols] = usePersistentState<number>("kds:cols", 3);
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("kds:sound", true);
  const [tipDismissed, setTipDismissed, prefsReady] = usePersistentState<boolean>("kds:tip-dismissed", false);
  const [search, setSearch] = useState("");
  const [recallOpen, setRecallOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const voidTarget = voidTargetId ? orders.find((o) => o.id === voidTargetId) : undefined;
  const overlayOpen = recallOpen || prepOpen || shortcutsOpen || !!voidTargetId || !!etaTarget;

  useEffect(() => {
    bumpedRef.current = bumped;
  }, [bumped]);

  // Operator name (assigned from the hub)
  useEffect(() => {
    try {
      setOperator(localStorage.getItem("ASSIGNED_USER_NAME") || "");
    } catch {
      /* ignore */
    }
    const handler = (e: Event) => setOperator((e as CustomEvent).detail?.userName || "");
    window.addEventListener("assignment-updated", handler);
    return () => window.removeEventListener("assignment-updated", handler);
  }, []);

  // ETA queries from the hub
  useEffect(() => {
    const handler = (e: Event) => {
      const orderId = (e as CustomEvent).detail?.orderId as string | undefined;
      if (!orderId) return;
      setEtaTarget(orderId);
      const o = getOrder(orderId);
      toast.info(`ETA requested${o ? ` for #${o.num}` : ""}`, {
        description: "The hub is asking for an ETA",
        duration: 5000,
      });
    };
    window.addEventListener("order-eta-query", handler);
    return () => window.removeEventListener("order-eta-query", handler);
  }, []);

  // Fullscreen state
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Browsers block audio until a user gesture — unlock it on first interaction.
  useEffect(() => {
    const unlock = () => {
      void getAudioCtx()?.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // New-order detection by id (not by count) → chime + screen-reader announcement
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(orders.map((o) => o.id));
      return;
    }
    const seen = seenIds.current;
    const fresh = orders.filter(
      (o) => !seen.has(o.id) && (station === "all" || o.station === station)
    );
    orders.forEach((o) => seen.add(o.id));
    if (fresh.length) {
      if (soundEnabled) playOrderChime();
      setAnnouncement(
        `${fresh.length} new order${fresh.length > 1 ? "s" : ""}: ${fresh.map((o) => o.num).join(", ")}`
      );
    }
  }, [orders, station, soundEnabled]);

  // ── Derived data ──
  const stationOrders = useMemo(
    () => (station === "all" ? orders : orders.filter((o) => o.station === station)),
    [orders, station]
  );

  const stats = useMemo(() => {
    const s: Record<OrderStatus | "active", number> = {
      new: 0,
      in_progress: 0,
      done: 0,
      urgent: 0,
      voided: 0,
      active: 0,
    };
    for (const o of stationOrders) {
      s[o.status]++;
      if (isActiveStatus(o.status)) s.active++;
    }
    return s;
  }, [stationOrders]);

  const stationCounts = useMemo(() => {
    const c: Record<Station, number> = { all: 0, hot: 0, cold: 0, grill: 0, dessert: 0, bar: 0 };
    for (const o of orders) {
      if (!isActiveStatus(o.status)) continue;
      c.all++;
      if (o.station in c) c[o.station]++;
    }
    return c;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = stationOrders.filter((o) => {
      if (!matchesFilter(o.status, filter)) return false;
      if (!q) return true;
      return (
        o.num.toLowerCase().includes(q) ||
        o.table.toLowerCase().includes(q) ||
        (o.server ?? "").toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
    const priority: Record<OrderStatus, number> = { urgent: 0, new: 1, in_progress: 2, done: 3, voided: 4 };
    list.sort((a, b) => {
      if (sort === "time_desc") return b.createdAt - a.createdAt;
      if (sort === "priority") return priority[a.status] - priority[b.status] || a.createdAt - b.createdAt;
      if (sort === "table") return a.table.localeCompare(b.table, undefined, { numeric: true }) || a.createdAt - b.createdAt;
      return a.createdAt - b.createdAt;
    });
    return list;
  }, [stationOrders, filter, search, sort]);

  const avgTime = useMemo(() => {
    const recent = bumped.filter((o) => o.bumpedAt).slice(0, 20);
    if (!recent.length) return null;
    return formatTimer(recent.reduce((a, o) => a + (o.bumpedAt! - o.createdAt), 0) / recent.length);
  }, [bumped]);

  // Drop selection if the order is no longer visible
  useEffect(() => {
    if (selectedId && !visibleOrders.some((o) => o.id === selectedId)) setSelectedId(null);
  }, [visibleOrders, selectedId]);

  // ── Actions (all read fresh state, so their identity stays stable) ──
  const startOrder = useCallback((id: string) => {
    const o = getOrder(id);
    if (!o) return;
    useKdsStore.getState().updateOrderStatus(id, "in_progress");
    updateOrderStatusInKitchen(id, "in_progress");
    toast.info(`Order ${o.num} started`, { description: `${o.table} · Begin cooking`, duration: 2500 });
  }, []);

  const recallOrder = useCallback((id: string) => {
    const store = useKdsStore.getState();
    const stillInStore = store.orders.some((o) => o.id === id);
    if (stillInStore) {
      store.recallOrder(id);
    } else {
      const snapshot = bumpedRef.current.find((x) => x.id === id);
      if (snapshot) store.addOrder({ ...snapshot, status: "in_progress", bumpedAt: undefined });
    }
    setBumped((prev) => prev.filter((x) => x.id !== id));
    updateOrderStatusInKitchen(id, "in_progress");
    toast("Order recalled", {
      description: "Moved back to Cooking",
      icon: <Undo2 className="size-4" />,
      duration: 2500,
    });
  }, []);

  const bumpOrder = useCallback(
    (id: string) => {
      const o = getOrder(id);
      if (!o) return;
      const bumpedAt = Date.now();
      useKdsStore.getState().bumpOrder(id);
      updateOrderStatusInKitchen(id, "done");
      setBumped((prev) =>
        [{ ...o, status: "done", bumpedAt } as Order, ...prev.filter((x) => x.id !== id)].slice(0, 50)
      );
      toast.success(`Order ${o.num} bumped`, {
        description: `${o.table} · Ready for service`,
        duration: 6000,
        action: { label: "Undo", onClick: () => recallOrder(id) },
      });
    },
    [recallOrder]
  );

  const voidOrder = useCallback((id: string) => {
    const o = getOrder(id);
    useKdsStore.getState().updateOrderStatus(id, "voided");
    updateOrderStatusInKitchen(id, "voided");
    if (o) toast.error(`Order ${o.num} voided`, { description: `${o.table} · Order cancelled`, duration: 3000 });
    setVoidTargetId(null);
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleUrgent = useCallback((id: string) => {
    const o = getOrder(id);
    if (!o || !isActiveStatus(o.status)) return;
    const next: OrderStatus =
      o.status === "urgent" ? (o.items.some((i) => i.status !== "pending") ? "in_progress" : "new") : "urgent";
    useKdsStore.getState().updateOrderStatus(id, next);
    updateOrderStatusInKitchen(id, next);
    if (next === "urgent") {
      toast.warning(`Order ${o.num} marked urgent`, { description: "Highlighted for the whole line", duration: 2500 });
    } else {
      toast(`Order ${o.num} urgent flag removed`, { duration: 2000 });
    }
  }, []);

  const toggleFire = useCallback((id: string) => useKdsStore.getState().toggleCourseFire(id), []);

  const cycleItemStatus = useCallback((orderId: string, itemId: string) => {
    const store = useKdsStore.getState();
    const o = store.orders.find((x) => x.id === orderId);
    const item = o?.items.find((i) => i.id === itemId);
    if (!o || !item) return;
    store.updateItemStatus(orderId, itemId, ITEM_STATUS_META[item.status].next);
    if (o.status === "new" || o.status === "urgent") {
      store.updateOrderStatus(orderId, "in_progress");
      updateOrderStatusInKitchen(orderId, "in_progress");
    }
  }, []);

  const handleSendEta = (minutes: number) => {
    if (!etaTarget) return;
    sendOrderEtaResponse(etaTarget, minutes);
    setEtaTarget(null);
    toast.success(`ETA sent to hub: ${minutes} min`);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      document.documentElement
        .requestFullscreen?.()
        .catch(() => toast.error("Fullscreen isn't available in this browser"));
  };

  const toggleAutoPrint = () => {
    const next = !usePosStore.getState().settings.kitchenTicketConfig.autoPrintKds;
    usePosStore.getState().updateKitchenTicketConfig({ autoPrintKds: next });
    toast.info(`Auto-print ${next ? "enabled" : "disabled"}`, {
      description: next ? "New tickets will print automatically" : "Tickets will no longer auto-print",
      icon: <Printer className="size-4" />,
    });
  };

  // Dev-only helper so the board can be exercised without the hub
  const addTestOrder = () => {
    const stamp = Date.now();
    const pool = ["hot", "cold", "grill", "dessert", "bar"] as const;
    const stationPick = station === "all" ? pool[Math.floor(Math.random() * pool.length)] : station;
    const demo = {
      id: `test-${stamp}`,
      num: `T-${100 + Math.floor(Math.random() * 900)}`,
      type: "dine",
      status: "new",
      table: `Table ${1 + Math.floor(Math.random() * 20)}`,
      covers: 2,
      server: "Demo",
      station: stationPick,
      createdAt: stamp,
      isFired: false,
      note: "Demo order",
      items: [
        { id: `i1-${stamp}`, name: "Margherita Pizza", quantity: 1, status: "pending", course: "C1" },
        { id: `i2-${stamp}`, name: "Caesar Salad", quantity: 2, status: "pending", modifiers: "No croutons — nut allergy", isAllergy: true },
      ],
    } as unknown as Order;
    useKdsStore.getState().addOrder(demo);
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (t?.closest('[role="dialog"],[role="alertdialog"],[role="listbox"],[role="menu"]')) return;
      if (overlayOpen) return;

      const onControl = !!t?.closest("button,a,[role='button']");
      const sel = selectedId ? visibleOrders.find((o) => o.id === selectedId) : undefined;

      switch (e.key) {
        case " ":
        case "Enter":
        case "b":
        case "B": {
          if (onControl && (e.key === " " || e.key === "Enter")) return;
          if (!sel || !isActiveStatus(sel.status)) return;
          e.preventDefault();
          if (!matchesFilter("done", filter)) {
            const idx = visibleOrders.findIndex((o) => o.id === sel.id);
            const next = visibleOrders[idx + 1] ?? visibleOrders[idx - 1];
            setSelectedId(next?.id ?? null);
          }
          bumpOrder(sel.id);
          return;
        }
        case "s":
        case "S":
          if (sel && (sel.status === "new" || sel.status === "urgent")) startOrder(sel.id);
          return;
        case "u":
        case "U":
          if (sel) toggleUrgent(sel.id);
          return;
        case "Delete":
          if (sel) setVoidTargetId(sel.id);
          return;
        case "r":
        case "R":
          setRecallOpen(true);
          return;
        case "/":
        case "f":
        case "F":
          e.preventDefault();
          searchRef.current?.focus();
          return;
        case "?":
          setShortcutsOpen(true);
          return;
        case "Escape":
          setSelectedId(null);
          return;
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowDown":
        case "ArrowUp": {
          if (!visibleOrders.length) return;
          e.preventDefault();
          const vertical = e.key === "ArrowDown" || e.key === "ArrowUp";
          const perRow = window.matchMedia("(min-width:1024px)").matches
            ? cols
            : window.matchMedia("(min-width:640px)").matches
              ? 2
              : 1;
          const step = vertical ? perRow : 1;
          const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
          const idx = visibleOrders.findIndex((o) => o.id === selectedId);
          const target =
            idx === -1
              ? visibleOrders[0]
              : visibleOrders[Math.min(Math.max(idx + dir * step, 0), visibleOrders.length - 1)];
          setSelectedId(target.id);
          const el = document.getElementById(`card-${target.id}`);
          el?.focus({ preventScroll: true });
          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, selectedId, visibleOrders, filter, cols, bumpOrder, startOrder, toggleUrgent]);

  const filterCount = (f: Filter) => (f === "all" ? stationOrders.length : stats[f]);
  const filtersActive = filter !== "active" || !!search;
  const SelectedStationIcon = STATION_CONFIG[station].icon;

  return (
    <TooltipProvider delayDuration={250}>
      <style>{KDS_STYLES}</style>

      <div className="flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Screen-reader announcements for new orders */}
        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        {/* ── Top bar ── */}
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className={cn("kds-chip grid size-9 place-items-center rounded-lg", tone("amber"))}>
              <ChefHat className="size-5" aria-hidden />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-tight">Kitchen Display</h1>
              <p className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <SelectedStationIcon className="size-3" aria-hidden />
                {STATION_CONFIG[station].label}
                {operator && (
                  <>
                    <span aria-hidden>·</span>
                    <Users className="size-3" aria-hidden />
                    {operator}
                  </>
                )}
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-7 sm:block" />
          <LiveClock />
          <Separator orientation="vertical" className="hidden h-7 md:block" />

          <div className="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Order counts">
            {stats.urgent > 0 && <StatPill count={stats.urgent} label="Urgent" tone="red" pulse />}
            <StatPill count={stats.new} label="New" tone="amber" />
            <StatPill count={stats.in_progress} label="Cooking" tone="blue" />
            <StatPill count={stats.done} label="Done" tone="green" />
          </div>

          <div className="flex-1" />

          {avgTime && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <Clock className="size-3.5" aria-hidden />
              Avg cook time
              <span className="font-mono text-sm font-bold tabular-nums text-foreground">{avgTime}</span>
            </span>
          )}

          <div className="flex items-center gap-0.5">
            <IconAction
              label={soundEnabled ? "Mute new-order chime" : "Unmute new-order chime"}
              pressed={soundEnabled}
              active={soundEnabled}
              onClick={() => {
                setSoundEnabled((v) => !v);
                if (!soundEnabled) playOrderChime();
              }}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </IconAction>

            <Tip label="Aggregated item totals across active orders">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPrepOpen(true)}
                className="h-9 gap-1.5 px-2.5 text-xs font-semibold"
              >
                <ChefHat className="size-4" aria-hidden />
                <span className="hidden lg:inline">Prep view</span>
                <span className="sr-only lg:hidden">Prep view</span>
              </Button>
            </Tip>

            <IconAction
              label={autoPrintKds ? "Auto-print is on — turn off" : "Auto-print is off — turn on"}
              pressed={autoPrintKds}
              active={autoPrintKds}
              onClick={toggleAutoPrint}
            >
              <Printer className="size-4" />
            </IconAction>

            <IconAction label="Recall bumped orders (R)" onClick={() => setRecallOpen(true)} badge={bumped.length}>
              <Undo2 className="size-4" />
            </IconAction>

            <IconAction label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="size-4" />
            </IconAction>

            <ThemeToggle pref={theme} onChange={setTheme} />

            <IconAction
              label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </IconAction>

            {process.env.NODE_ENV !== "production" && (
              <IconAction label="Add demo order (dev only)" onClick={addTestOrder}>
                <Plus className="size-4" />
              </IconAction>
            )}
          </div>
        </header>

        {/* ── Alerts ── */}
        {!online && (
          <div
            role="alert"
            className={cn(
              "kds-chip flex shrink-0 items-center justify-center gap-2 rounded-none border-x-0 border-t-0 py-1.5 text-xs font-semibold",
              tone("amber")
            )}
          >
            <WifiOff className="size-3.5" aria-hidden />
            You&apos;re offline — new orders won&apos;t arrive and changes may not sync until the connection returns.
          </div>
        )}

        {stats.urgent > 0 && (
          <div
            role="alert"
            className={cn(
              "kds-chip flex shrink-0 items-center justify-center gap-2 rounded-none border-x-0 border-t-0 py-1.5 text-xs font-bold uppercase tracking-wider",
              tone("red")
            )}
          >
            <ShieldAlert className="size-4" aria-hidden />
            {stats.urgent} urgent order{stats.urgent > 1 ? "s" : ""} — immediate attention required
          </div>
        )}

        {prefsReady && !tipDismissed && <OnboardingBanner onDismiss={() => setTipDismissed(true)} />}

        {/* ── Station switcher ── */}
        <nav
          aria-label="Stations"
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-3 py-1.5"
        >
          {STATION_ORDER.map((s) => {
            const cfg = STATION_CONFIG[s];
            const Icon = cfg.icon;
            const active = station === s;
            return (
              <Tip key={s} label={cfg.desc}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStation(s)}
                  className={cn(
                    "relative flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4", tone(cfg.tone), active && "kds-text")} aria-hidden />
                  <span className="hidden sm:inline">{cfg.label}</span>
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] font-bold tabular-nums",
                      active ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stationCounts[s]}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className={cn("kds-bar absolute inset-x-3 bottom-0 h-0.5 rounded-full", tone(cfg.tone))}
                    />
                  )}
                </button>
              </Tip>
            );
          })}
        </nav>

        {/* ── Filters / sort / layout / search ── */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background px-3 py-2">
          <div className="flex items-center gap-1 overflow-x-auto" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const count = filterCount(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    f.tone && tone(f.tone),
                    active
                      ? f.tone
                        ? "kds-chip"
                        : "border-foreground bg-foreground text-background"
                      : cn(
                          "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          f.tone && "kds-text"
                        )
                  )}
                >
                  {f.label}
                  <span className="font-mono tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sort orders" className="h-9 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_asc">Oldest first</SelectItem>
              <SelectItem value="time_desc">Newest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="table">By table</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Columns">
            <span className="mr-1 text-xs text-muted-foreground">Columns</span>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={cols === n}
                aria-label={`${n} columns`}
                onClick={() => setCols(n)}
                className={cn(
                  "size-9 rounded-lg border text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  cols === n
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="relative ml-auto w-full sm:w-[260px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (search) setSearch("");
                  else e.currentTarget.blur();
                }
              }}
              placeholder="Search order, table, item…"
              aria-label="Search orders"
              className="h-9 pl-8 pr-8 text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Order grid ── */}
        <main
          className="flex-1 overflow-auto p-3 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
        >
          {visibleOrders.length === 0 ? (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
              <div className="mb-4 grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
                <ChefHat className="size-8" aria-hidden />
              </div>
              <h2 className="text-lg font-bold">
                {filtersActive && stationOrders.length > 0 ? "No orders match" : "All clear"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {filtersActive && stationOrders.length > 0
                  ? "Nothing matches the current filter or search."
                  : "No active orders right now. New tickets will appear here automatically."}
              </p>
              {filtersActive && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilter("active");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <ul
              aria-label="Orders"
              style={{ "--kds-cols": cols } as CSSProperties}
              className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--kds-cols),minmax(0,1fr))]"
            >
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  selected={order.id === selectedId}
                  onSelect={setSelectedId}
                  onStart={startOrder}
                  onBump={bumpOrder}
                  onVoid={setVoidTargetId}
                  onRecall={recallOrder}
                  onToggleUrgent={toggleUrgent}
                  onToggleFire={toggleFire}
                  onCycleItem={cycleItemStatus}
                />
              ))}
            </ul>
          )}
        </main>

        {/* ── Status bar ── */}
        <footer className="flex h-10 shrink-0 items-center gap-4 overflow-x-auto border-t border-border bg-card px-4 text-xs text-muted-foreground">
          <div className="hidden items-center gap-4 md:flex">
            {[
              ["Space", "Bump"],
              ["S", "Start"],
              ["U", "Urgent"],
              ["Del", "Void"],
              ["R", "Recall"],
              ["?", "Help"],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5 whitespace-nowrap">
                <Kbd>{key}</Kbd>
                {label}
              </span>
            ))}
          </div>
          <div className="flex-1" />
          <span className="whitespace-nowrap font-mono tabular-nums">
            {visibleOrders.length} of {stationOrders.length} orders
          </span>
          {selectedId && (
            <span className={cn("kds-text hidden font-mono font-semibold sm:inline", tone("blue"))}>
              {orders.find((o) => o.id === selectedId)?.num} selected
            </span>
          )}
          <span
            className={cn("flex items-center gap-1.5 font-mono font-semibold", tone(online ? "green" : "amber"), "kds-text")}
            role="status"
          >
            <span className={cn("kds-bar size-2 rounded-full", online && "kds-blink")} aria-hidden />
            {online ? "LIVE" : "OFFLINE"}
          </span>
        </footer>
      </div>

      {/* ── Panels & dialogs ── */}
      <PrepSummarySheet open={prepOpen} station={station} onClose={() => setPrepOpen(false)} />
      <RecallSheet
        open={recallOpen}
        bumped={bumped}
        onClose={() => setRecallOpen(false)}
        onRecall={recallOrder}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <AlertDialog open={!!voidTargetId} onOpenChange={(v) => !v && setVoidTargetId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" aria-hidden />
              Void order {voidTarget?.num}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cancels order <strong className="text-foreground">{voidTarget?.num}</strong> for{" "}
              <strong className="text-foreground">{voidTarget?.table}</strong> (
              {voidTarget?.items.length ?? 0} item{(voidTarget?.items.length ?? 0) !== 1 ? "s" : ""}). You can
              recall it afterwards, but the kitchen will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidTargetId && voidOrder(voidTargetId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Void order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!etaTarget} onOpenChange={(v) => !v && setEtaTarget(null)}>
        <DialogContent className="max-w-sm">
          <EtaForm
            orderNum={etaTarget ? orders.find((o) => o.id === etaTarget)?.num : undefined}
            onSend={handleSendEta}
            onCancel={() => setEtaTarget(null)}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}