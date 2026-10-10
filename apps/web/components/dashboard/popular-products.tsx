import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Maximize2, MoreHorizontal, HelpCircle, Package, Award } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface PopularProductsProps {
  products: {
    id: string;
    name: string;
    sales: number;
    color: string;
  }[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  const maxSales =
    products.length > 0 ? Math.max(...products.map((p) => p.sales)) : 0;

  return (
    <Card className="p-6 bg-card border-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Top Popular Products
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Popular products information">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Top performing products ranked by total unit sales volume.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  aria-label="Maximize popular products chart">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Maximize</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  aria-label="More options for popular products">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-4">
          {products.map((product, idx) => (
            <div key={product.id} className="space-y-1.5 group">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate max-w-[210px]">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground/70 w-4">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </span>
                </div>
                <span className="text-muted-foreground font-mono text-[11px] font-medium">
                  {product.sales.toLocaleString()} sales
                </span>
              </div>
              <div className="relative h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{
                    width: `${maxSales > 0 ? (product.sales / maxSales) * 100 : 0}%`,
                    backgroundColor: product.color,
                  }}
                />
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs">
              <Package className="h-8 w-8 mb-2 opacity-40" />
              <span>No product sales recorded for this timeframe</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-border/40 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Ranked by volume</span>
        <Button
          variant="link"
          className="text-xs font-semibold text-primary p-0 h-auto hover:text-primary/80">
          View All Products →
        </Button>
      </div>
    </Card>
  );
}
