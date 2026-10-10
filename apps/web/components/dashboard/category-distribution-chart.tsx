"use client";

import { Card } from "@repo/ui/components/ui/card";
import { CategoryDistribution } from "../../app/actions/dashboard";
import { PieChart as PieChartIcon, HelpCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface CategoryDistributionChartProps {
  data: CategoryDistribution[];
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const totalVolume = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card className="p-6 bg-card border-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <PieChartIcon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Sales by Product Share
            </h3>
            <UITooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Category distribution info">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Volume distribution of top product variants sold.</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
            {totalVolume.toLocaleString()} units
          </span>
        </div>

        {data.length > 0 ? (
          <div className="relative h-[180px] w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${(Number(value) || 0).toLocaleString()} units`, "Sales"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center metric inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-foreground">
                {totalVolume.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Total Units
              </span>
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs italic">
            No product data available
          </div>
        )}
      </div>

      {/* Legend list */}
      <div className="space-y-2 pt-3 border-t border-border/40">
        {data.slice(0, 4).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate max-w-[180px]">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-foreground truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-foreground font-semibold">{item.percentage}%</span>
              <span className="text-muted-foreground">({item.value.toLocaleString()})</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
