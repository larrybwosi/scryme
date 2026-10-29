"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, DollarSign, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Badge } from "@repo/ui/components/ui/badge";
import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog";
import {
  updateOrganizationSubscription,
  type Tier,
} from "@/app/actions/billing";

interface SubscriptionEditorProps {
  organizationId: string;
  subscription: {
    tierSlug: string;
    dodoCustomerId: string | null;
    dodoSubscriptionId: string | null;
    dodoCurrentPeriodEnd: Date | null;
    isCustomPrice?: boolean;
    customMonthlyPrice?: number | null;
    customYearlyPrice?: number | null;
    billingInterval?: string | null;
    customCurrency?: string | null;
    customDiscountPercent?: number | null;
    customTaxPercent?: number | null;
    customNotes?: string | null;
  };
  tiers: Tier[];
}

export function SubscriptionEditor({
  organizationId,
  subscription,
  tiers,
}: SubscriptionEditorProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [tierSlug, setTierSlug] = useState(subscription.tierSlug);
  const [periodEnd, setPeriodEnd] = useState(
    subscription.dodoCurrentPeriodEnd
      ? new Date(subscription.dodoCurrentPeriodEnd).toISOString().slice(0, 10)
      : "",
  );

  // Custom pricing state
  const [isCustomPrice, setIsCustomPrice] = useState(
    subscription.isCustomPrice ?? false,
  );
  const [customMonthlyPrice, setCustomMonthlyPrice] = useState<string>(
    subscription.customMonthlyPrice != null
      ? String(subscription.customMonthlyPrice)
      : "",
  );
  const [customYearlyPrice, setCustomYearlyPrice] = useState<string>(
    subscription.customYearlyPrice != null
      ? String(subscription.customYearlyPrice)
      : "",
  );
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    (subscription.billingInterval as "monthly" | "yearly") || "monthly",
  );
  const [customCurrency, setCustomCurrency] = useState<string>(
    subscription.customCurrency || "USD",
  );
  const [customDiscountPercent, setCustomDiscountPercent] = useState<string>(
    subscription.customDiscountPercent != null
      ? String(subscription.customDiscountPercent)
      : "",
  );
  const [customTaxPercent, setCustomTaxPercent] = useState<string>(
    subscription.customTaxPercent != null
      ? String(subscription.customTaxPercent)
      : "",
  );
  const [customNotes, setCustomNotes] = useState<string>(
    subscription.customNotes || "",
  );

  const availableTiers = tiers.some((t) => t.slug === "free")
    ? tiers
    : [{ slug: "free", name: "Free", price: 0 }, ...tiers];

  async function handleSave() {
    setIsPending(true);
    try {
      await updateOrganizationSubscription(organizationId, {
        tierSlug,
        dodoCustomerId: subscription.dodoCustomerId || undefined,
        dodoSubscriptionId: subscription.dodoSubscriptionId || undefined,
        dodoCurrentPeriodEnd: periodEnd
          ? new Date(periodEnd).toISOString()
          : undefined,
        isCustomPrice,
        customMonthlyPrice:
          customMonthlyPrice !== "" ? Number(customMonthlyPrice) : null,
        customYearlyPrice:
          customYearlyPrice !== "" ? Number(customYearlyPrice) : null,
        billingInterval,
        customCurrency,
        customDiscountPercent:
          customDiscountPercent !== "" ? Number(customDiscountPercent) : null,
        customTaxPercent:
          customTaxPercent !== "" ? Number(customTaxPercent) : null,
        customNotes: customNotes || null,
      });
      toast.success("Subscription & Custom Pricing updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update subscription",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            Subscription & Pricing
            {isCustomPrice && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 text-xs"
              >
                Custom Pricing Active
              </Badge>
            )}
          </CardTitle>
        </div>
        <CardDescription>
          Configure plan tier assignment, custom monthly/yearly rates, and
          billing cycles for this organization.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-select">Plan tier</Label>
            <Select value={tierSlug} onValueChange={setTierSlug}>
              <SelectTrigger id="tier-select">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {availableTiers.map((tier) => (
                  <SelectItem key={tier.slug} value={tier.slug}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="period-end">Current period ends</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Custom Pricing Section Toggle */}
        <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                <SlidersHorizontal className="size-4 text-primary" />
                Custom Pricing Override
              </div>
              <p className="text-xs text-muted-foreground">
                Override standard plan prices with negotiated monthly or yearly
                rates for this tenant.
              </p>
            </div>
            <Switch
              checked={isCustomPrice}
              onCheckedChange={setIsCustomPrice}
              aria-label="Toggle custom pricing"
            />
          </div>

          {isCustomPrice && (
            <div className="pt-2 flex flex-col gap-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-monthly" className="text-xs">
                    Custom Monthly Price
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      id="custom-monthly"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 150.00"
                      className="pl-8"
                      value={customMonthlyPrice}
                      onChange={(e) => setCustomMonthlyPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-yearly" className="text-xs">
                    Custom Yearly Price
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      id="custom-yearly"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1500.00"
                      className="pl-8"
                      value={customYearlyPrice}
                      onChange={(e) => setCustomYearlyPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="billing-interval" className="text-xs">
                    Billing Cycle
                  </Label>
                  <Select
                    value={billingInterval}
                    onValueChange={(val: "monthly" | "yearly") =>
                      setBillingInterval(val)
                    }
                  >
                    <SelectTrigger id="billing-interval">
                      <SelectValue placeholder="Monthly" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-currency" className="text-xs">
                    Currency
                  </Label>
                  <Input
                    id="custom-currency"
                    type="text"
                    placeholder="USD / KES"
                    value={customCurrency}
                    onChange={(e) =>
                      setCustomCurrency(e.target.value.toUpperCase())
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-discount" className="text-xs">
                    Discount (%)
                  </Label>
                  <Input
                    id="custom-discount"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 10"
                    value={customDiscountPercent}
                    onChange={(e) => setCustomDiscountPercent(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-tax" className="text-xs">
                    Tax (%)
                  </Label>
                  <Input
                    id="custom-tax"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 16"
                    value={customTaxPercent}
                    onChange={(e) => setCustomTaxPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-notes" className="text-xs">
                  Negotiation Notes & Enterprise Terms
                </Label>
                <Textarea
                  id="custom-notes"
                  rows={2}
                  placeholder="e.g. Special SLA contract terms signed on Q3..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {subscription.dodoSubscriptionId ? (
          <p className="text-xs text-muted-foreground">
            Provider subscription ID: {subscription.dodoSubscriptionId}
          </p>
        ) : null}

        <div className="flex justify-between items-center pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMpesaDialogOpen(true)}
            className="gap-2"
          >
            M-Pesa Payment
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-3.5" aria-hidden="true" />
            )}
            Save Pricing & Subscription
          </Button>
        </div>

        <RecordPaymentDialog
          open={mpesaDialogOpen}
          onOpenChange={setMpesaDialogOpen}
          organizations={[]}
          tiers={tiers}
          defaultOrgId={organizationId}
        />
      </CardContent>
    </Card>
  );
}
