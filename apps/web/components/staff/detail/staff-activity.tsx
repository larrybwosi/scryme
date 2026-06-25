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
import { ShoppingCart, LogIn, LogOut, MapPin, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

export function StaffActivity({
  transactions,
  attendanceLogs,
}: {
  transactions: any[];
  attendanceLogs: any[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Transactions */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-500" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-gray-500">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs">
                      {tx.number}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: tx.currencyCode,
                      }).format(Number(tx.finalTotal))}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <LogIn size={20} className="text-green-500" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceLogs.length === 0 ? (
              <p className="text-center py-6 text-gray-500 text-sm">
                No attendance logs found.
              </p>
            ) : (
              attendanceLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-xl border bg-gray-50/50">
                  <div className="p-2 rounded-lg bg-white border shadow-sm">
                    <Clock size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">
                        {format(new Date(log.checkInTime), "EEEE, MMM d")}
                      </span>
                      {log.durationMinutes && (
                        <Badge variant="secondary" className="text-[10px]">
                          {Math.floor(log.durationMinutes / 60)}h{" "}
                          {log.durationMinutes % 60}m
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <LogIn size={10} /> Check-in
                        </span>
                        <span>
                          {format(new Date(log.checkInTime), "HH:mm")}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={10} /> {log.checkInLocation.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-l pl-3">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <LogOut size={10} /> Check-out
                        </span>
                        <span>
                          {log.checkOutTime
                            ? format(new Date(log.checkOutTime), "HH:mm")
                            : "—"}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={10} />{" "}
                          {log.checkOutLocation?.name || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
