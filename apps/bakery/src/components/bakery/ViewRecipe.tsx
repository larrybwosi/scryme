import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { Badge } from '@repo/ui/components/ui/badge';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Recipe } from '@/types/bakery';
import { Clock, Thermometer, Scale, ChefHat, Info, Flame } from 'lucide-react';
// import Image from 'next/image';
import Markdown from 'markdown-to-jsx';
import { useFormattedCurrency } from '@/lib/utils';
import { useRecipe } from '@/hooks/bakery';
import sanityLoader from '@/lib/sanity-loader';

interface ViewRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
}

const DIFFICULTY_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  EASY:   { label: 'Easy',   classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium', classes: 'bg-amber-50 text-amber-700 border-amber-200',         dot: 'bg-amber-500' },
  HARD:   { label: 'Hard',   classes: 'bg-orange-50 text-orange-700 border-orange-200',      dot: 'bg-orange-500' },
  EXPERT: { label: 'Expert', classes: 'bg-rose-50 text-rose-700 border-rose-200',            dot: 'bg-rose-500' },
};

function StatCard({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xl font-semibold text-foreground tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function ViewRecipe({ open, onOpenChange, recipe }: ViewRecipeSheetProps) {
  const formattedCurrency = useFormattedCurrency();
  const { data: recipeData, isLoading } = useRecipe(recipe?.id || '');
  const toNumber = (val: any) => Number(val || 0);

  const difficulty = recipeData?.difficulty ? DIFFICULTY_CONFIG[recipeData.difficulty as string] : null;

  if (!recipe && !open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col gap-0 border-l border-border/80 shadow-2xl">

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 px-8 pt-7 pb-5 border-b border-border/60 bg-card">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0 text-left">
                {recipeData?.category?.name && (
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                    {recipeData.category.name}
                  </p>
                )}
                <SheetTitle className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {recipeData?.name || recipe?.name}
                </SheetTitle>
                {recipeData?.producesVariant && (
                  <SheetDescription className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Produces</span>
                    <span className="font-medium text-foreground">
                      {(recipeData.producesVariant as any).product?.name}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-muted-foreground">{recipeData.producesVariant.name}</span>
                  </SheetDescription>
                )}
              </div>
              {difficulty && (
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${difficulty.classes}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${difficulty.dot}`} />
                  {difficulty.label}
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        {/* ── BODY ── */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-8 py-7 space-y-8">

            {isLoading ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : recipeData ? (
              <>
                {/* ── HERO: Image + Stats ── */}
                <div className="flex flex-col gap-6">
                  {(recipeData.producesVariant as any)?.product?.imageUrls?.[0] && (
                    <div className="w-full">
                      <img
                        src={(recipeData.producesVariant as any).product.imageUrls[0]}
                        alt={(recipeData.producesVariant as any).product.name}
                        className="w-full h-48 object-cover rounded-xl border border-border/60"

                        width={600}
                        height={200}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={Scale}
                        label="Yield"
                        value={toNumber(recipeData.yieldQuantity)}
                        unit={(recipeData.systemUnit as any)?.symbol || (recipeData.orgUnit as any)?.symbol}
                      />
                      <StatCard icon={Clock} label="Prep" value={recipeData.prepTime || 0} unit="min" />
                      <StatCard icon={Flame} label="Bake" value={recipeData.bakeTime || 0} unit="min" />
                      <StatCard
                        icon={Thermometer}
                        label="Temp"
                        value={recipeData.temperatureCelsius ? `${recipeData.temperatureCelsius}°` : '—'}
                        unit={recipeData.temperatureCelsius ? 'C' : undefined}
                      />
                    </div>
                    {recipeData.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {recipeData.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── DIVIDER ── */}
                <div className="h-px bg-border/60" />

                {/* ── INGREDIENTS ── */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
                    Ingredients
                  </h3>
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/60">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Ingredient
                          </th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Qty
                          </th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {recipeData.ingredients?.map((item: any) => (
                          <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-foreground">
                                {item.ingredientVariant?.product?.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {item.ingredientVariant?.name}
                              </div>
                              {item.preparationNotes && (
                                <div className="text-[10px] text-amber-600 mt-1 italic">
                                  {item.preparationNotes}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <span className="font-semibold text-foreground">{toNumber(item.quantity)}</span>
                              <span className="text-muted-foreground ml-1 text-[10px]">
                                {item.systemUnit?.symbol || item.orgUnit?.symbol}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right text-muted-foreground">
                              {formattedCurrency(item.calculatedCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/40 border-t border-border/60">
                          <td className="px-4 py-3 text-xs font-semibold text-foreground" colSpan={2}>
                            Total Estimated Cost
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700 text-xs">
                            {formattedCurrency(recipeData.totalCost as number)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* ── INSTRUCTIONS & NOTES ── */}
                {(recipeData.instructions || recipeData.notes) && (
                  <div className="space-y-6">
                    {recipeData.instructions && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                          <ChefHat className="w-3.5 h-3.5" />
                          Instructions
                        </h3>
                        <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-4 text-sm text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                          <Markdown>{recipeData.instructions}</Markdown>
                        </div>
                      </div>
                    )}
                    {recipeData.notes && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-700/80 flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" />
                          Chef's Notes
                        </h3>
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-5 py-4 text-sm text-amber-900 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                          <Markdown>{recipeData.notes}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <ChefHat className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Recipe data could not be loaded.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
