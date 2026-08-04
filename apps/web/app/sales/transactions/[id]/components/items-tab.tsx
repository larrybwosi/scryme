"use client";

import React from "react";
import { Card } from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";

interface ItemsTabProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
}

export function ItemsTab({ transaction, formatCurrency }: ItemsTabProps) {
  return (
    <Card className="overflow-hidden border-border bg-card rounded-none shadow-sm dark:shadow-none py-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest">
                Item
              </th>
              <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-center w-20">
                Qty
              </th>
              <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-right w-36">
                Unit price
              </th>
              <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-right w-36">
                Line total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transaction.items && transaction.items.length > 0 ? (
              transaction.items.map((item: any) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground text-sm">
                        {item.productName || "Product"}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground font-normal">
                        {item.variantName
                          ? `${item.variantName} • `
                          : ""}
                        {item.sku || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-medium text-muted-foreground text-sm">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium text-muted-foreground text-sm">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-foreground text-sm">
                    {formatCurrency(Number(item.lineTotal))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground italic"
                >
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border p-6 bg-muted/20 flex justify-end rounded-none">
        <div className="w-full sm:max-w-md space-y-3 font-medium text-xs text-foreground">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {formatCurrency(Number(transaction.subtotal))}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Tax</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {formatCurrency(Number(transaction.taxTotal || 0))}
            </span>
          </div>
          {Number(transaction.discountTotal) > 0 && (
            <div className="flex justify-between items-center text-red-500">
              <span>Discount</span>
              <span className="font-mono font-bold text-red-500 text-sm">
                -{formatCurrency(Number(transaction.discountTotal))}
              </span>
            </div>
          )}
          <Separator className="bg-border my-2" />
          <div className="flex justify-between items-baseline text-foreground">
            <span className="font-bold text-sm uppercase tracking-wider">
              Total
            </span>
            <span className="font-mono text-xl font-black text-foreground tracking-tight">
              {formatCurrency(Number(transaction.finalTotal))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
