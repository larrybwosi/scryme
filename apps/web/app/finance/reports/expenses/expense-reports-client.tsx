"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { getExpenseAnalyticsReport } from "../../../actions/expense-reports";
import { Download, Printer, PieChart, Building2, Receipt } from "lucide-react";
import { format } from "date-fns";

export function ExpenseReportsClient() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenseAnalyticsReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const exportCSV = () => {
    if (!report?.expenses) return;
    const headers = "Expense Number,Description,Amount,Tax,Status,Date,Category\n";
    const rows = report.expenses
      .map((e: any) =>
        `"${e.expenseNumber}","${e.description}",${e.amount},${e.taxAmount || 0},"${e.status}","${e.expenseDate}","${e.category?.name || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading && !report) return <div className="p-8 text-center text-muted-foreground">Loading expense analytics report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Category & Analytics Report</h2>
          <p className="text-muted-foreground">Detailed breakdown of operating spend across categories and cost centers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operating Spend</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(report?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">All recorded expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Spend</CardTitle>
            <Badge className="bg-green-100 text-green-700">Approved</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(report?.approvedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Posted to General Ledger</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${(report?.pendingTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting sign-off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claimable Tax</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(report?.totalTaxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Input tax amount</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-zinc-500" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.categoryBreakdown?.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right">${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-zinc-500" />
              Cost Center Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.costCenterBreakdown?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No cost centers recorded</TableCell>
                  </TableRow>
                ) : (
                  report?.costCenterBreakdown?.map((cc: any) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium">{cc.name}</TableCell>
                      <TableCell><Badge variant="outline">{cc.code}</Badge></TableCell>
                      <TableCell className="text-right">${cc.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.expenses?.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{format(new Date(e.expenseDate), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{e.expenseNumber}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell><Badge variant="outline">{e.category?.name}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
