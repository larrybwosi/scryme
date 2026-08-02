"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { ImageUpload } from "../../../../../components/image-upload";

interface OverviewTabProps {
  product: any;
  setProduct: (product: any) => void;
  categories: any[];
  handleGenerateSlug: () => void;
}

export function OverviewTab({
  product,
  setProduct,
  categories,
  handleGenerateSlug,
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your product details and attributes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={product.name}
              onChange={e =>
                setProduct({ ...product, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sku">Base SKU</Label>
              <Input
                id="sku"
                value={product.sku}
                onChange={e =>
                  setProduct({ ...product, sku: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Product Type</Label>
              <Select
                value={product.type}
                onValueChange={value =>
                  setProduct({ ...product, type: value })
                }>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINISHED_GOOD">
                    Finished Good
                  </SelectItem>
                  <SelectItem value="RAW_MATERIAL">
                    Raw Material
                  </SelectItem>
                  <SelectItem value="MERCHANDISE">
                    Merchandise
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Product Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={product.slug || ""}
                onChange={e =>
                  setProduct({ ...product, slug: e.target.value })
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleGenerateSlug}
                title="Generate slug"
                aria-label="Generate slug">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={product.categoryId}
                onValueChange={value =>
                  setProduct({
                    ...product,
                    categoryId: value,
                  })
                }>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={product.brand || ""}
                onChange={e =>
                  setProduct({ ...product, brand: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rating">Product Rating (0-5)</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={product.rating || 0}
              onChange={e =>
                setProduct({
                  ...product,
                  rating: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={product.description || ""}
              onChange={e =>
                setProduct({
                  ...product,
                  description: e.target.value,
                })
              }
              className="min-h-25"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Media & Assets</CardTitle>
          <CardDescription>
            Product images and gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={product.imageUrls || []}
            onChange={urls =>
              setProduct({ ...product, imageUrls: urls })
            }
            maxImages={5}
          />
        </CardContent>
        <CardFooter className="bg-muted/50 border-t py-3 dark:border-zinc-800">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Recommended: 1000x1000px JPG/PNG
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
