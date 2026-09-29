"use client";

import React from "react";
import { DollarSign, Tag, Plus, TrendingUp, Percent } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

interface PricingTabProps {
  product: any;
  setProduct: (v: any) => void;
}

export function PricingTab({ product, setProduct }: PricingTabProps) {
  const retailPrice = Number(product.variants?.[0]?.retailPrice || 0);
  const buyingPrice = Number(product.variants?.[0]?.buyingPrice || 0);
  const marginPercentage =
    retailPrice > 0 ? ((1 - buyingPrice / retailPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 mt-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Retail Price
              </CardTitle>
              <CardDescription className="text-xs">
                Default selling price
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                className="pl-8 text-lg font-bold h-10"
                value={retailPrice}
                onChange={e => {
                  const updatedVariants = [...(product.variants || [])];
                  updatedVariants[0] = {
                    ...updatedVariants[0],
                    retailPrice: Number(e.target.value),
                  };
                  setProduct({ ...product, variants: updatedVariants });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Cost Price
              </CardTitle>
              <CardDescription className="text-xs">
                Base buying/manufacturing cost
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                className="pl-8 text-lg font-bold h-10"
                value={buyingPrice}
                onChange={e => {
                  const updatedVariants = [...(product.variants || [])];
                  updatedVariants[0] = {
                    ...updatedVariants[0],
                    buyingPrice: Number(e.target.value),
                  };
                  setProduct({ ...product, variants: updatedVariants });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Margin
              </CardTitle>
              <CardDescription className="text-xs">
                Estimated profit percentage
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-10 flex items-center justify-between px-3 bg-muted/50 rounded-md border border-border">
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {marginPercentage}%
              </span>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Loyalty & Points</CardTitle>
          <CardDescription>
            Configure points earned on purchase.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Base Points (Product Level)</Label>
            <Input
              type="number"
              value={product.pointsOnPurchase || 0}
              onChange={e =>
                setProduct({
                  ...product,
                  pointsOnPurchase: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Points Override</Label>
            <Input
              type="number"
              value={product.loyaltyPointsOverride || 0}
              onChange={e =>
                setProduct({
                  ...product,
                  loyaltyPointsOverride: Number(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Price Lists & Rules</CardTitle>
            <CardDescription>
              Assign special pricing for customer segments or events.
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Create Rule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-6 border border-dashed border-border flex flex-col items-center justify-center text-center">
              <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h4 className="font-bold text-foreground mb-1">
                No custom pricing rules found
              </h4>
              <p className="text-sm text-muted-foreground max-w-[300px]">
                Create rules to offer discounts for bulk orders,
                specific seasons or VIP customers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
