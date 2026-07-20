"use client";

import React from "react";
import { BarChart3, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";

export function ReportsView() {
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-[17px] font-bold text-foreground tracking-tight">CRM Reports</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Analyze your sales performance and customer growth.
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Sales Performance", desc: "Detailed breakdown of won/lost deals." },
            { title: "Lead Conversion", desc: "Track how leads move through your funnel." },
            { title: "Customer Growth", desc: "New vs. returning customers over time." },
          ].map((report, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <BarChart3 size={16} />
                </div>
                <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
                <CardDescription className="text-xs">{report.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                  <FileText size={13} />
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
