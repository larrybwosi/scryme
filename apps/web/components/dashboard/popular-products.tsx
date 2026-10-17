"use client";

import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowUpDown, Filter, Smartphone, Laptop, Headphones, Package } from "lucide-react";
import { PopularProduct } from "../../app/actions/dashboard";

interface PopularProductsProps {
  products: PopularProduct[];
  currency?: string;
}

export function PopularProducts({ products, currency = "USD" }: PopularProductsProps) {
  const displayProducts = products && products.length > 0 ? products : [
    {
      id: "p1",
      name: "iPhone 15 Pro",
      stocks: 6200,
      price: 999.0,
      sales: 4800,
      earnings: 4795200,
      color: "#3B82F6",
    },
    {
      id: "p2",
      name: "MacBook Air M2",
      stocks: 1020,
      price: 1299.0,
      sales: 3200,
      earnings: 4156800,
      color: "#A855F7",
    },
    {
      id: "p3",
      name: "Google Pixel 8",
      stocks: 1500,
      price: 699.0,
      sales: 800,
      earnings: 559200,
      color: "#EAB308",
    },
    {
      id: "p4",
      name: "Nike Air Max 90",
      stocks: 2400,
      price: 130.0,
      sales: 1800,
      earnings: 234000,
      color: "#EC4899",
    },
    {
      id: "p5",
      name: "Galaxy Buds Pro",
      stocks: 850,
      price: 199.0,
      sales: 1000,
      earnings: 199000,
      color: "#22C55E",
    },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(val);

  const formatCurrencyWhole = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  const getProductIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("phone") || lower.includes("pixel")) {
      return <Smartphone className="h-4 w-4 text-slate-600 dark:text-slate-300" />;
    }
    if (lower.includes("macbook") || lower.includes("laptop")) {
      return <Laptop className="h-4 w-4 text-purple-600 dark:text-purple-300" />;
    }
    if (lower.includes("buds") || lower.includes("headphone") || lower.includes("audio")) {
      return <Headphones className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />;
    }
    return <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />;
  };

  return (
    <Card className="p-6 bg-card border-border/60 shadow-xs rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
          Top Products
        </h3>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium border-border/60 rounded-xl gap-1.5"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            Sort
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium border-border/60 rounded-xl gap-1.5"
          >
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground font-medium">
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 font-medium text-right">Stocks</th>
              <th className="pb-3 font-medium text-right">Price</th>
              <th className="pb-3 font-medium text-right">Sales</th>
              <th className="pb-3 font-medium text-right">Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {displayProducts.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      {getProductIcon(p.name)}
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 text-right font-medium text-foreground">
                  {p.stocks.toLocaleString()}
                </td>
                <td className="py-3.5 text-right font-medium text-foreground">
                  {formatCurrency(p.price)}
                </td>
                <td className="py-3.5 text-right font-medium text-foreground">
                  {p.sales.toLocaleString()}
                </td>
                <td className="py-3.5 text-right font-bold text-foreground">
                  {formatCurrencyWhole(p.earnings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
