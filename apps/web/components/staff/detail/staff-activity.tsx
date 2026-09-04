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
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShoppingCart size={20} className="text-blue-500" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Number</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs text-foreground">
                      {tx.number}
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: tx.currencyCode,
                      }).format(Number(tx.finalTotal))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground">
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
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <LogIn size={20} className="text-green-500" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceLogs.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">
                No attendance logs found.
              </p>
            ) : (
              attendanceLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-xl border border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-background border border-border shadow-sm">
                    <Clock size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-foreground">
                        {format(new Date(log.checkInTime), "EEEE, MMM d")}
                      </span>
                      {log.durationMinutes && (
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                          {Math.floor(log.durationMinutes / 60)}h{" "}
                          {log.durationMinutes % 60}m
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <LogIn size={10} /> Check-in
                        </span>
                        <span className="text-foreground">
                          {format(new Date(log.checkInTime), "HH:mm")}
                        </span>
                        <span className="flex items-center gap-1 truncate text-muted-foreground">
                          <MapPin size={10} /> {log.checkInLocation.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-border pl-3">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <LogOut size={10} /> Check-out
                        </span>
                        <span className="text-foreground">
                          {log.checkOutTime
                            ? format(new Date(log.checkOutTime), "HH:mm")
                            : "—"}
                        </span>
                        <span className="flex items-center gap-1 truncate text-muted-foreground">
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
