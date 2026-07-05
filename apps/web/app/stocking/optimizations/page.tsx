"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  TrendingUp,
  ArrowLeftRight,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { getStockTransferRecommendations, createStockTransfer } from "@/app/actions/stock-management";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";

export default function StockOptimizationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const data = await getStockTransferRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast.error("Failed to load optimizations");
    } finally {
      setLoading(false);
    }
  }

  const handleExecute = async (rec: any) => {
    setExecuting(`${rec.variantId}-${rec.fromLocationId}-${rec.toLocationId}`);
    try {
      await createStockTransfer({
        fromLocationId: rec.fromLocationId,
        toLocationId: rec.toLocationId,
        items: [{ variantId: rec.variantId, quantity: rec.suggestedQuantity }],
        notes: `AI Recommendation: ${rec.reason}`,
      });
      toast.success("Transfer request created successfully");
      fetchRecommendations();
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <PageHeader
        title="Stock Optimizations"
        description="Smart recommendations to balance inventory levels across your organization based on sales velocity."
        icon={<TrendingUp size={24} />}
      />

      <Alert variant="info" className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">How it works</AlertTitle>
        <AlertDescription className="text-blue-700">
          We analyze sales data from the last 30 days to calculate daily velocity.
          Recommendations suggest moving stock from locations with &quot;Dead Stock&quot; (excessive coverage)
          to locations with &quot;Stock Out Risk&quot; (high demand, low stock).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transfer Recommendations</CardTitle>
              <CardDescription>
                Suggested internal movements to maximize sales potential.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendations} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Product</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead>To Location</TableHead>
                <TableHead className="text-center">Suggest Qty</TableHead>
                <TableHead>Reasoning</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-zinc-400" />
                    Analyzing sales velocity...
                  </TableCell>
                </TableRow>
              ) : recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                    Inventory is currently well-balanced across all locations.
                  </TableCell>
                </TableRow>
              ) : (
                recommendations.map((rec, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{rec.productName}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">{rec.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{rec.fromLocationName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-blue-200 text-blue-700 bg-blue-50/50">{rec.toLocationName}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">
                      {rec.suggestedQuantity}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="flex items-start gap-2">
                        {rec.priority === "HIGH" ? <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" /> : <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />}
                        <p className="text-xs text-gray-600 leading-relaxed">{rec.reason}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 h-8"
                        onClick={() => handleExecute(rec)}
                        disabled={executing === `${rec.variantId}-${rec.fromLocationId}-${rec.toLocationId}`}
                      >
                        {executing === `${rec.variantId}-${rec.fromLocationId}-${rec.toLocationId}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ArrowLeftRight size={14} />
                        )}
                        Execute
                      </Button>
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
