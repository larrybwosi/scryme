"use client";

import { useState } from "react";
import { Landmark, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";

export function ReconciliationClient() {
  // Mock data for UI demonstration
  const [transactions, setTransactions] = useState([
    { id: "1", date: "2023-10-01", description: "M-PESA B2C - MP123456", amount: -5000, status: "MATCHED", match: "Expense EXP-001" },
    { id: "2", date: "2023-10-02", description: "M-PESA C2B - QS987654", amount: 12500, status: "UNMATCHED", match: null },
    { id: "3", date: "2023-10-03", description: "Bank Transfer DEP-111", amount: 50000, status: "UNMATCHED", match: null },
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Internal Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 1,250,400</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bank Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 1,262,900</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">KES 12,500</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Unreconciled Transactions</CardTitle>
              <CardDescription>Match bank statement lines with internal records.</CardDescription>
            </div>
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Auto-Match
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Suggested Match</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-right font-mono">
                    {tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {tx.status === "MATCHED" ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Matched
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        <AlertCircle className="w-3 h-3 mr-1" /> Unmatched
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground italic">
                    {tx.match || (tx.id === "2" ? "Order ORD-1234 (KES 12,500)" : "-")}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.status === "UNMATCHED" && (
                      <Button size="sm" variant="outline">Match</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
