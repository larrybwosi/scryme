"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  Sparkles,
} from "lucide-react";
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
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  savePricingConfig,
  syncPricingToSanity,
  type PricingConfigData,
} from "@/app/actions/billing";

interface PricingConfigPanelProps {
  initialConfig: PricingConfigData;
}

export function PricingConfigPanel({ initialConfig }: PricingConfigPanelProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [title, setTitle] = useState(
    initialConfig.title || "Global Site Pricing Configuration",
  );
  const [heroBadge, setHeroBadge] = useState(initialConfig.heroBadge || "");
  const [heroTitle, setHeroTitle] = useState(initialConfig.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialConfig.heroSubtitle || "",
  );

  const [currencies, setCurrencies] = useState(initialConfig.currencies || []);
  const [faqs, setFaqs] = useState(initialConfig.faqs || []);

  async function handleSave() {
    setIsSaving(true);
    try {
      const configData: PricingConfigData = {
        title,
        heroBadge,
        heroTitle,
        heroSubtitle,
        currencies,
        faqs,
      };
      const res = await savePricingConfig(configData);
      if (res.synced) {
        toast.success(res.message || "Saved and live synced to Sanity CMS!");
      } else {
        toast.info(res.message || "Saved pricing settings to local database.");
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save pricing configuration",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualSync() {
    setIsSyncing(true);
    try {
      const configData: PricingConfigData = {
        title,
        heroBadge,
        heroTitle,
        heroSubtitle,
        currencies,
        faqs,
      };
      const res = await syncPricingToSanity(configData);
      if (res.synced) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sanity sync failed",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  const updateCurrency = (index: number, fieldPath: string, val: string) => {
    setCurrencies((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = fieldPath.split(".");
      let obj = next[index];
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = val;
      return next;
    });
  };

  const addCurrency = () => {
    setCurrencies((prev) => [
      ...prev,
      {
        code: "GBP",
        symbol: "£",
        name: "GBP (£)",
        badge: "UK & Global",
        growth: {
          monthly: { amount: "£480", period: "/ month" },
          annual: {
            amount: "£400",
            period: "/ month",
            billedNote: "Billed annually (£4,800/yr)",
          },
        },
        scale: {
          monthly: { amount: "£1,440", period: "/ month" },
          annual: {
            amount: "£1,200",
            period: "/ month",
            billedNote: "Billed annually (£14,400/yr)",
          },
        },
        enterprise: {
          monthly: { amount: "Custom", period: "" },
          annual: { amount: "Custom", period: "" },
        },
      },
    ]);
  };

  const removeCurrency = (index: number) => {
    setCurrencies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: "q" | "a", val: string) => {
    setFaqs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { q: "New Question?", a: "New answer explanation..." },
    ]);
  };

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                Sanity CMS Pricing & Plan Configurations
              </CardTitle>
              <CardDescription>
                Manage public pricing copy, multi-currency plan rates, and FAQs.
                Saving automatically updates local settings and publishes live
                to Sanity CMS.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing || isSaving}
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Sync to Sanity
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || isSyncing}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save & Sync Live
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Hero Section Copy */}
          <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Hero Header Copy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="heroBadge">Badge Text</Label>
                <Input
                  id="heroBadge"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  placeholder="14-Day Free Trial • Instant Deployment • Zero Risk"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="heroTitle">Main Headline</Label>
                <Input
                  id="heroTitle"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Predictable Pricing Engineered for Limitless Enterprise Scale"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="heroSubtitle">Subtitle Description</Label>
              <Textarea
                id="heroSubtitle"
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
              />
            </div>
          </div>

          {/* Currencies & Tier Rates Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Multi-Currency Plan Pricing
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addCurrency}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" /> Add Currency
              </Button>
            </div>

            <Tabs defaultValue={currencies[0]?.code || "USD"}>
              <TabsList>
                {currencies.map((c) => (
                  <TabsTrigger key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </TabsTrigger>
                ))}
              </TabsList>

              {currencies.map((c, index) => (
                <TabsContent
                  key={c.code}
                  value={c.code}
                  className="mt-4 space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Currency Code</Label>
                      <Input
                        value={c.code}
                        onChange={(e) =>
                          updateCurrency(
                            index,
                            "code",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Symbol</Label>
                      <Input
                        value={c.symbol}
                        onChange={(e) =>
                          updateCurrency(index, "symbol", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Display Name</Label>
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          updateCurrency(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Badge Label</Label>
                      <Input
                        value={c.badge}
                        onChange={(e) =>
                          updateCurrency(index, "badge", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Plans Breakdown for this currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Growth Tier */}
                    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                      <span className="text-xs font-mono font-bold uppercase text-slate-400">
                        Growth Tier
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Monthly Amount</Label>
                          <Input
                            value={c.growth?.monthly?.amount || ""}
                            onChange={(e) =>
                              updateCurrency(
                                index,
                                "growth.monthly.amount",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Annual Monthly Rate</Label>
                          <Input
                            value={c.growth?.annual?.amount || ""}
                            onChange={(e) =>
                              updateCurrency(
                                index,
                                "growth.annual.amount",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Annual Note</Label>
                        <Input
                          value={c.growth?.annual?.billedNote || ""}
                          onChange={(e) =>
                            updateCurrency(
                              index,
                              "growth.annual.billedNote",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Scale Tier */}
                    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                      <span className="text-xs font-mono font-bold uppercase text-primary">
                        Scale Mesh Tier
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Monthly Amount</Label>
                          <Input
                            value={c.scale?.monthly?.amount || ""}
                            onChange={(e) =>
                              updateCurrency(
                                index,
                                "scale.monthly.amount",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Annual Monthly Rate</Label>
                          <Input
                            value={c.scale?.annual?.amount || ""}
                            onChange={(e) =>
                              updateCurrency(
                                index,
                                "scale.annual.amount",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Annual Note</Label>
                        <Input
                          value={c.scale?.annual?.billedNote || ""}
                          onChange={(e) =>
                            updateCurrency(
                              index,
                              "scale.annual.billedNote",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {currencies.length > 1 && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeCurrency(index)}
                        className="gap-1.5 text-xs"
                      >
                        <Trash2 className="size-3.5" /> Remove {c.code} Currency
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Pricing FAQ Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Pricing & Billing FAQs
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addFaq}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" /> Add FAQ Item
              </Button>
            </div>

            <div className="space-y-3">
              {faqs.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      className="font-semibold text-xs"
                      value={item.q}
                      onChange={(e) => updateFaq(idx, "q", e.target.value)}
                      placeholder="Question?"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFaq(idx)}
                      className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    className="text-xs"
                    value={item.a}
                    onChange={(e) => updateFaq(idx, "a", e.target.value)}
                    placeholder="Answer explanation..."
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
