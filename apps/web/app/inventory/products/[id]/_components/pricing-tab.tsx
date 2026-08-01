"use client";

import React from "react";
import { DollarSign, Tag, Plus } from "lucide-react";
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
  return (
    <div className="space-y-6 mt-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Retail Price</CardTitle>
            <CardDescription>Default selling price.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                className="pl-9 text-2xl font-bold h-14"
                value={Number(product.variants?.[0]?.retailPrice || 0)}
                onChange={e => {
                  const updatedVariants = [...product.variants];
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
          <CardHeader>
            <CardTitle className="text-lg">Cost Price</CardTitle>
            <CardDescription>
              Base manufacturing/buying cost.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                className="pl-9 text-2xl font-bold h-14"
                value={Number(product.variants?.[0]?.buyingPrice || 0)}
                onChange={e => {
                  const updatedVariants = [...product.variants];
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
          <CardHeader>
            <CardTitle className="text-lg">Margin</CardTitle>
            <CardDescription>
              Estimated profit percentage.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-14 flex items-center">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {(
                (1 -
                  Number(product.variants?.[0]?.buyingPrice || 0) /
                    Number(product.variants?.[0]?.retailPrice || 1)) *
                100
              ).toFixed(1)}
              %
            </span>
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
