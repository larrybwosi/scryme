import React, { useState, useEffect } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Receipt,
  Store,
  Users,
  HardDrive,
  Layers,
  Copy,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface PlanConfig {
  id: "growth" | "scale" | "enterprise";
  name: string;
  badge: string;
  tagline: string;
  usd: {
    monthly: number;
    annualMonthly: number;
    annualTotal: number;
  };
  kes: {
    monthly: number;
    annualMonthly: number;
    annualTotal: number;
  };
  quotas: {
    locations: string;
    orders: string;
    storage: string;
    users: string;
    apiCalls: string;
  };
  modules: string[];
  features: string[];
  recommended?: boolean;
}

export const PLAN_TIERS: PlanConfig[] = [
  {
    id: "growth",
    name: "Growth Tier",
    badge: "Most Popular",
    tagline: "For expanding multi-location bakeries, retail stores & regional hubs",
    recommended: true,
    usd: {
      monthly: 599,
      annualMonthly: 499,
      annualTotal: 5988,
    },
    kes: {
      monthly: 78000,
      annualMonthly: 65000,
      annualTotal: 780000,
    },
    quotas: {
      locations: "Up to 10 Locations",
      orders: "50,000 / month",
      storage: "50 GB Cloud Storage",
      users: "Unlimited Staff",
      apiCalls: "50,000 / day",
    },
    modules: [
      "Point of Sale & Offline Barcode Sync",
      "Bakery Recipe & Production Engine",
      "Inventory Integrity & Batch Splitting",
      "Automated Invoicing & M-Pesa Reconciliation",
      "Staff Scheduling & Role Permissions",
    ],
    features: [
      "14-Day Full Access Trial included",
      "M-Pesa STK Push direct reconciliation",
      "Multi-terminal POS hardware support",
      "Standard Email & Chat Support (99.5% uptime)",
    ],
  },
  {
    id: "scale",
    name: "Scale Tier",
    badge: "Enterprise Ready",
    tagline: "For high-volume retail franchises, wholesale distributors & enterprise chains",
    usd: {
      monthly: 1799,
      annualMonthly: 1499,
      annualTotal: 17988,
    },
    kes: {
      monthly: 234000,
      annualMonthly: 195000,
      annualTotal: 2340000,
    },
    quotas: {
      locations: "Unlimited Locations",
      orders: "250,000 / month",
      storage: "250 GB Cloud Storage",
      users: "Unlimited Staff",
      apiCalls: "250,000 / day",
    },
    modules: [
      "Everything in Growth tier",
      "Automated Workflow Engine & Custom Webhooks",
      "Inter-branch Stock Transfers & Logistics",
      "Custom ERP Connectors (SAP / NetSuite Ingestion)",
      "WhatsApp Cloud API & CRM Communications",
      "Audit Trail & Compliance Archive",
    ],
    features: [
      "Dedicated Technical Account Engineer",
      "Zero-loss migration assistance (48-hr turnaround)",
      "Multi-currency financial consolidation",
      "Priority 24/7 Telephone & SLA Support (99.95% uptime)",
    ],
  },
];

export function OnboardingPage() {
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;
  const navigate = useNavigate();

  // Wizard Steps: 1: Plan, 2: Organization, 3: Payment, 4: Provisioning & Launch
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Currency & Billing Cadence
  const [currency, setCurrency] = useState<"KES" | "USD">(
    search?.currency === "USD" ? "USD" : "KES"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<"growth" | "scale">(
    search?.plan === "scale" ? "scale" : "growth"
  );

  // Organization Information
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [industry, setIndustry] = useState("Bakery & Food Production");
  const [primaryLocation, setPrimaryLocation] = useState("Nairobi HQ");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("0712345678");

  // Payment Checkout
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "bank">("mpesa");
  const [mpesaNumber, setMpesaNumber] = useState("0712345678");
  const [stkStatus, setStkStatus] = useState<
    "idle" | "dispatching" | "prompt_sent" | "authorizing" | "confirmed" | "failed"
  >("idle");
  const [stkCountdown, setStkCountdown] = useState(60);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [paymentCompletedAt, setPaymentCompletedAt] = useState("");

  // Provisioning steps simulation
  const [provisioningIndex, setProvisioningIndex] = useState(0);

  // Auto generate slug from orgName unless manually edited
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!isSlugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setOrgSlug(generated);
    }
  };

  const selectedPlan = PLAN_TIERS.find((p) => p.id === selectedPlanId) || PLAN_TIERS[0];

  const getPrice = (plan: PlanConfig) => {
    if (currency === "KES") {
      return billingCycle === "monthly" ? plan.kes.monthly : plan.kes.annualMonthly;
    }
    return billingCycle === "monthly" ? plan.usd.monthly : plan.usd.annualMonthly;
  };

  const getTotalAmount = () => {
    if (currency === "KES") {
      return billingCycle === "monthly" ? selectedPlan.kes.monthly : selectedPlan.kes.annualTotal;
    }
    return billingCycle === "monthly" ? selectedPlan.usd.monthly : selectedPlan.usd.annualTotal;
  };

  const formatMoney = (amount: number, curr = currency) => {
    if (curr === "KES") {
      return `KSh ${amount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // M-Pesa STK Push Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stkStatus === "prompt_sent" && stkCountdown > 0) {
      timer = setInterval(() => {
        setStkCountdown((prev) => {
          if (prev <= 1) {
            setStkStatus("failed");
            toast.error("STK prompt timed out. Please retry or pick another payment method.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stkStatus, stkCountdown]);

  // Handle STK Push Dispatch
  const handleSendStkPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaNumber.trim()) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }

    setStkStatus("dispatching");
    setTimeout(() => {
      setStkStatus("prompt_sent");
      setStkCountdown(60);
      toast.info("M-Pesa STK push dispatched! Enter your PIN on your mobile device.");
    }, 1200);
  };

  // Simulate PIN entered on handset
  const handleSimulatePinApproval = () => {
    setStkStatus("authorizing");
    setTimeout(() => {
      const randomReceipt = `NL${Math.floor(100000 + Math.random() * 900000)}X8`;
      const dateStr = new Date().toISOString();
      setReceiptCode(randomReceipt);
      setPaymentCompletedAt(dateStr);
      setStkStatus("confirmed");
      toast.success(`Payment verified! M-Pesa Receipt: ${randomReceipt}`);

      // Advance to Provisioning Step after brief delay
      setTimeout(() => {
        setStep(4);
        runProvisioningSequence();
      }, 1000);
    }, 1500);
  };

  // Handle Card Checkout
  const handleCardCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardHolder || !cardNumber || !cardExpiry || !cardCvc) {
      toast.error("Please fill in all credit card details");
      return;
    }

    setStkStatus("authorizing");
    setTimeout(() => {
      const randomReceipt = `CARD-${Math.floor(100000 + Math.random() * 900000)}`;
      const dateStr = new Date().toISOString();
      setReceiptCode(randomReceipt);
      setPaymentCompletedAt(dateStr);
      setStkStatus("confirmed");
      toast.success("Card payment processed and authorized!");

      setTimeout(() => {
        setStep(4);
        runProvisioningSequence();
      }, 800);
    }, 1400);
  };

  // Handle Bank Transfer Confirmation
  const handleBankConfirm = () => {
    const wireRef = `WIRE-SCRYME-${Math.floor(10000 + Math.random() * 90000)}`;
    setReceiptCode(wireRef);
    setPaymentCompletedAt(new Date().toISOString());
    setStkStatus("confirmed");
    toast.success(`Wire transfer commitment registered with reference ${wireRef}`);
    setStep(4);
    runProvisioningSequence();
  };

  // Automated Provisioning Checklist Simulation
  const provisioningSteps = [
    { title: "Allocating Isolated Tenant Data Partition", detail: "Configuring tenant schema and encryption keys" },
    { title: "Assigning Plan Quotas & Storage Limits", detail: `${selectedPlan.quotas.locations} · ${selectedPlan.quotas.orders}` },
    { title: "Activating Platform Modules", detail: selectedPlan.modules.slice(0, 3).join(", ") },
    { title: "Issuing Admin Credentials & Workspace Token", detail: "Generating cryptographic session & API access keys" },
  ];

  const runProvisioningSequence = () => {
    setProvisioningIndex(1);
    setTimeout(() => setProvisioningIndex(2), 900);
    setTimeout(() => setProvisioningIndex(3), 1800);
    setTimeout(() => {
      setProvisioningIndex(4);
      toast.success(`Workspace "${orgName || "Acme"}" is fully provisioned and ready!`);
    }, 2700);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Bar Header with Breadcrumbs & Step Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#E7E2D9] gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-9 h-9 rounded-xl bg-[#0F1B2E] flex items-center justify-center text-[#DDC49B] font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <span className="text-[#0F1B2E] font-bold text-lg tracking-tight block leading-none">
                Scryme
              </span>
              <span className="text-[10px] font-mono text-[#A9824C] uppercase tracking-wider block mt-0.5">
                Workspace Setup
              </span>
            </div>
          </Link>
          <span className="text-[#9AA6B2] hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-xs text-[#5B6B7C] font-medium hidden sm:inline">
            Step {step} of 4: {
              step === 1 ? "Select Subscription Plan" :
              step === 2 ? "Configure Organization" :
              step === 3 ? "Payment & Verification" :
              "Workspace Provisioning"
            }
          </span>
        </div>

        {/* Step Progression Indicators */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: "Plan" },
            { num: 2, label: "Organization" },
            { num: 3, label: "Payment" },
            { num: 4, label: "Launch" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              disabled={step < s.num || step === 4}
              onClick={() => s.num < step && setStep(s.num as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                step === s.num
                  ? "bg-[#0F1B2E] text-white shadow-sm"
                  : step > s.num
                  ? "bg-[#0F1B2E]/10 text-[#0F1B2E] hover:bg-[#0F1B2E]/15 cursor-pointer"
                  : "bg-transparent text-[#9AA6B2] cursor-not-allowed opacity-60"
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold bg-white/20">
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: PLAN & CADENCE SELECTION */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F1B2E] tracking-tight">
              Choose your platform plan
            </h1>
            <p className="text-sm text-[#5B6B7C] mt-2 leading-relaxed">
              Transparent, per-tenant subscription pricing with no per-user licensing fees.
              Every tier includes a full 14-day zero-risk trial.
            </p>

            {/* Currency & Billing Interval Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {/* Currency Selector */}
              <div className="flex items-center p-1 bg-[#EAE6DF]/70 rounded-lg border border-[#E7E2D9]">
                <button
                  type="button"
                  onClick={() => setCurrency("KES")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    currency === "KES"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  KSh (M-Pesa)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    currency === "USD"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  USD ($)
                </button>
              </div>

              {/* Billing Cycle Switch */}
              <div className="flex items-center p-1 bg-[#EAE6DF]/70 rounded-lg border border-[#E7E2D9]">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    billingCycle === "annual"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  <span>Annual</span>
                  <span className="text-[10px] text-[#A9824C] font-bold">Save 17%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Tier Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {PLAN_TIERS.map((tier) => {
              const isSelected = selectedPlanId === tier.id;
              const price = getPrice(tier);

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlanId(tier.id as any)}
                  className={`relative p-6 sm:p-8 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#A9824C] bg-white shadow-lg ring-1 ring-[#A9824C]/40"
                      : "border-[#E7E2D9] bg-white/70 hover:border-[#0F1B2E]/30 hover:bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-2xl font-semibold text-[#0F1B2E]">
                          {tier.name}
                        </h3>
                        {tier.recommended && (
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A9824C] font-semibold bg-[#A9824C]/10 px-2.5 py-0.5 rounded-full border border-[#A9824C]/20">
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[#A9824C] bg-[#A9824C] text-white"
                            : "border-[#C9C3B8]"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-[#5B6B7C] mt-1.5 min-h-[32px] leading-relaxed">
                      {tier.tagline}
                    </p>

                    {/* Price display */}
                    <div className="mt-5 pb-5 border-b border-[#E7E2D9]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl sm:text-4xl font-bold text-[#0F1B2E] tabular-nums tracking-tight">
                          {formatMoney(price)}
                        </span>
                        <span className="text-xs text-[#5B6B7C] font-medium">/ month</span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="text-[11px] text-[#A9824C] font-mono mt-1">
                          Billed annually ({formatMoney(currency === "KES" ? tier.kes.annualTotal : tier.usd.annualTotal)}/yr)
                        </p>
                      )}
                      <p className="text-[11px] text-[#4FA871] font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        14-day trial period · No charge until Day 14
                      </p>
                    </div>

                    {/* Quota Highlights */}
                    <div className="py-4 space-y-2 border-b border-[#E7E2D9]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA6B2] block">
                        Included Platform Quotas
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[#0F1B2E]">
                          <Store className="w-3.5 h-3.5 text-[#A9824C] shrink-0" />
                          <span className="font-medium">{tier.quotas.locations}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#0F1B2E]">
                          <Receipt className="w-3.5 h-3.5 text-[#A9824C] shrink-0" />
                          <span className="font-medium">{tier.quotas.orders}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#0F1B2E]">
                          <HardDrive className="w-3.5 h-3.5 text-[#A9824C] shrink-0" />
                          <span className="font-medium">{tier.quotas.storage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#0F1B2E]">
                          <Users className="w-3.5 h-3.5 text-[#A9824C] shrink-0" />
                          <span className="font-medium">{tier.quotas.users}</span>
                        </div>
                      </div>
                    </div>

                    {/* Included Modules & Features */}
                    <div className="pt-4 space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA6B2] block">
                        Core Systems & Features
                      </span>
                      <ul className="space-y-2 text-xs text-[#33404D]">
                        {tier.modules.map((m, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#4FA871] mt-0.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(tier.id as any);
                      setStep(2);
                    }}
                    className={`mt-6 w-full h-11 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-[#0F1B2E] hover:bg-[#16283F] text-white shadow-sm"
                        : "bg-[#EAE6DF] hover:bg-[#0F1B2E] text-[#0F1B2E] hover:text-white"
                    }`}
                  >
                    <span>Configure Organization on {tier.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Enterprise Contact Box */}
          <div className="p-6 rounded-xl border border-[#E7E2D9] bg-[#F4F1EA]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm text-[#0F1B2E]">Need a Dedicated Enterprise Cluster or Custom SLA?</h4>
              <p className="text-xs text-[#5B6B7C] mt-0.5">
                On-premise deployment, multi-region database failover, and custom SAP/Oracle ERP integration pipelines.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.info("Enterprise consultation request opened. Our solutions team will contact your team.");
                setSelectedPlanId("scale");
                setStep(2);
              }}
              className="px-4 py-2 text-xs font-semibold border border-[#0F1B2E]/20 hover:border-[#0F1B2E] bg-white rounded-lg text-[#0F1B2E] transition-colors whitespace-nowrap cursor-pointer"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE ORGANIZATION */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[#5B6B7C] hover:text-[#0F1B2E] font-medium flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change plan ({selectedPlan.name})
            </button>
            <h2 className="font-serif text-3xl font-medium text-[#0F1B2E] tracking-tight">
              Organization details
            </h2>
            <p className="text-sm text-[#5B6B7C] mt-1.5 leading-relaxed">
              Define your company workspace identity. This will configure your isolated tenant database,
              subdomain slug, and administrative permissions.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!orgName.trim() || !orgSlug.trim()) {
                toast.error("Please enter your organization name and subdomain slug");
                return;
              }
              setStep(3);
            }}
            className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E7E2D9] shadow-sm"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                Organization / Company Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Artisan Breads East Africa Ltd"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D]">
                  Workspace Slug & URL *
                </label>
                <span className="text-[11px] text-[#8A6A3E] font-mono">
                  scryme.tech/{orgSlug || "org-slug"}
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. artisan-breads"
                value={orgSlug}
                onChange={(e) => {
                  setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setIsSlugManuallyEdited(true);
                }}
                className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
              />
              <p className="text-[11px] text-[#5B6B7C] mt-1">
                Unique identifier for branch synchronization, API calls, and employee login.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                  Industry & Operations
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all cursor-pointer"
                >
                  <option value="Bakery & Food Production">Bakery & Food Production</option>
                  <option value="Retail & POS Outlets">Retail & POS Outlets</option>
                  <option value="Wholesale & B2B Distribution">Wholesale & B2B Distribution</option>
                  <option value="Hospitality & Quick-Service">Hospitality & Quick-Service</option>
                  <option value="Manufacturing & Assemblies">Manufacturing & Assemblies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                  Initial Flagship Branch / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nairobi Central Bakery HQ"
                  value={primaryLocation}
                  onChange={(e) => setPrimaryLocation(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                  Admin Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                  Business Phone (M-Pesa alerts)
                </label>
                <input
                  type="tel"
                  placeholder="0712 345 678"
                  value={ownerPhone}
                  onChange={(e) => {
                    setOwnerPhone(e.target.value);
                    setMpesaNumber(e.target.value);
                  }}
                  className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                />
              </div>
            </div>

            {/* Selected Plan Summary Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#F4F1EA] border border-[#E7E2D9] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#0F1B2E] block">{selectedPlan.name} ({billingCycle})</span>
                <span className="text-[#5B6B7C]">Includes {selectedPlan.quotas.locations} · {selectedPlan.quotas.orders}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-[#0F1B2E]">
                  {formatMoney(getTotalAmount())}
                </span>
                <span className="text-[10px] text-[#A9824C] block">14 days trial free</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Continue to Payment & Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: PAYMENT CHECKOUT & M-PESA STK PUSH */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-[#5B6B7C] hover:text-[#0F1B2E] font-medium flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit Organization Profile ({orgName || orgSlug})
            </button>
            <h2 className="font-serif text-3xl font-medium text-[#0F1B2E] tracking-tight">
              Subscription checkout
            </h2>
            <p className="text-sm text-[#5B6B7C] mt-1.5 leading-relaxed">
              Verify your payment credentials. Your 14-day trial begins immediately; your chosen payment method
              is verified and activated for seamless continuous billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 cols: Payment Method Tabs & Forms */}
            <div className="md:col-span-2 space-y-5">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#EAE6DF]/70 rounded-xl border border-[#E7E2D9]">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("mpesa");
                    setStkStatus("idle");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === "mpesa"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#4FA871] mb-1" />
                  <span>M-Pesa STK</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("card");
                    setStkStatus("idle");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#A9824C] mb-1" />
                  <span>Card / Stripe</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("bank");
                    setStkStatus("idle");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === "bank"
                      ? "bg-white text-[#0F1B2E] shadow-sm"
                      : "text-[#5B6B7C] hover:text-[#0F1B2E]"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[#2F5D8A] mb-1" />
                  <span>Bank Wire</span>
                </button>
              </div>

              {/* M-PESA STK PUSH FORM */}
              {paymentMethod === "mpesa" && (
                <div className="bg-white p-6 rounded-2xl border border-[#E7E2D9] shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#4FA871]/15 text-[#4FA871] flex items-center justify-center font-bold text-xs">
                        MP
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#0F1B2E]">M-Pesa Express (STK Push)</h4>
                        <span className="text-[11px] text-[#5B6B7C]">Paybill 408102 · Scryme Technologies</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#4FA871] bg-[#4FA871]/10 px-2.5 py-1 rounded-full">
                      Zero Processing Fee
                    </span>
                  </div>

                  {stkStatus === "idle" && (
                    <form onSubmit={handleSendStkPush} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                          Safaricom M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={mpesaNumber}
                          onChange={(e) => setMpesaNumber(e.target.value)}
                          placeholder="0712345678 or 254712345678"
                          className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                        />
                        <p className="text-[11px] text-[#5B6B7C] mt-1">
                          A direct USSD push prompt will be sent to this number to authorize the transaction.
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-12 bg-[#4FA871] hover:bg-[#439662] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Send STK Push Prompt ({formatMoney(getTotalAmount(), "KES")})</span>
                      </button>
                    </form>
                  )}

                  {stkStatus === "dispatching" && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#4FA871] animate-spin" />
                      <p className="text-xs text-[#0F1B2E] font-medium">Connecting to Safaricom Daraja Gateway…</p>
                      <span className="text-[11px] text-[#5B6B7C]">Sending secure SIM toolkit request</span>
                    </div>
                  )}

                  {stkStatus === "prompt_sent" && (
                    <div className="p-5 rounded-xl bg-[#4FA871]/5 border border-[#4FA871]/30 space-y-4 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#4FA871]/15 text-[#4FA871] flex items-center justify-center">
                        <Smartphone className="w-6 h-6 animate-bounce" />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#0F1B2E]">Check Your Phone!</h4>
                        <p className="text-xs text-[#5B6B7C] mt-1">
                          An M-Pesa prompt has been dispatched to{" "}
                          <span className="font-mono font-bold text-[#0F1B2E]">{mpesaNumber}</span>.
                          Enter your M-Pesa PIN on your phone handset to authorize.
                        </p>
                      </div>

                      {/* Countdown badge */}
                      <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#5B6B7C]">
                        <Clock className="w-3.5 h-3.5 text-[#A9824C]" />
                        <span>Awaiting PIN: <strong className="text-[#0F1B2E]">{stkCountdown}s</strong> remaining</span>
                      </div>

                      {/* Interactive simulation action */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          type="button"
                          onClick={handleSimulatePinApproval}
                          className="h-10 px-4 bg-[#0F1B2E] hover:bg-[#16283F] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#4FA871]" />
                          <span>Simulate Customer PIN Entry (Authorize)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStkStatus("idle")}
                          className="h-10 px-3 bg-white border border-[#E7E2D9] text-[#5B6B7C] hover:text-[#0F1B2E] text-xs font-medium rounded-lg transition-all cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                  )}

                  {stkStatus === "authorizing" && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#A9824C] animate-spin" />
                      <p className="text-xs text-[#0F1B2E] font-medium">Verifying Daraja callback payload…</p>
                      <span className="text-[11px] text-[#5B6B7C]">Confirming settlement & registering subscription</span>
                    </div>
                  )}
                </div>
              )}

              {/* CARD CHECKOUT FORM */}
              {paymentMethod === "card" && (
                <form
                  onSubmit={handleCardCheckout}
                  className="bg-white p-6 rounded-2xl border border-[#E7E2D9] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#A9824C]" />
                      <h4 className="text-sm font-semibold text-[#0F1B2E]">Credit or Debit Card</h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#9AA6B2]">Visa · Mastercard · Amex</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                      Cardholder Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
                        CVC / Security Code
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="382"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm font-mono text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={stkStatus === "authorizing"}
                    className="w-full h-12 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {stkStatus === "authorizing" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#A9824C]" />
                        <span>Verifying Card Payment…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#A9824C]" />
                        <span>Authorize & Subscribe ({formatMoney(getTotalAmount())})</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* BANK TRANSFER FORM */}
              {paymentMethod === "bank" && (
                <div className="bg-white p-6 rounded-2xl border border-[#E7E2D9] shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#2F5D8A]" />
                      <h4 className="text-sm font-semibold text-[#0F1B2E]">Direct Bank Wire (ACH / SEPA / RTGS)</h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#9AA6B2]">Corporate Invoicing</span>
                  </div>

                  <p className="text-xs text-[#5B6B7C] leading-relaxed">
                    Wire transfers are available for corporate accounts. Generate an official pro-forma invoice
                    with unique payment reference. Your workspace will be provisioned immediately.
                  </p>

                  <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E7E2D9] space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#5B6B7C]">Beneficiary:</span>
                      <span className="font-bold text-[#0F1B2E]">Scryme Technologies Ltd</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6B7C]">Bank:</span>
                      <span className="font-bold text-[#0F1B2E]">Standard Chartered / Equity Commercial</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6B7C]">Account No:</span>
                      <span className="font-bold text-[#0F1B2E]">0108 5948 2910 01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6B7C]">Payment Reference:</span>
                      <span className="font-bold text-[#A9824C]">SCR-{orgSlug.toUpperCase() || "TENANT"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBankConfirm}
                    className="w-full h-12 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#A9824C]" />
                    <span>Issue Pro-Forma Invoice & Provision Workspace</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right 1 col: Order & Tenant Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E7E2D9] shadow-sm space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA6B2] block">
                  Order Breakdown
                </span>

                <div className="space-y-2 text-xs pb-4 border-b border-[#E7E2D9]">
                  <div className="flex justify-between font-semibold text-[#0F1B2E]">
                    <span>{selectedPlan.name}</span>
                    <span className="font-mono">{formatMoney(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6B7C]">
                    <span>Billing Cadence:</span>
                    <span className="capitalize">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6B7C]">
                    <span>Active Locations:</span>
                    <span>{selectedPlan.quotas.locations}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6B7C]">
                    <span>Trial Duration:</span>
                    <span className="text-[#4FA871] font-semibold">14 Days Free</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#5B6B7C]">
                    <span>Due Today:</span>
                    <span className="font-mono font-bold text-[#4FA871]">KSh 0.00 (Trial)</span>
                  </div>
                  <div className="flex justify-between text-[#5B6B7C]">
                    <span>Recurring Billing:</span>
                    <span className="font-mono">{formatMoney(getTotalAmount())}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#4FA871]/10 rounded-lg text-[11px] text-[#4FA871] leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    You will not be billed during your 14-day trial. You can change plans or cancel at any time.
                  </span>
                </div>
              </div>

              {/* Organization Summary Box */}
              <div className="bg-[#F4F1EA] p-4 rounded-xl border border-[#E7E2D9] space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA6B2] block">
                  Organization Target
                </span>
                <div className="font-bold text-[#0F1B2E]">{orgName || "Acme Operations"}</div>
                <div className="font-mono text-[#A9824C] text-[11px]">scryme.tech/{orgSlug || "org-slug"}</div>
                <div className="text-[#5B6B7C] text-[11px]">{industry} · {primaryLocation}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AUTOMATIC PROVISIONING & WORKSPACE LAUNCH */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0F1B2E] text-[#DDC49B] flex items-center justify-center font-bold text-2xl shadow-md">
              S
            </div>
            <h2 className="font-serif text-3xl font-medium text-[#0F1B2E] tracking-tight">
              {provisioningIndex >= 4 ? "Workspace ready to launch!" : "Provisioning your workspace…"}
            </h2>
            <p className="text-sm text-[#5B6B7C] max-w-md mx-auto">
              {provisioningIndex >= 4
                ? "Your organization is fully initialized with plan quotas, platform modules, and admin access."
                : "Setting up tenant database partition, quotas, and security boundaries."}
            </p>
          </div>

          {/* Provisioning Sequence Progress Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E7E2D9] shadow-sm space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA6B2] block">
              Provisioning Pipeline
            </span>

            <div className="space-y-3">
              {provisioningSteps.map((stepItem, idx) => {
                const isDone = provisioningIndex > idx;
                const isCurrent = provisioningIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isDone
                        ? "bg-[#4FA871]/5 border-[#4FA871]/20 text-[#0F1B2E]"
                        : isCurrent
                        ? "bg-[#A9824C]/5 border-[#A9824C]/30 text-[#0F1B2E]"
                        : "bg-[#FBFAF7] border-transparent text-[#9AA6B2]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4FA871]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#A9824C] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#D5CFBF]" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold">{stepItem.title}</h5>
                      <span className="text-[11px] text-[#5B6B7C]">{stepItem.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Tenant Credentials & Launch Info */}
            {provisioningIndex >= 4 && (
              <div className="pt-4 border-t border-[#E7E2D9] space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E7E2D9] space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5B6B7C]">Organization URL:</span>
                    <span className="font-bold text-[#0F1B2E]">https://scryme.tech/{orgSlug}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5B6B7C]">Subscribed Tier:</span>
                    <span className="font-bold text-[#A9824C] uppercase">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5B6B7C]">Payment Receipt:</span>
                    <span className="font-bold text-[#4FA871]">{receiptCode || "MPESA-CONFIRMED"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5B6B7C]">Trial Valid Until:</span>
                    <span className="text-[#0F1B2E]">
                      {new Date(Date.now() + 14 * 86400000).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(`Redirecting to https://scryme.tech/${orgSlug} dashboard!`);
                      setTimeout(() => {
                        window.location.href = `/?org=${orgSlug}`;
                      }, 1000);
                    }}
                    className="h-12 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Launch Workspace Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#DDC49B]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const summary = `Scryme Workspace Setup\nOrganization: ${orgName}\nSlug: ${orgSlug}\nPlan: ${selectedPlan.name}\nReceipt: ${receiptCode}\nTrial: 14 Days\nDate: ${new Date().toLocaleString()}`;
                      navigator.clipboard.writeText(summary);
                      toast.success("Setup summary & receipt copied to clipboard!");
                    }}
                    className="h-12 bg-white border border-[#E7E2D9] hover:border-[#0F1B2E]/30 text-[#0F1B2E] font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#5B6B7C]" />
                    <span>Copy Setup Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
