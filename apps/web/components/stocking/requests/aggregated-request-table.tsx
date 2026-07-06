"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Package,
  Truck,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FulfillmentModal } from "./fulfillment-modal";

interface AggregatedItem {
  variantId: string;
  sku: string;
  name: string;
  variantName: string;
  totalRequested: number;
  totalAllocated: number;
  totalRemaining: number;
  categoryName: string;
  preferredSupplier: string;
  requests: {
    requestId: string;
    requestNumber: string;
    locationName: string;
    quantity: number;
    remaining: number;
  }[];
}

export function AggregatedRequestTable({ data }: { data: AggregatedItem[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fulfillmentItem, setFulfillmentItem] = useState<AggregatedItem | null>(
    null,
  );

  const toggleRow = (variantId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(variantId)) {
      newExpanded.delete(variantId);
    } else {
      newExpanded.add(variantId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Total Requested</TableHead>
            <TableHead className="text-center">Total Allocated</TableHead>
            <TableHead className="text-center">Remaining</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                No pending items in any stock requests.
              </TableCell>
            </TableRow>
          ) : (
            data.map(item => (
              <React.Fragment key={item.variantId}>
                <TableRow
                  className="hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => toggleRow(item.variantId)}>
                  <TableCell>
                    {expandedRows.has(item.variantId) ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {item.name}{" "}
                        {item.variantName !== "Default" &&
                          ` - ${item.variantName}`}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono uppercase">
                        {item.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-[10px]">
                      {item.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {item.totalRequested}
                  </TableCell>
                  <TableCell className="text-center text-green-600">
                    {item.totalAllocated}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        item.totalRemaining > 0 ? "secondary" : "outline"
                      }
                      className="px-2 h-5">
                      {item.totalRemaining}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={e => {
                        e.stopPropagation();
                        setFulfillmentItem(item);
                      }}>
                      <Package size={14} />
                      Fulfill
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(item.variantId) && (
                  <TableRow className="bg-gray-50/30">
                    <TableCell colSpan={7} className="p-0">
                      <div className="px-12 py-3 border-l-4 border-blue-200">
                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                          Breakdown by Request
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {item.requests.map(req => (
                            <div
                              key={req.requestId}
                              className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-blue-600">
                                  {req.requestNumber}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {req.locationName}
                                </span>
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="text-xs text-gray-400">
                                  Requested: {req.quantity}
                                </span>
                                <span className="text-xs font-bold text-amber-600">
                                  Remaining: {req.remaining}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>

      {fulfillmentItem && (
        <FulfillmentModal
          isOpen={!!fulfillmentItem}
          onClose={() => setFulfillmentItem(null)}
          item={fulfillmentItem}
        />
      )}
    </>
  );
}
