import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import { AlertCircle, Tag, Plus, Search, X } from 'lucide-react';
import { useNavigate as useRouter } from 'react-router';
import { useBakeryCategories, useProductCategories } from '@/hooks/bakery';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategorySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeCategory?: string;
  type?: 'bakery' | 'product';
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select a category',
  disabled = false,
  required = false,
  excludeCategory,
  type = 'bakery',
}) => {
  const navigate = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const bakeryCategories = useBakeryCategories();
  const productCategories = useProductCategories();

  const { data: categories, isLoading: loadingCategories, error } = type === 'bakery' ? bakeryCategories : productCategories;

  const handleCreateCategory = () => {
    if (type === 'bakery') {
      navigate('/categories?create=true');
    } else {
      // For now just redirect to categories, maybe later we add product categories page
      navigate('/categories?create=true');
    }
  };

  // Filter categories based on search query and exclusion
  const filteredCategories = useMemo(() => {
    if (!categories) return [];

    let filtered = excludeCategory ? categories.filter((category: any) => category.id !== excludeCategory) : categories;

    if (searchQuery.trim()) {
      filtered = filtered.filter((category: any) => category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered;
  }, [categories, excludeCategory, searchQuery]);

  // Get selected category for display
  const selectedCategory = categories?.find((cat: any) => cat.id === value);

  if (loadingCategories) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load categories. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={handleCreateCategory}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag className="h-4 w-4" />
          <span>No categories available</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium"
          onClick={handleCreateCategory}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create one
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="h-10">
        <SelectValue placeholder={placeholder}>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm border border-muted-foreground/20"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span>{selectedCategory.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <div className="flex items-center gap-2 px-2 pb-2 sticky top-0 bg-popover z-10">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-8"
              onKeyDown={e => {
                // Prevent select from closing when typing
                e.stopPropagation();
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category list */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-sm border border-muted-foreground/20"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No categories found</p>
              {searchQuery && <p className="text-xs mt-1">Try a different search term</p>}
            </div>
          )}
        </div>

        {/* Create new category option */}
        <div className="border-t mt-1 pt-1">
          <div
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={e => {
              e.stopPropagation();
              handleCreateCategory();
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-3 w-3 rounded-sm border border-dashed border-muted-foreground/40 flex items-center justify-center">
                <Plus className="h-2 w-2 text-muted-foreground" />
              </div>
              <span className="font-medium text-muted-foreground">Create new category</span>
            </div>
          </div>
        </div>
      </SelectContent>
    </Select>
  );
};
