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

  const getIconConfig = () => {
    switch (icon) {
      case "revenue":
        return {
          icon: <DollarSign className="h-4 w-4" />,
          bg: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
        };
      case "sales":
        return {
          icon: <ShoppingCart className="h-4 w-4" />,
          bg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20",
        };
      case "avg-revenue":
        return {
          icon: <BarChart3 className="h-4 w-4" />,
          bg: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
        };
      case "avg-order":
        return {
          icon: <Users className="h-4 w-4" />,
          bg: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
        };
      default:
        return {
          icon: <BarChart3 className="h-4 w-4" />,
          bg: "bg-muted text-muted-foreground",
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Card className="p-5 bg-card border-border/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-xl flex items-center justify-center", iconConfig.bg)}>
            {iconConfig.icon}
          </div>
          <span className="text-xs font-semibold text-muted-foreground tracking-tight">
            {title}
          </span>
          {showTooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={`${title} information`}>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
            )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-0.5 shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5 shrink-0" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
      </div>
    </Card>
  );
}
