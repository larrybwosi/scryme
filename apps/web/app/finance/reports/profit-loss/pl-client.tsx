"use client";

import { useState, useEffect, useCallback } from "react";
import { getProfitLoss } from "../../../actions/accounting";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { formatCurrency } from "../../../../lib/utils";
import { DateRangePicker } from "@repo/ui/components/date-range-picker";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";

export function PLClient() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProfitLoss(
        dateRange.from.toISOString(),
        dateRange.to.toISOString(),
      );
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading && !report) return <div>Loading report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
        {/* Date Range Picker Placeholder */}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {report?.revenue.map((item: any) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right">
                    {report?.totalRevenue.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {report?.expenses.map((item: any) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total Expenses</TableCell>
                  <TableCell className="text-right">
                    ({report?.totalExpenses.toLocaleString()})
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card
          className={
            report?.netProfit >= 0 ? "border-green-500" : "border-red-500"
          }>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Net Profit / (Loss)</span>
              <span>{report?.netProfit.toLocaleString()}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
