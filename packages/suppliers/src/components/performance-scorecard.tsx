"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Progress } from "@repo/ui/components/ui/progress";
import { Badge } from "@repo/ui/components/ui/badge";
import { Supplier } from "../types";
import {
  Truck,
  ShieldCheck,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";

interface PerformanceScorecardProps {
  supplier: Supplier;
}

export const PerformanceScorecard: React.FC<PerformanceScorecardProps> = ({
  supplier,
}) => {
  const p = supplier.performance;

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(p.qualityScore * 100).toFixed(1)}%
            </div>
            <Progress value={p.qualityScore * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              On-Time Delivery
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(p.onTimeDelivery * 100).toFixed(1)}%
            </div>
            <Progress value={p.onTimeDelivery * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(p.responseTime * 100).toFixed(1)}%
            </div>
            <Progress value={p.responseTime * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Aggregate Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <div className="text-2xl font-bold">{p.rating.toFixed(1)}</div>
              <div className="flex ml-2">{getRatingStars(p.rating)}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {p.totalOrders} orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reliability Analysis</CardTitle>
            <CardDescription>
              Historical performance over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fulfillment Accuracy</span>
                <span className="font-medium">98.2%</span>
              </div>
              <Progress value={98.2} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Invoicing Accuracy</span>
                <span className="font-medium">95.5%</span>
              </div>
              <Progress value={95.5} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Packaging Integrity</span>
                <span className="font-medium">99.1%</span>
              </div>
              <Progress value={99.1} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Assessment</CardTitle>
            <CardDescription>
              Supplier stability and compliance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={
                    supplier.riskLevel === "high"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }
                />
                <div>
                  <div className="text-sm font-medium capitalize">
                    {supplier.riskLevel} Risk Level
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated 3 days ago
                  </div>
                </div>
              </div>
              <Badge
                variant={supplier.riskLevel === "low" ? "default" : "outline"}
              >
                {supplier.riskLevel?.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Tax Compliance Valid (KRA PIN)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Business License Current</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Insurance Renewal Pending (30 days)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
