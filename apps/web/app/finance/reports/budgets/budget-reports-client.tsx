"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { getBudgetVarianceReport } from "../../../actions/expense-reports";
import { Download, Printer, PieChart, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function BudgetReportsClient() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBudgetVarianceReport();
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
    if (!report?.items) return;
    const headers = "Budget Name,Budgeted,Spent,Committed,Variance,Utilization %\n";
    const rows = report.items
      .map((b: any) =>
        `"${b.name}",${b.budgeted},${b.spent},${b.committed},${b.variance},${b.percentage.toFixed(1)}%`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-variance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading && !report) return <div className="p-8 text-center text-muted-foreground">Loading budget variance report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budget vs. Actual Variance Analysis</h2>
          <p className="text-muted-foreground">Track budgeted amounts against committed and actual spent expenditures.</p>
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
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(report?.totalBudgeted || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Approved allocations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(report?.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Invoiced / paid expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${(report?.totalCommitted || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Approved POs pending bill</p>
          </CardContent>
        </Card>

        <Card className={report?.totalVariance >= 0 ? "border-green-500" : "border-red-500"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Variance</CardTitle>
            <Badge className={report?.totalVariance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {report?.totalVariance >= 0 ? "Under Budget" : "Over Budget"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${report?.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${(report?.totalVariance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Remaining headroom</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Variance Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget Name</TableHead>
                <TableHead>Category / Cost Center</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No active budgets found</TableCell>
                </TableRow>
              ) : (
                report?.items?.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{b.categoryName}</span>
                        <span className="text-xs text-muted-foreground">{b.costCenterName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(b.periodStart), "MMM d, yyyy")} - {format(new Date(b.periodEnd), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">${b.budgeted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">${b.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">${b.committed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-medium ${b.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${b.variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Badge className={b.percentage > 100 ? "bg-red-100 text-red-700" : b.percentage > 80 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                        {b.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
