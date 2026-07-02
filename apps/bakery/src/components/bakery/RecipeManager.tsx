import { useState, useMemo } from 'react';
import { useRecipes, useDeleteRecipe } from '@/hooks/bakery';
import { useDeleteConfirmation } from '@/lib/providers/delete-modal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  RefreshCw,
  UtensilsCrossed,
  Tag,
  Scaling,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Recipe } from '@/types/bakery';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Separator } from '@repo/ui/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import CreateEditRecipeDialog from './RecipeForm';
import { ViewRecipe } from './ViewRecipe';

export default function RecipeManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const { data: recipes = [], isLoading, error } = useRecipes();
  const deleteRecipeMutation = useDeleteRecipe();
  const formatCurrency = useFormattedCurrency();
  const { confirmDelete } = useDeleteConfirmation();

  const filteredRecipes = useMemo(() => {
    return recipes.filter(
      r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = await confirmDelete({
      entityType: 'recipe',
      entityName: recipe.name,
      description: `This will permanently delete the formula "${recipe.name}". This action cannot be undone.`,
      confirmText: 'Delete Formula',
    });

    if (confirmed) {
      try {
        await deleteRecipeMutation.mutateAsync(recipe.id);
        toast.success('Formula deleted successfully');
      } catch (err) {
        toast.error('Failed to delete formula');
      }
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsEditDialogOpen(true);
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsViewDialogOpen(true);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load production formulas. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/40 p-4 rounded-xl border border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search master formulas or classifications..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/10 transition-all rounded-lg"
              disabled={isLoading}
            />
          </div>

          <Button variant="outline" size="icon" className="h-11 w-11 border-border/50 bg-background/50 rounded-lg">
            <Filter className="h-4 w-4 text-muted-foreground/60" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="h-10 gap-2 text-xs border-border/60 font-medium"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            <Layers className="h-4 w-4" />
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>

          <Button
            className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm px-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Formula
          </Button>
        </div>
      </div>

      <CreateEditRecipeDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} mode="create" />
      {editingRecipe && (
        <CreateEditRecipeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          recipe={editingRecipe}
          mode="edit"
        />
      )}
      {selectedRecipe && (
        <ViewRecipe open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} recipe={selectedRecipe} />
      )}

      {viewMode === 'table' ? (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-border/30">
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 py-5 px-8">
                  Formula Name & Description
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                  Classification
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 text-right">
                  Standard Cost
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 text-right">
                  Target Yield
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 text-center">
                  Duration
                </TableHead>
                <TableHead className="w-[100px] pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-6 px-8">
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredRecipes.map(recipe => (
                    <TableRow key={recipe.id} className="group hover:bg-muted/10 transition-all border-border/20">
                      <TableCell className="py-5 px-8">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground/90 text-[14px] tracking-tight">{recipe.name}</span>
                          <span className="text-[11px] text-muted-foreground/70 font-medium line-clamp-1 max-w-[300px]">
                            {recipe.description || 'No description provided'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[9px] bg-background text-muted-foreground/80 font-bold uppercase tracking-widest border border-border/40 px-2 py-0.5 rounded-full"
                        >
                          {recipe.category?.name || 'Unclassified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-[14px] text-foreground/80">
                        {formatCurrency(recipe.totalCost || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-[14px] text-foreground/80">
                        {recipe.yieldQuantity}{' '}
                        <span className="text-[10px] text-muted-foreground/40 font-medium ml-0.5 uppercase tracking-tighter">
                          {typeof recipe.yieldUnit === 'string' ? recipe.yieldUnit : (recipe.yieldUnit as any)?.symbol}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-muted-foreground/70">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-3.5 w-3.5 opacity-30" />
                          {recipe.totalTime || recipe.prepTime || 0}m
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleViewRecipe(recipe)}
                            aria-label={`View ${recipe.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(recipe)}
                            aria-label={`Edit ${recipe.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(recipe)}
                            aria-label={`Delete ${recipe.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && filteredRecipes.length === 0 && (
            <div className="py-20 text-center">
              <UtensilsCrossed className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-bold text-muted-foreground">No formulas found in directory</p>
              <Button variant="link" className="text-xs mt-1" onClick={() => setSearchTerm('')}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-48">
                  <CardContent className="p-4">
                    <Skeleton className="h-full w-full" />
                  </CardContent>
                </Card>
              ))
            : filteredRecipes.map(recipe => (
                <Card
                  key={recipe.id}
                  className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1 pr-2">
                        {recipe.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase tracking-widest font-black border-none bg-muted px-1.5 py-0.5"
                      >
                        {recipe.category?.name || 'GEN'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-bold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {recipe.totalTime || 0}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Scaling className="h-3 w-3" /> Yield: {recipe.yieldQuantity}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-[9px] uppercase font-black text-muted-foreground/50 tracking-tighter">
                        Production Cost
                      </span>
                      <span className="text-lg font-black text-foreground tabular-nums tracking-tighter">
                        {formatCurrency(recipe.totalCost || 0)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {recipe.tags?.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[8px] px-1 py-0 bg-primary/10 text-primary border-none"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 p-2 flex justify-end gap-1 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleViewRecipe(recipe)}
                      aria-label={`View ${recipe.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(recipe)}
                      aria-label={`Edit ${recipe.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(recipe)}
                      aria-label={`Delete ${recipe.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
        </div>
      )}
    </div>
  );
}
