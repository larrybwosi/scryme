"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { format } from "date-fns";
import { Truck, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

export function DriverDeliveries({ fulfillments }: { fulfillments: any[] }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Truck size={18} className="text-gray-400" />
          Recent Deliveries
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fulfillments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-10 text-gray-500">
                No deliveries found for this driver.
              </TableCell>
            </TableRow>
          ) : (
            fulfillments.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">
                  {f.transaction.number}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      f.status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : f.status === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }>
                    {f.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{f.type}</TableCell>
                <TableCell>
                  {f.transaction.currencyCode}{" "}
                  {Number(f.transaction.finalTotal).toLocaleString()}
                </TableCell>
                <TableCell className="text-gray-500 text-xs">
                  {format(new Date(f.createdAt), "MMM d, h:mm a")}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/sales/transactions/${f.transactionId}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    View Order
                    <ExternalLink size={12} />
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
