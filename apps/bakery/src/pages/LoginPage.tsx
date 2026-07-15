"use client";

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Lock,
  User,
  Loader2,
  Zap,
  ShieldCheck,
  Activity,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/providers/auth-context";
import { isOfflineMode, isTauri } from "@/lib/sdk";
import { resetBakeryDevice } from "@/utils/reset";

// ─────────────────────────────────────────────────────────────
// Design tokens — a warm espresso/caramel palette in place of
// the generic amber-500 defaults, for a more crafted, premium
// "artisan kitchen terminal" feel.
// ─────────────────────────────────────────────────────────────
const ESPRESSO = "#221709";
const ESPRESSO_2 = "#2E2010";
const CARAMEL = "#C98A3E";
const CARAMEL_DARK = "#B27530";
const CREAM = "#FBF7F1";
const CREAM_LINE = "#EDE3D2";

const BakeryLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-black/5 shrink-0 bg-white">
      <img
        src="/logo.jpeg"
        alt="Scryme Bakery"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="leading-none">
      <div
        className="text-[15px] font-black tracking-tight"
        style={{ color: ESPRESSO }}
      >
        SCRYME<span style={{ color: CARAMEL_DARK }}> BAKERY</span>
      </div>
    </div>
  </div>
);

// Signature element — a live-feeling ticker of kitchen/terminal
// activity, standing in for the marketing hero content you'd see
// on a consumer app. Fits the "operations terminal" framing.
const opsEntries = [
  { id: "OVN-01", label: "Sourdough batch · Baking", status: "218°C" },
  { id: "MIX-02", label: "Croissant dough · Mixing", status: "Active" },
  { id: "PRF-01", label: "Brioche · Proofing", status: "34°C" },
  { id: "ORD-1182", label: "Wholesale order · Packed", status: "Dispatched" },
  { id: "OVN-03", label: "Baguette batch · Cooling", status: "Rack 4" },
  { id: "ORD-1183", label: "Café order · Picking", status: "In progress" },
  { id: "MIX-01", label: "Rye dough · Resting", status: "12 min left" },
];

const OpsRow = ({
  id,
  label,
  status,
}: {
  id: string;
  label: string;
  status: string;
}) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-white/[0.06]">
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: CARAMEL }}
      />
      <span className="font-mono text-[11px] text-white/70 tracking-wide shrink-0">
        {id}
      </span>
      <span className="text-[11px] text-white/40 truncate">{label}</span>
    </div>
    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 shrink-0">
      {status}
    </span>
  </div>
);

const KitchenOpsLedger = () => {
  const doubled = [...opsEntries, ...opsEntries];
  return (
    <div className="relative h-[190px] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
      <div className="scryme-ops-track">
        {doubled.map((e, i) => (
          <OpsRow key={`${e.id}-${i}`} {...e} />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-8"
        style={{ background: `linear-gradient(${ESPRESSO}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
        style={{ background: `linear-gradient(transparent, ${ESPRESSO})` }}
      />
      <style>{`
        .scryme-ops-track { animation: scryme-ops-scroll 24s linear infinite; }
        @keyframes scryme-ops-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scryme-ops-track { animation: none; }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-xs text-white/40 mt-1 font-mono tracking-wide">
      {label}
    </span>
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginLocal, sso, isLoading } = useAuth();

  const [cardId, setCardId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [isLocalMode, setIsLocalMode] = useState(isOfflineMode());

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      if (isLocalMode) {
        await loginLocal(localEmail, localPassword);
      } else {
        await login({ cardId, pin });
      }
      toast.success("Authenticated successfully");
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSso = async () => {
    setIsLoggingIn(true);
    try {
      await sso();
      toast.success("Authenticated via Dashboard SSO");
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error("SSO Authentication failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleLocalMode = () => {
    const newMode = !isLocalMode;
    setIsLocalMode(newMode);
    if (newMode) {
      localStorage.setItem("bakery_local_mode", "true");
    } else {
      localStorage.removeItem("bakery_local_mode");
    }
  };

  const ringStyle = {
    "--tw-ring-color": `${CARAMEL}40`,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ backgroundColor: CREAM }}
    >
      {/* ── Left Panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-10">
            <BakeryLogo />
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                color: CARAMEL_DARK,
                borderColor: CREAM_LINE,
                backgroundColor: "#FFFFFF",
              }}
            >
              {isLocalMode ? "Local Mode" : "Terminal Node"}
            </span>
          </div>

          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1
              className="text-[1.75rem] font-black leading-tight tracking-tight"
              style={{ color: ESPRESSO }}
            >
              {isLocalMode ? "Local Login" : "Baker Sign In"}
            </h1>
            <p className="text-sm mt-2" style={{ color: "#8A7960" }}>
              {isLocalMode
                ? "Authenticate to access the local bakery system."
                : "Authenticate to begin production."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {isLocalMode ? (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="local-email"
                    className="text-sm font-medium"
                    style={{ color: ESPRESSO }}
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: CARAMEL }}
                    />
                    <Input
                      id="local-email"
                      type="email"
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      placeholder="admin@bakery.local"
                      className="pl-10 h-11 rounded-lg focus-visible:ring-[3px]"
                      style={{ borderColor: CREAM_LINE, ...ringStyle }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="local-password"
                    className="text-sm font-medium"
                    style={{ color: ESPRESSO }}
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: CARAMEL }}
                    />
                    <Input
                      id="local-password"
                      type={showPin ? "text" : "password"}
                      value={localPassword}
                      onChange={(e) => setLocalPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 rounded-lg focus-visible:ring-[3px]"
                      style={{ borderColor: CREAM_LINE, ...ringStyle }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = CARAMEL_DARK)
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="card-id"
                    className="text-sm font-medium"
                    style={{ color: ESPRESSO }}
                  >
                    Baker ID
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: CARAMEL }}
                    />
                    <Input
                      id="card-id"
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      placeholder="Enter your Card ID"
                      className="pl-10 h-11 rounded-lg focus-visible:ring-[3px]"
                      style={{ borderColor: CREAM_LINE, ...ringStyle }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pin"
                    className="text-sm font-medium"
                    style={{ color: ESPRESSO }}
                  >
                    PIN
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: CARAMEL }}
                    />
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={20}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 rounded-lg font-mono tracking-[0.2em] focus-visible:ring-[3px]"
                      style={{ borderColor: CREAM_LINE, ...ringStyle }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = CARAMEL_DARK)
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] border-0"
                style={{ backgroundColor: ESPRESSO }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = ESPRESSO_2)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = ESPRESSO)
                }
                disabled={isLoggingIn || isLoading}
              >
                {isLoggingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLocalMode ? (
                  "Login"
                ) : (
                  "Sign In to Kitchen"
                )}
              </Button>

              {!isLocalMode && (
                <>
                  <div className="relative flex items-center gap-3 py-1">
                    <div
                      className="flex-1 h-px"
                      style={{ backgroundColor: CREAM_LINE }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: "#B3A88F" }}
                    >
                      Or fast access
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ backgroundColor: CREAM_LINE }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-lg font-medium"
                    style={{
                      borderColor: CREAM_LINE,
                      color: CARAMEL_DARK,
                      backgroundColor: "#FFFFFF",
                    }}
                    onClick={handleSso}
                    disabled={isLoggingIn || isLoading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Dashboard SSO
                  </Button>
                </>
              )}

              <button
                type="button"
                className="mt-3 text-xs transition-colors font-medium flex items-center justify-center gap-2"
                style={{ color: "#B3A88F" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = CARAMEL_DARK)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = "#B3A88F")}
                onClick={toggleLocalMode}
              >
                <Globe className="h-3 w-3" />
                {isLocalMode ? "Back to Cloud Mode" : "Use Local Mode"}
              </button>

              {isTauri() && (
                <button
                  type="button"
                  onClick={resetBakeryDevice}
                  className="mt-1 text-[10px] text-gray-300 hover:text-red-500 transition-colors font-medium flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  Reset Device
                </button>
              )}
            </div>
          </form>

          {/* Trust / status row */}
          <div
            className="mt-10 pt-6 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest"
            style={{ borderTop: `1px solid ${CREAM_LINE}`, color: "#B3A88F" }}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Secure Node
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" /> System Nominal
            </span>
          </div>
          <p
            className="text-center mt-3 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "#CFC4AA" }}
          >
            &copy; {new Date().getFullYear()} Scryme Bakery ERP System
          </p>
        </div>
      </div>

      {/* ── Right Panel: status / hero ── */}
      <div
        className="hidden lg:flex flex-1 text-white relative overflow-hidden flex-col justify-between p-12"
        style={{ backgroundColor: ESPRESSO }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div
          className="absolute top-[-100px] right-[-100px] w-[380px] h-[380px] rounded-full blur-[90px] pointer-events-none"
          style={{ backgroundColor: `${CARAMEL}1A` }}
        />
        <div
          className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
          style={{ backgroundColor: `${CARAMEL}14` }}
        />

        {/* Top status pill */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: `${CARAMEL}14`,
              borderColor: `${CARAMEL}33`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: CARAMEL }}
            />
            <span
              className="text-xs font-mono tracking-wide"
              style={{ color: "#E7C99A" }}
            >
              Terminal network online
            </span>
          </div>
          <p className="text-[11px] font-mono text-white/30 mt-3 tracking-wide">
            NODE-04 · KITCHEN EAST WING
          </p>
        </div>

        {/* Main copy */}
        <div className="relative z-10 mt-auto">
          <h2 className="text-4xl font-black leading-tight tracking-tight mb-4">
            Precision,
            <br />
            batch by batch.
          </h2>
          <p className="text-base text-white/50 leading-relaxed max-w-sm mb-8">
            Every terminal ties directly into live kitchen operations — orders,
            ovens, and proofing schedules in a single secure feed.
          </p>

          <KitchenOpsLedger />

          {/* Stats row */}
          <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
            <StatCard value="482" label="Orders today" />
            <StatCard value="99.98%" label="Uptime" />
            <StatCard value="6" label="Active terminals" />
          </div>
        </div>
      </div>
    </div>
  );
}
