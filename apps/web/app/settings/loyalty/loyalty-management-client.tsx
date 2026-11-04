"use client";

import React, { useState, useTransition } from "react";
import {
  Award,
  Crown,
  Sparkles,
  Gift,
  Users,
  Settings,
  Plus,
  Trash2,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { toast } from "sonner";
import {
  upsertLoyaltyProgramAction,
  createLoyaltyTierAction,
  deleteLoyaltyTierAction,
  createLoyaltyRuleAction,
  deleteLoyaltyRuleAction,
  createLoyaltyRewardAction,
  deleteLoyaltyRewardAction,
  adjustCustomerPointsAction,
  processLoyaltyExpirationsAction,
} from "@/app/actions/loyalty";

interface Props {
  initialProgram: any;
  initialCustomers: any[];
}

export function LoyaltyManagementClient({ initialProgram, initialCustomers }: Props) {
  const [program, setProgram] = useState(initialProgram || {});
  const [customers, setCustomers] = useState<any[]>(initialCustomers || []);
  const [isPending, startTransition] = useTransition();

  // Tier Dialog state
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierMinPoints, setTierMinPoints] = useState(100);
  const [tierMultiplier, setTierMultiplier] = useState(1.25);
  const [tierColor, setTierColor] = useState("#F59E0B");

  // Rule Dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("POINTS_PER_CURRENCY");
  const [rulePointsValue, setRulePointsValue] = useState(1);
  const [ruleCurrencyAmount, setRuleCurrencyAmount] = useState(1.0);
  const [ruleMinOrderValue, setRuleMinOrderValue] = useState(0);

  // Reward Dialog state
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [rewardType, setRewardType] = useState("DISCOUNT_PERCENTAGE");
  const [rewardPointsRequired, setRewardPointsRequired] = useState(100);
  const [rewardDiscountValue, setRewardDiscountValue] = useState(10);

  // Adjust Points Dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState(50);
  const [adjustReason, setAdjustReason] = useState("");

  // Program Form state
  const [progName, setProgName] = useState(program.name || "Default Rewards");
  const [progDescription, setProgDescription] = useState(program.description || "");
  const [progIsActive, setProgIsActive] = useState(program.isActive ?? true);
  const [pointsLabel, setPointsLabel] = useState(program.pointsLabel || "Points");
  const [exchangeRate, setExchangeRate] = useState(program.exchangeRate || 100);
  const [expiryMonths, setExpiryMonths] = useState(program.expiryMonths || 12);
  const [minRedeemPoints, setMinRedeemPoints] = useState(program.minRedeemPoints || 50);
  const [maxRedemptionPercentage, setMaxRedemptionPercentage] = useState(
    program.maxRedemptionPercentage || 50,
  );
  const [allowDirectRedemption, setAllowDirectRedemption] = useState(
    program.allowDirectRedemption ?? true,
  );

  const handleSaveProgram = () => {
    startTransition(async () => {
      const res = await upsertLoyaltyProgramAction({
        name: progName,
        description: progDescription,
        isActive: progIsActive,
        pointsLabel,
        exchangeRate: Number(exchangeRate),
        expiryMonths: expiryMonths ? Number(expiryMonths) : null,
        minRedeemPoints: Number(minRedeemPoints),
        maxRedemptionPercentage: Number(maxRedemptionPercentage),
        allowDirectRedemption,
      });

      if (res.success) {
        toast.success("Loyalty program settings updated successfully");
      } else {
        toast.error(res.error || "Failed to update program settings");
      }
    });
  };

  const handleCreateTier = () => {
    startTransition(async () => {
      const res = await createLoyaltyTierAction({
        name: tierName,
        description: tierDescription,
        minPoints: Number(tierMinPoints),
        multiplier: Number(tierMultiplier),
        color: tierColor,
      });

      if (res.success) {
        toast.success(`Tier ${tierName} created successfully`);
        setProgram((prev: any) => ({
          ...prev,
          tiers: [...(prev.tiers || []), res.tier],
        }));
        setTierDialogOpen(false);
        setTierName("");
      } else {
        toast.error(res.error || "Failed to create tier");
      }
    });
  };

  const handleDeleteTier = (id: string) => {
    startTransition(async () => {
      const res = await deleteLoyaltyTierAction(id);
      if (res.success) {
        toast.success("Tier deleted");
        setProgram((prev: any) => ({
          ...prev,
          tiers: prev.tiers.filter((t: any) => t.id !== id),
        }));
      } else {
        toast.error(res.error || "Failed to delete tier");
      }
    });
  };

  const handleCreateRule = () => {
    startTransition(async () => {
      const res = await createLoyaltyRuleAction({
        name: ruleName,
        ruleType: ruleType as any,
        pointsValue: Number(rulePointsValue),
        currencyAmount: Number(ruleCurrencyAmount),
        minOrderValue: Number(ruleMinOrderValue),
      });

      if (res.success) {
        toast.success(`Rule "${ruleName}" created successfully`);
        setProgram((prev: any) => ({
          ...prev,
          rules: [res.rule, ...(prev.rules || [])],
        }));
        setRuleDialogOpen(false);
        setRuleName("");
      } else {
        toast.error(res.error || "Failed to create rule");
      }
    });
  };

  const handleDeleteRule = (id: string) => {
    startTransition(async () => {
      const res = await deleteLoyaltyRuleAction(id);
      if (res.success) {
        toast.success("Rule removed");
        setProgram((prev: any) => ({
          ...prev,
          rules: prev.rules.filter((r: any) => r.id !== id),
        }));
      } else {
        toast.error(res.error || "Failed to delete rule");
      }
    });
  };

  const handleCreateReward = () => {
    startTransition(async () => {
      const res = await createLoyaltyRewardAction({
        name: rewardName,
        rewardType: rewardType as any,
        pointsRequired: Number(rewardPointsRequired),
        discountValue: Number(rewardDiscountValue),
      });

      if (res.success) {
        toast.success(`Reward "${rewardName}" created successfully`);
        setProgram((prev: any) => ({
          ...prev,
          rewards: [...(prev.rewards || []), res.reward],
        }));
        setRewardDialogOpen(false);
        setRewardName("");
      } else {
        toast.error(res.error || "Failed to create reward");
      }
    });
  };

  const handleDeleteReward = (id: string) => {
    startTransition(async () => {
      const res = await deleteLoyaltyRewardAction(id);
      if (res.success) {
        toast.success("Reward deleted");
        setProgram((prev: any) => ({
          ...prev,
          rewards: prev.rewards.filter((r: any) => r.id !== id),
        }));
      } else {
        toast.error(res.error || "Failed to delete reward");
      }
    });
  };

  const handleAdjustPoints = () => {
    if (!selectedCustomer) return;
    startTransition(async () => {
      const res = await adjustCustomerPointsAction(
        selectedCustomer.id,
        Number(adjustPoints),
        adjustReason,
      );

      if (res.success) {
        toast.success(
          `Adjusted ${adjustPoints > 0 ? "+" : ""}${adjustPoints} points for ${selectedCustomer.name}`,
        );
        setCustomers(prev =>
          prev.map(c =>
            c.id === selectedCustomer.id ? { ...c, loyaltyPoints: res.newBalance } : c,
          ),
        );
        setAdjustDialogOpen(false);
        setAdjustReason("");
      } else {
        toast.error(res.error || "Failed to adjust points");
      }
    });
  };

  const handleRunExpirations = () => {
    startTransition(async () => {
      const res = await processLoyaltyExpirationsAction();
      if (res.success) {
        toast.success(
          `Processed expirations: ${res.expiredCount} customers updated, ${res.totalPointsExpired} pts expired`,
        );
      } else {
        toast.error(res.error || "Failed to process expirations");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Award className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Crown className="w-4 h-4" /> Tiers
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Earning Rules
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" /> Rewards Catalog
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Customer Balances
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------ */}
        {/* OVERVIEW & SETTINGS TAB */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Program Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure program activation, exchange conversions, checkout redemptions, and expiration policies.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="program-active" className="text-sm font-medium">
                    Program Active
                  </Label>
                  <Switch
                    id="program-active"
                    checked={progIsActive}
                    onCheckedChange={setProgIsActive}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Name</Label>
                  <Input value={progName} onChange={e => setProgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Points Unit Label</Label>
                  <Input
                    value={pointsLabel}
                    onChange={e => setPointsLabel(e.target.value)}
                    placeholder="Points, Stars, Coins..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Exchange Rate (Points per 1.00 Currency)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g. 100 points = $1.00 store discount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Points Inactivity Expiry (Months)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={expiryMonths || ""}
                    onChange={e => setExpiryMonths(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="Leave 0 for never"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expire points after X months of customer inactivity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Points to Redeem</Label>
                  <Input
                    type="number"
                    min="0"
                    value={minRedeemPoints}
                    onChange={e => setMinRedeemPoints(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Threshold required before customer can apply points
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
                <div className="space-y-2">
                  <Label>Max Redemption Percentage of Order Total (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxRedemptionPercentage}
                    onChange={e => setMaxRedemptionPercentage(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Limit maximum points discount to % of total sale
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm font-semibold">Direct POS Checkout Redemption</p>
                    <p className="text-xs text-muted-foreground">
                      Allow customers to pay with points directly at terminal
                    </p>
                  </div>
                  <Switch
                    checked={allowDirectRedemption}
                    onCheckedChange={setAllowDirectRedemption}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleRunExpirations}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" /> Process Point Expirations Now
                </Button>

                <Button onClick={handleSaveProgram} disabled={isPending}>
                  Save Program Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TIERS TAB */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="tiers" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Loyalty Membership Tiers</h3>
              <p className="text-sm text-muted-foreground">
                Define membership tier thresholds and point earning multipliers.
              </p>
            </div>
            <Button
              onClick={() => setTierDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(program.tiers || []).map((tier: any) => (
              <Card key={tier.id} className="relative overflow-hidden border-2">
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: tier.color || "#6366F1" }}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Crown className="w-5 h-5 text-amber-500" />
                      {tier.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription>{tier.description || "Membership tier"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-muted-foreground">Min Points Threshold</span>
                    <span className="font-semibold">{tier.minPoints} pts</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">Point Multiplier</span>
                    <Badge variant="secondary" className="font-mono">
                      {tier.multiplier}x
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* RULES TAB */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="rules" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Points Earning Rules</h3>
              <p className="text-sm text-muted-foreground">
                Set up currency-spend ratios and product-specific point bonuses.
              </p>
            </div>
            <Button
              onClick={() => setRuleDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Earning Rule
            </Button>
          </div>

          <div className="space-y-3">
            {(program.rules || []).map((rule: any) => (
              <Card key={rule.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{rule.name}</p>
                    <Badge variant="outline">{rule.ruleType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Award {rule.pointsValue} {program.pointsLabel || "points"}{" "}
                    {rule.currencyAmount ? `per $${rule.currencyAmount} spent` : ""}
                    {rule.minOrderValue ? ` (min order $${rule.minOrderValue})` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* REWARDS CATALOG TAB */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="rewards" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Redeemable Rewards Catalog</h3>
              <p className="text-sm text-muted-foreground">
                Create voucher rewards that customers can claim using their points.
              </p>
            </div>
            <Button
              onClick={() => setRewardDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Reward
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(program.rewards || []).map((reward: any) => (
              <Card key={reward.id} className="border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" /> {reward.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReward(reward.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription>{reward.description || reward.rewardType}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points Required</span>
                    <span className="font-bold text-amber-500">
                      {reward.pointsRequired} pts
                    </span>
                  </div>
                  {reward.discountValue && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount Value</span>
                      <span className="font-semibold">
                        {reward.rewardType === "DISCOUNT_PERCENTAGE"
                          ? `${reward.discountValue}%`
                          : `$${reward.discountValue}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* CUSTOMER LEDGER TAB */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="customers" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Customer Loyalty Balances</h3>
              <p className="text-sm text-muted-foreground">
                View customer points balances and perform audited manual adjustments.
              </p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email / Phone</th>
                  <th className="px-4 py-3">Points Balance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.email || c.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-bold">
                        {c.loyaltyPoints} pts
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setAdjustDialogOpen(true);
                        }}
                      >
                        Adjust Points
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------------ */}
      {/* DIALOGS */}
      {/* ------------------------------------------------------------------ */}

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Membership Tier</DialogTitle>
            <DialogDescription>
              Create a new loyalty level with custom minimum points and multiplier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tier Name</Label>
              <Input
                placeholder="e.g. Platinum"
                value={tierName}
                onChange={e => setTierName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Tier benefits..."
                value={tierDescription}
                onChange={e => setTierDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Points Required</Label>
                <Input
                  type="number"
                  min="0"
                  value={tierMinPoints}
                  onChange={e => setTierMinPoints(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Point Multiplier</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="1"
                  value={tierMultiplier}
                  onChange={e => setTierMultiplier(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTier} disabled={isPending}>
              Create Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Points Earning Rule</DialogTitle>
            <DialogDescription>
              Define how customers earn points on transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g. Standard $1 = 1 pt"
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINTS_PER_CURRENCY">Points Per Currency Spend</SelectItem>
                  <SelectItem value="POINTS_PER_ITEM">Points Per Specific Item</SelectItem>
                  <SelectItem value="FIXED_POINTS">Fixed Points on Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={rulePointsValue}
                  onChange={e => setRulePointsValue(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Per Currency Amount ($)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={ruleCurrencyAmount}
                  onChange={e => setRuleCurrencyAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={isPending}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Catalog Reward</DialogTitle>
            <DialogDescription>
              Create a reward voucher redeemable by customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reward Name</Label>
              <Input
                placeholder="e.g. 10% Discount Voucher"
                value={rewardName}
                onChange={e => setRewardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reward Type</Label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOUNT_PERCENTAGE">Discount Percentage</SelectItem>
                  <SelectItem value="DISCOUNT_FIXED_AMOUNT">Discount Fixed Amount</SelectItem>
                  <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Required</Label>
                <Input
                  type="number"
                  min="1"
                  value={rewardPointsRequired}
                  onChange={e => setRewardPointsRequired(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Value (% or $)</Label>
                <Input
                  type="number"
                  min="0.1"
                  value={rewardDiscountValue}
                  onChange={e => setRewardDiscountValue(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReward} disabled={isPending}>
              Create Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Customer Points</DialogTitle>
            <DialogDescription>
              Perform an audited points addition or deduction for {selectedCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Points Adjustment (Positive to add, Negative to deduct)</Label>
              <Input
                type="number"
                value={adjustPoints}
                onChange={e => setAdjustPoints(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mandatory Audit Reason</Label>
              <Input
                placeholder="e.g. Store credit compensation, goodwill gesture..."
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustPoints} disabled={isPending}>
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
