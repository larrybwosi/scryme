"use client";

import { Search, ShoppingCart, Plus } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Checkbox } from "@repo/ui/components/ui/checkbox";

interface ProductCatalogProps {
  products: any[];
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search catalog..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Categories
          </Button>
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            Add to Catalog
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No products in catalog
                </TableCell>
              </TableRow>
            ) : (
              products.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">{item.variant?.name || "Standard"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {item.product.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase">
                    {item.supplierSku || item.variant?.sku || item.product.sku}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4" />
                      </div>
                      <span className="text-xs font-medium">120 units</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium font-mono">
                    KES {Number(item.costPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary">
                      <ShoppingCart size={14} />
                      Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
