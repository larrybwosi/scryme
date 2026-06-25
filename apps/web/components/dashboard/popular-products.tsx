import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Maximize2, MoreHorizontal, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { Progress } from "@repo/ui/components/ui/progress";

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
    products.length > 0 ? Math.max(...products.map(p => p.sales)) : 0;

  // Dynamic scale generation
  const getScale = () => {
    if (maxSales === 0) return [0, 2000, 4000, 6000, 8000];
    const step = Math.ceil(maxSales / 4 / 100) * 100;
    return [0, step, step * 2, step * 3, step * 4];
  };

  const scale = getScale();
  const formatScale = (val: number) =>
    val >= 1000 ? (val / 1000).toFixed(0) + "K" : val;

  return (
    <Card className="p-6 bg-white border-none shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Popular Product
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Popular products information">
                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Top performing products by sales volume.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
                className="h-8 w-8"
                aria-label="More options for popular products">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {products.map(product => (
          <div key={product.id} className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-xs truncate max-w-[200px]">
                {product.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {product.sales.toLocaleString()} Sales
              </span>
            </div>
            <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxSales > 0 ? (product.sales / maxSales) * 100 : 0}%`,
                  backgroundColor: product.color,
                }}
              />
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic">
            No data for this period
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
          {scale.map(s => (
            <span key={s}>{formatScale(s)}</span>
          ))}
        </div>
        <Button
          variant="link"
          className="text-xs font-semibold text-black p-0 h-auto">
          View More
        </Button>
      </div>
    </Card>
  );
}
