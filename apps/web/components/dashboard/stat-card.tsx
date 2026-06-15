import { Card } from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  label: string;
  icon?: "revenue" | "sales" | "avg-revenue" | "avg-order";
  showTooltip?: boolean;
  tooltipText?: string;
}

export function StatCard({
  title,
  value,
  change,
  label,
  icon,
  showTooltip,
  tooltipText,
}: StatCardProps) {
  const isPositive = change >= 0;

  const getIcon = () => {
    switch (icon) {
      case "revenue":
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case "sales":
        return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
      case "avg-revenue":
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
      case "avg-order":
        return <Users className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-white border-none shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm flex items-center gap-1">
          {getIcon()}
          {title}
        </span>
        {showTooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <div
          className={cn(
            "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full",
            isPositive
              ? "text-green-600 bg-green-50"
              : "text-red-600 bg-red-50",
          )}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
    </Card>
  );
}
