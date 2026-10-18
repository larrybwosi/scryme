import { ReportSettingsPanel } from "./report-settings-panel";
"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  Save,
  Globe,
  Warehouse,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  CreditCard,
  Clock,
  Receipt,
  TrendingUp,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { updateOrganizationSettings } from "@/app/actions/organization";
import { OrganizationProfileHeader } from "./profile-header";

// ─── Schema ────────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  // Profile
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  banner: z.string().optional().or(z.literal("")),

  // Localization
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTimezone: z.string().min(1, "Timezone is required"),
  country: z.string().min(1, "Country is required"),

  // Payment Options (M-Pesa)
  paymentCredentials: z.object({
    mpesaShortCode: z.string().optional().or(z.literal("")),
    mpesaType: z.enum(["PAYBILL", "TILL"]).default("PAYBILL"),
    environment: z.enum(["SANDBOX", "PRODUCTION"]).default("SANDBOX"),
    mpesaConsumerKey: z.string().optional().or(z.literal("")),
    mpesaConsumerSecret: z.string().optional().or(z.literal("")),
    mpesaPassKey: z.string().optional().or(z.literal("")),
    mpesaInitiatorPass: z.string().optional().or(z.literal("")),
  }),

  // Inventory Policies
  lowStockThreshold: z.number().min(0).default(10),
  negativeStock: z.boolean().default(false),
  managersCanManageShifts: z.boolean().default(false),

  // Operations & Attendance
  enableAutoCheckout: z.boolean().default(false),
  autoCheckoutTime: z.string().optional().or(z.literal("")),
  enableBakerySystem: z.boolean().default(false),

  // Tax & Compliance
  taxIntegrationEnabled: z.boolean().default(false),
  defaultTaxId: z.string().optional().or(z.literal("")),
  highValueTaxThreshold: z.number().min(0).default(100000),

  // Pricing Strategy
  priceSyncMode: z.enum(["MANUAL", "AUTOMATIC", "REVIEW_REQUIRED"]).default("MANUAL"),
  supplierSelectionStrategy: z.enum(["PREFERRED", "LOWEST_COST", "LATEST_DELIVERY"]).default("PREFERRED"),
  minMarginThreshold: z.number().min(0).max(1).default(0.10),
  priceApprovalThreshold: z.number().min(0).max(1).default(0.20),

  // Security & Access
  adminsCanManageStaff: z.boolean().default(false),
  multiAdminRoleApproval: z.boolean().default(false),
  auditLogRetentionDays: z.number().min(30).default(365),
  enforceMfa: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Nav config ────────────────────────────────────────────────────────────────

type SectionId =
  | "profile"
  | "localization"
  | "payments"
  | "inventory"
  | "operations"
  | "tax"
  | "pricing"
  | "security"
  | "reports";

const NAV_SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "profile",
    label: "Organization Profile",
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: "localization",
    label: "Localization",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: "payments",
    label: "Payment Options",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: "inventory",
    label: "Inventory Policies",
    icon: <Warehouse className="w-4 h-4" />,
  },
  {
    id: "operations",
    label: "Operations & Attendance",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "tax",
    label: "Tax & Compliance",
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    id: "pricing",
    label: "Pricing Strategy",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: "reports",
    label: "Reports & Notifications",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "security",
    label: "Security & Access",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
  fullWidth,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", fullWidth && "md:col-span-2")}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function IconInput({
  icon,
  error,
  type = "text",
  allowTogglePassword,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  error?: boolean;
  allowTogglePassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = allowTogglePassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          {icon}
        </span>
      )}
      <Input
        {...props}
        type={inputType}
        className={cn(
          icon ? "pl-9" : "pl-3",
          allowTogglePassword ? "pr-10" : "pr-3",
          "bg-background border-border focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-colors h-9 text-sm rounded-lg",
          error && "border-destructive focus-visible:ring-destructive/20",
          props.className,
        )}
      />
      {allowTogglePassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function PolicyRow({
  title,
  description,
  risk,
  children,
}: {
  title: string;
  description: string;
  risk?: "low" | "medium" | "high";
  children: React.ReactNode;
}) {
  const riskColors = {
    low: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium:
      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    high: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="flex items-start justify-between gap-8 py-5 px-5">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {risk && (
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                riskColors[risk],
              )}>
              {risk} risk
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
          {description}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      logo: initialData?.logo || "",
      banner: initialData?.banner || "",

      defaultCurrency: initialData?.settings?.defaultCurrency || "USD",
      defaultTimezone: initialData?.settings?.defaultTimezone || "UTC",
      country: initialData?.settings?.country || "Kenya",

      paymentCredentials: {
        mpesaShortCode: initialData?.paymentCredentials?.mpesaShortCode || "",
        mpesaType: initialData?.paymentCredentials?.mpesaType || "PAYBILL",
        environment: initialData?.paymentCredentials?.environment || "SANDBOX",
        mpesaConsumerKey: initialData?.paymentCredentials?.mpesaConsumerKey || "",
        mpesaConsumerSecret: initialData?.paymentCredentials?.mpesaConsumerSecret || "",
        mpesaPassKey: initialData?.paymentCredentials?.mpesaPassKey || "",
        mpesaInitiatorPass: initialData?.paymentCredentials?.mpesaInitiatorPass || "",
      },

      lowStockThreshold: initialData?.settings?.lowStockThreshold ?? 10,
      negativeStock: initialData?.settings?.negativeStock ?? false,
      managersCanManageShifts: initialData?.settings?.managersCanManageShifts ?? false,

      enableAutoCheckout: initialData?.settings?.enableAutoCheckout ?? false,
      autoCheckoutTime: initialData?.settings?.autoCheckoutTime || "18:00",
      enableBakerySystem: initialData?.settings?.enableBakerySystem ?? false,

      taxIntegrationEnabled: initialData?.settings?.taxIntegrationEnabled ?? false,
      defaultTaxId: initialData?.settings?.defaultTaxId || "",
      highValueTaxThreshold: Number(initialData?.settings?.highValueTaxThreshold || 100000),

      priceSyncMode: initialData?.settings?.priceSyncMode || "MANUAL",
      supplierSelectionStrategy: initialData?.settings?.supplierSelectionStrategy || "PREFERRED",
      minMarginThreshold: Number(initialData?.settings?.minMarginThreshold || 0.10),
      priceApprovalThreshold: Number(initialData?.settings?.priceApprovalThreshold || 0.20),

      adminsCanManageStaff: initialData?.settings?.adminsCanManageStaff ?? false,
      multiAdminRoleApproval: initialData?.settings?.multiAdminRoleApproval ?? false,
      auditLogRetentionDays: initialData?.settings?.auditLogRetentionDays ?? 365,
      enforceMfa: initialData?.settings?.enforceMfa ?? false,
    },
  });

  const isDirty = form.formState.isDirty;
  const errors = form.formState.errors;

  const onSubmit = async (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateOrganizationSettings(data);
        toast.success("Settings saved", {
          description: "Your organization settings have been updated.",
        });
        form.reset(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to save settings", {
          description: "An error occurred. Please try again.",
        });
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col h-screen bg-background">
      {/* ── Top header bar ── */}
      <div className="shrink-0 bg-card border-b border-border px-8">
        {/* Page title row */}
        <div className="flex items-center justify-between h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-none">
                Organization Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your workspace configuration and payment integration
              </p>
            </div>
          </div>

          {/* Save bar inline */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs transition-all duration-200",
                isDirty
                  ? "text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
                  : "text-muted-foreground flex items-center gap-1.5",
              )}>
              {isDirty ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  All changes saved
                </>
              )}
            </span>

            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.reset()}
                disabled={isPending}
                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                Discard
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={isPending || !isDirty}
              className={cn(
                "h-8 text-xs font-semibold gap-1.5 transition-all rounded-lg",
                isDirty
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-default",
              )}>
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Horizontal tabs */}
        <div className="flex items-center gap-0 -mb-px overflow-x-auto no-scrollbar">
          {NAV_SECTIONS.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}>
                <span
                  className={cn(
                    "transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}>
                  {section.icon}
                </span>
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto px-8 py-10 max-w-6xl">
          {/* ── Profile section ── */}
          {activeSection === "profile" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Branding
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Logo and banner shown on public-facing documents
                  </p>
                </div>
                <div className="px-6 py-5">
                  <OrganizationProfileHeader
                    logo={form.watch("logo")}
                    banner={form.watch("banner")}
                    onLogoChange={url =>
                      form.setValue("logo", url, { shouldDirty: true })
                    }
                    onBannerChange={url =>
                      form.setValue("banner", url, { shouldDirty: true })
                    }
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Identity &amp; Contact
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Displayed on invoices, receipts, and customer communications
                  </p>
                </div>
                <div className="px-6 py-6">
                  <FieldGroup>
                    <Field
                      label="Organization Name"
                      required
                      error={errors.name?.message}
                      fullWidth>
                      <Input
                        {...form.register("name")}
                        placeholder="Acme Corporation"
                        className="bg-background border-border focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring h-9 text-sm rounded-lg"
                      />
                    </Field>

                    <Field label="Public Email" error={errors.email?.message}>
                      <IconInput
                        icon={<Mail className="w-4 h-4" />}
                        {...form.register("email")}
                        type="email"
                        placeholder="contact@acme.com"
                        error={!!errors.email}
                      />
                    </Field>

                    <Field label="Phone Number" error={errors.phone?.message}>
                      <IconInput
                        icon={<Phone className="w-4 h-4" />}
                        {...form.register("phone")}
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                      />
                    </Field>

                    <Field
                      label="Address"
                      error={errors.address?.message}
                      fullWidth>
                      <IconInput
                        icon={<MapPin className="w-4 h-4" />}
                        {...form.register("address")}
                        placeholder="123 Business Way, Suite 100"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ── Localization section ── */}
          {activeSection === "localization" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Regional Defaults
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applied to all financial transactions, timestamps, and addresses across your organization
                  </p>
                </div>
                <div className="px-6 py-6">
                  <FieldGroup>
                    <Field
                      label="Default Currency"
                      required
                      hint="Applied to all financial transactions and reports."
                      error={errors.defaultCurrency?.message}>
                      <Select
                        onValueChange={val =>
                          form.setValue("defaultCurrency", val, {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("defaultCurrency")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background focus:ring-2 focus:ring-ring/20 rounded-lg">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD — US Dollar</SelectItem>
                          <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                          <SelectItem value="EUR">EUR — Euro</SelectItem>
                          <SelectItem value="GBP">GBP — British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field
                      label="Default Country"
                      required
                      hint="Used as the fallback region for addresses and compliance."
                      error={errors.country?.message}>
                      <Input
                        {...form.register("country")}
                        placeholder="Kenya"
                        className="h-9 text-sm border-border bg-background focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring rounded-lg"
                      />
                    </Field>

                    <Field
                      label="Timezone"
                      required
                      hint="Timestamps and scheduled jobs run on this timezone."
                      error={errors.defaultTimezone?.message}
                      fullWidth>
                      <Select
                        onValueChange={val =>
                          form.setValue("defaultTimezone", val, {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("defaultTimezone")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background focus:ring-2 focus:ring-ring/20 rounded-lg">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC — Universal Time</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi — EAT (UTC+3)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London — GMT/BST</SelectItem>
                          <SelectItem value="America/New_York">America/New_York — EST/EDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Options section (M-Pesa) ── */}
          {activeSection === "payments" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      M-Pesa Integration Credentials
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure Daraja API keys and credentials for STK Push & C2B payments
                    </p>
                  </div>
                  <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                    Safaricom M-Pesa
                  </Badge>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <FieldGroup>
                    <Field label="Environment" required>
                      <Select
                        onValueChange={val =>
                          form.setValue("paymentCredentials.environment", val as "SANDBOX" | "PRODUCTION", {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("paymentCredentials.environment")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background focus:ring-2 focus:ring-ring/20 rounded-lg">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SANDBOX">Sandbox (Testing)</SelectItem>
                          <SelectItem value="PRODUCTION">Production (Live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="M-Pesa Type" required>
                      <Select
                        onValueChange={val =>
                          form.setValue("paymentCredentials.mpesaType", val as "PAYBILL" | "TILL", {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("paymentCredentials.mpesaType")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background focus:ring-2 focus:ring-ring/20 rounded-lg">
                          <SelectValue placeholder="Select M-Pesa type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAYBILL">Paybill Number</SelectItem>
                          <SelectItem value="TILL">Buy Goods / Till Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="ShortCode (Paybill / Till Number)" required fullWidth>
                      <Input
                        {...form.register("paymentCredentials.mpesaShortCode")}
                        placeholder="e.g. 174379 or 600000"
                        className="h-9 text-sm border-border bg-background focus-visible:ring-2 focus-visible:ring-ring/20 rounded-lg"
                      />
                    </Field>

                    <Field label="Consumer Key" required hint="Obtained from Safaricom Developer Portal">
                      <IconInput
                        {...form.register("paymentCredentials.mpesaConsumerKey")}
                        placeholder="Consumer Key"
                        allowTogglePassword
                      />
                    </Field>

                    <Field label="Consumer Secret" required hint="Obtained from Safaricom Developer Portal">
                      <IconInput
                        {...form.register("paymentCredentials.mpesaConsumerSecret")}
                        placeholder="Consumer Secret"
                        allowTogglePassword
                      />
                    </Field>

                    <Field label="Pass Key (Lipa Na M-Pesa Online)" hint="Required for STK Push prompt triggers">
                      <IconInput
                        {...form.register("paymentCredentials.mpesaPassKey")}
                        placeholder="Online Pass Key"
                        allowTogglePassword
                      />
                    </Field>

                    <Field label="Initiator Password (Optional)" hint="Required for B2C/B2B disbursements">
                      <IconInput
                        {...form.register("paymentCredentials.mpesaInitiatorPass")}
                        placeholder="Initiator Password"
                        allowTogglePassword
                      />
                    </Field>
                  </FieldGroup>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  All M-Pesa credentials are standard V3 encrypted at rest. Updating keys here instantly applies to all POS terminals and checkout flows.
                </p>
              </div>
            </div>
          )}

          {/* ── Inventory section ── */}
          {activeSection === "inventory" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Stock Control Policies
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Global rules governing how inventory is tracked and enforced across all locations
                    </p>
                  </div>
                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 font-medium">
                    Global
                  </Badge>
                </div>

                <div className="divide-y divide-border">
                  <PolicyRow
                    title="Allow Negative Stock"
                    description="When enabled, sales can proceed even when recorded inventory reaches zero or below."
                    risk={form.watch("negativeStock") ? "high" : "low"}>
                    <Switch
                      checked={form.watch("negativeStock")}
                      onCheckedChange={val =>
                        form.setValue("negativeStock", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <PolicyRow
                    title="Allow Managers to Manage Shifts"
                    description="When enabled, users with the MANAGER role can create, update, and delete staff weekly shifts and breaks."
                    risk="low">
                    <Switch
                      checked={form.watch("managersCanManageShifts")}
                      onCheckedChange={val =>
                        form.setValue("managersCanManageShifts", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <div className="flex items-start justify-between gap-8 py-5 px-5">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Low Stock Threshold
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                        Products at or below this quantity trigger low stock alerts across dashboards.
                      </p>
                    </div>
                    <div className="shrink-0 w-32">
                      <div className="relative">
                        <Input
                          type="number"
                          {...form.register("lowStockThreshold", {
                            valueAsNumber: true,
                          })}
                          className="font-mono text-right pr-10 h-9 text-sm border-border bg-background focus-visible:ring-2 focus-visible:ring-ring/20 rounded-lg"
                          min={0}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/60 pointer-events-none">
                          units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Operations & Attendance section ── */}
          {activeSection === "operations" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Operations &amp; Shift Automation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automated attendance checkout and specialized industry module toggles
                  </p>
                </div>

                <div className="divide-y divide-border">
                  <PolicyRow
                    title="Enable Attendance Auto-Checkout"
                    description="Automatically check out active staff members who remain checked in past the designated end-of-day time."
                    risk="low">
                    <Switch
                      checked={form.watch("enableAutoCheckout")}
                      onCheckedChange={val =>
                        form.setValue("enableAutoCheckout", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  {form.watch("enableAutoCheckout") && (
                    <div className="flex items-start justify-between gap-8 py-5 px-5">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Auto-Checkout Time
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                          Local organization time (HH:mm) when daily auto-checkout executes.
                        </p>
                      </div>
                      <div className="shrink-0 w-32">
                        <Input
                          type="time"
                          {...form.register("autoCheckoutTime")}
                          className="h-9 text-sm border-border bg-background focus-visible:ring-2 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  <PolicyRow
                    title="Enable Bakery Batching Module"
                    description="Activates baker's percentage, flour scaling, and sub-recipe batching tools across production."
                    risk="low">
                    <Switch
                      checked={form.watch("enableBakerySystem")}
                      onCheckedChange={val =>
                        form.setValue("enableBakerySystem", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>
                </div>
              </div>
            </div>
          )}

          {/* ── Tax & Compliance section ── */}
          {activeSection === "tax" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Tax Registration &amp; E-Invoicing Compliance
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Integrations for tax authorities (e.g., KRA TIMS/eTIMS) and threshold controls
                  </p>
                </div>

                <div className="divide-y divide-border">
                  <PolicyRow
                    title="Enable Tax Integration (eTIMS / KRA)"
                    description="Transmits fiscalized invoice receipts directly to the regional tax authority."
                    risk="medium">
                    <Switch
                      checked={form.watch("taxIntegrationEnabled")}
                      onCheckedChange={val =>
                        form.setValue("taxIntegrationEnabled", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <div className="p-6">
                    <FieldGroup>
                      <Field label="Tax Identification Number (PIN/Tax ID)">
                        <Input
                          {...form.register("defaultTaxId")}
                          placeholder="e.g. A012345678Z"
                          className="h-9 text-sm border-border bg-background focus-visible:ring-2 rounded-lg"
                        />
                      </Field>

                      <Field
                        label="High Value Tax Lock Threshold"
                        hint="Sales exceeding this amount require active tax server confirmation.">
                        <Input
                          type="number"
                          {...form.register("highValueTaxThreshold", {
                            valueAsNumber: true,
                          })}
                          className="h-9 text-sm border-border bg-background focus-visible:ring-2 rounded-lg"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Pricing Strategy section ── */}
          {activeSection === "pricing" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Automated Pricing &amp; Margin Rules
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define automated catalog price recalculations, margins, and supplier rules
                  </p>
                </div>

                <div className="p-6">
                  <FieldGroup>
                    <Field label="Price Sync Mode">
                      <Select
                        onValueChange={val =>
                          form.setValue("priceSyncMode", val as any, {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("priceSyncMode")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background rounded-lg">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANUAL">Manual Update Only</SelectItem>
                          <SelectItem value="AUTOMATIC">Automatic Margin Recalculation</SelectItem>
                          <SelectItem value="REVIEW_REQUIRED">Require Review Before Sync</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Supplier Selection Strategy">
                      <Select
                        onValueChange={val =>
                          form.setValue("supplierSelectionStrategy", val as any, {
                            shouldDirty: true,
                          })
                        }
                        value={form.watch("supplierSelectionStrategy")}>
                        <SelectTrigger className="h-9 text-sm border-border bg-background rounded-lg">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PREFERRED">Preferred Supplier First</SelectItem>
                          <SelectItem value="LOWEST_COST">Lowest Cost Option</SelectItem>
                          <SelectItem value="LATEST_DELIVERY">Latest Delivery Record</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Minimum Margin Threshold" hint="e.g. 0.10 for 10% profit margin">
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("minMarginThreshold", {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm border-border bg-background rounded-lg"
                      />
                    </Field>

                    <Field label="Price Change Approval Threshold" hint="e.g. 0.20 for 20% price shift trigger">
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("priceApprovalThreshold", {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm border-border bg-background rounded-lg"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}


          {/* ── Reports & Notifications section ── */}
          {activeSection === "reports" && (
            <ReportSettingsPanel />
          )}

          {/* ── Security section ── */}
          {activeSection === "security" && (
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Access Control &amp; Enterprise Governance
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permissions, Multi-factor auth, and auditing policies
                    </p>
                  </div>
                  <Badge className="text-xs bg-primary text-primary-foreground border-primary font-medium">
                    Security
                  </Badge>
                </div>

                <div className="divide-y divide-border">
                  <PolicyRow
                    title="Allow Admins to Manage Staff"
                    description="When enabled, users with the ADMIN role can add, update, and remove staff members."
                    risk="medium">
                    <Switch
                      checked={form.watch("adminsCanManageStaff")}
                      onCheckedChange={val =>
                        form.setValue("adminsCanManageStaff", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <PolicyRow
                    title="Require Multi-Admin Approval"
                    description="Critical security policy changes require confirmation from at least two organization administrators."
                    risk="high">
                    <Switch
                      checked={form.watch("multiAdminRoleApproval")}
                      onCheckedChange={val =>
                        form.setValue("multiAdminRoleApproval", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <PolicyRow
                    title="Enforce Multi-Factor Authentication (MFA)"
                    description="Require all organization members to configure TOTP or hardware MFA before accessing workspace."
                    risk="high">
                    <Switch
                      checked={form.watch("enforceMfa")}
                      onCheckedChange={val =>
                        form.setValue("enforceMfa", val, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </PolicyRow>

                  <div className="flex items-start justify-between gap-8 py-5 px-5">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Audit Log Retention Period
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                        Number of days detailed system and action logs are retained for compliance audit trails.
                      </p>
                    </div>
                    <div className="shrink-0 w-32">
                      <Input
                        type="number"
                        {...form.register("auditLogRetentionDays", {
                          valueAsNumber: true,
                        })}
                        className="font-mono text-right pr-10 h-9 text-sm border-border bg-background rounded-lg"
                        min={30}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
