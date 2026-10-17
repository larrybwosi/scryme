import { Card } from "@repo/ui/components/ui/card";
import { Package, ShoppingBag, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  label?: string;
  icon: "products" | "sales" | "income" | "expenses";
}

export function StatCard({ title, value, change, label, icon }: StatCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "products":
        return <Package className="h-5 w-5 text-indigo-500" />;
      case "sales":
        return <ShoppingBag className="h-5 w-5 text-purple-500" />;
      case "income":
        return <ArrowDownLeft className="h-5 w-5 text-emerald-500" />;
      case "expenses":
        return <ArrowUpRight className="h-5 w-5 text-rose-500" />;
    }
  };

  const getIconBg = () => {
    switch (icon) {
      case "products":
        return "bg-indigo-50 dark:bg-indigo-950/40";
      case "sales":
        return "bg-purple-50 dark:bg-purple-950/40";
      case "income":
        return "bg-emerald-50 dark:bg-emerald-950/40";
      case "expenses":
        return "bg-rose-50 dark:bg-rose-950/40";
    }
  };

  return (
    <Card className="p-5 bg-card border-border/60 shadow-xs hover:shadow-sm transition-all rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${getIconBg()}`}>
          {getIcon()}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <h4 className="text-xl font-bold text-foreground mt-1 tracking-tight">
            {value}
          </h4>
        </div>
      </div>
    </Card>
  );
}
