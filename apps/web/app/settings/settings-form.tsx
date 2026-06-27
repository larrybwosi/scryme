"use client";

import { useState, useTransition } from "react";
import {
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
import { Separator } from "@repo/ui/components/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { updateOrganizationSettings } from "@/app/actions/organization";
import { OrganizationProfileHeader } from "./profile-header";

// ─── Schema ────────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  banner: z.string().optional().or(z.literal("")),
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTimezone: z.string().min(1, "Timezone is required"),
  country: z.string().min(1, "Country is required"),
  lowStockThreshold: z.number().min(0).default(10),
  negativeStock: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Nav config ────────────────────────────────────────────────────────────────

type SectionId = "profile" | "localization" | "inventory";

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
    id: "inventory",
    label: "Inventory Policies",
    icon: <Warehouse className="w-4 h-4" />,
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
      <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function IconInput({
  icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
      <Input
        {...props}
        className={cn(
          "pl-9 bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-colors h-9 text-sm rounded-lg",
          error && "border-red-400 focus-visible:ring-red-400/20",
          props.className,
        )}
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-8 pb-6 border-b border-zinc-100">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-zinc-500 mt-1 max-w-xl">{description}</p>
      </div>
      {badge && (
        <Badge
          variant="secondary"
          className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium">
          {badge}
        </Badge>
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
    low: "text-emerald-700 bg-emerald-50 border-emerald-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    high: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="flex items-start justify-between gap-8 py-5 px-5">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
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
        <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0 pt-0.5">{children}</div>
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
      lowStockThreshold: initialData?.settings?.lowStockThreshold || 10,
      negativeStock: initialData?.settings?.negativeStock || false,
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
      className="flex flex-col h-screen bg-zinc-50">
      {/* ── Top header bar ── */}
      <div className="shrink-0 bg-white border-b border-zinc-200 px-8">
        {/* Page title row */}
        <div className="flex items-center justify-between h-16 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 leading-none">
                Organization Settings
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage your workspace configuration
              </p>
            </div>
          </div>

          {/* Save bar inline */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs transition-all duration-200",
                isDirty
                  ? "text-amber-600 flex items-center gap-1.5"
                  : "text-zinc-400 flex items-center gap-1.5",
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
                className="h-8 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100">
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
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-zinc-100 text-zinc-400 cursor-default",
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
        <div className="flex items-center gap-0 -mb-px">
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
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200",
                )}>
                <span
                  className={cn(
                    "transition-colors",
                    isActive ? "text-zinc-900" : "text-zinc-400",
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
        <div className=" mx-auto px-8 py-10">
          {/* ── Profile section ── */}
          {activeSection === "profile" && (
            <div className="space-y-8">
              {/* Branding block */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Branding
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
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

              {/* Contact details block */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Identity &amp; Contact
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
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
                        className="bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 h-9 text-sm rounded-lg"
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

              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Contact details appear on customer-facing documents such as
                  invoices and receipts. Keep them accurate to maintain trust
                  with your clients.
                </p>
              </div>
            </div>
          )}

          {/* ── Localization section ── */}
          {activeSection === "localization" && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Regional Defaults
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Applied to all financial transactions, timestamps, and
                    addresses across your organization
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
                        <SelectTrigger className="h-9 text-sm border-zinc-200 bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD — US Dollar</SelectItem>
                          <SelectItem value="KES">
                            KES — Kenyan Shilling
                          </SelectItem>
                          <SelectItem value="EUR">EUR — Euro</SelectItem>
                          <SelectItem value="GBP">
                            GBP — British Pound
                          </SelectItem>
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
                        className="h-9 text-sm border-zinc-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-lg"
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
                        <SelectTrigger className="h-9 text-sm border-zinc-200 bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">
                            UTC — Universal Time
                          </SelectItem>
                          <SelectItem value="Africa/Nairobi">
                            Africa/Nairobi — EAT (UTC+3)
                          </SelectItem>
                          <SelectItem value="Europe/London">
                            Europe/London — GMT/BST
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            America/New_York — EST/EDT
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </div>
              </div>

              {/* Active config preview */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Active Configuration
                  </p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { key: "Currency", value: form.watch("defaultCurrency") },
                    { key: "Country", value: form.watch("country") },
                    { key: "Timezone", value: form.watch("defaultTimezone") },
                  ].map(({ key, value }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-6 py-3">
                      <span className="text-xs text-zinc-500 font-medium">
                        {key}
                      </span>
                      <span className="text-xs font-mono font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-md">
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Inventory section ── */}
          {activeSection === "inventory" && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Stock Control Policies
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Global rules governing how inventory is tracked and
                      enforced across all locations
                    </p>
                  </div>
                  <Badge className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                    Global
                  </Badge>
                </div>

                <div className="divide-y divide-zinc-100">
                  {/* Negative stock */}
                  <PolicyRow
                    title="Allow Negative Stock"
                    description="When enabled, sales can proceed even when recorded inventory reaches zero or below. Use with caution — this can mask shrinkage or data integrity issues."
                    risk={form.watch("negativeStock") ? "high" : "low"}>
                    <Switch
                      checked={form.watch("negativeStock")}
                      onCheckedChange={val =>
                        form.setValue("negativeStock", val, {
                          shouldDirty: true,
                        })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </PolicyRow>

                  {/* Low stock threshold */}
                  <div className="flex items-start justify-between gap-8 py-5 px-5">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-zinc-900">
                        Low Stock Threshold
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
                        Products with stock at or below this quantity are
                        flagged as &ldquo;Low Stock&rdquo; across dashboards and
                        reports. Applies globally unless overridden per
                        location.
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-32">
                      <div className="relative">
                        <Input
                          type="number"
                          {...form.register("lowStockThreshold", {
                            valueAsNumber: true,
                          })}
                          className="font-mono text-right pr-10 h-9 text-sm border-zinc-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-lg"
                          min={0}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 pointer-events-none">
                          units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-100 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">
                    Global scope
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    These settings apply to all locations and product
                    categories. Changes take effect immediately and may affect
                    active sales flows.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
