'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  MoreHorizontal,
  Package,
  Tag,
  Layers,
  DollarSign,
  History,
  Truck,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@repo/ui/lib/utils";
import { toast } from 'sonner';
import { updateProduct, bulkDeleteVariants, updateVariantStatus, createVariant, updateVariant } from '../../../actions/inventory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";

export function ProductPageClient({ product: initialProduct, categories, suppliers, locations }: any) {
  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

  // Variant Dialog State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [variantForm, setVariantForm] = useState({
    name: '',
    sku: '',
    buyingPrice: 0,
    retailPrice: 0,
    initialStock: 0
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        description: product.description,
        detailedDescription: product.detailedDescription,
        tags: product.tags,
      });
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedVariants.length === 0) return;
    try {
      await updateVariantStatus(selectedVariants, isActive);
      toast.success('Variants updated');
      // Refresh logic would go here
    } catch (e) {
      toast.error('Failed to update variants');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">{product.name}</h1>
              <Badge variant="outline" className="bg-zinc-100 border-zinc-200">
                {product.sku}
              </Badge>
              {product.isActive ? (
                 <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
              ) : (
                 <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
               <span>Inventory</span>
               <ChevronRight className="w-3 h-3" />
               <span>Products</span>
               <ChevronRight className="w-3 h-3" />
               <span className="font-medium text-zinc-900">{product.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-zinc-900 hover:bg-zinc-800 min-w-[120px]">
            {isSaving ? <span className="animate-pulse">Saving...</span> : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-white rounded-xl p-1 border shadow-sm mb-6 inline-flex">
              <TabsList className="bg-transparent border-none p-0 h-auto">
                {[
                  { value: 'overview', label: 'Overview', icon: Package },
                  { value: 'variants', label: 'Variants', icon: Layers },
                  { value: 'pricing', label: 'Pricing & Rules', icon: DollarSign },
                  { value: 'inventory', label: 'Stock & Locations', icon: History },
                  { value: 'suppliers', label: 'Suppliers', icon: Truck },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-md",
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update your product details and attributes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" value={product.name} onChange={(e) => setProduct({...product, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="sku">Base SKU</Label>
                        <Input id="sku" value={product.sku} onChange={(e) => setProduct({...product, sku: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="barcode">Barcode (EAN/UPC)</Label>
                        <Input id="barcode" defaultValue={product.barcode || ''} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        value={product.categoryId}
                        onChange={(e) => setProduct({...product, categoryId: e.target.value})}
                      >
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Short Description</Label>
                      <Textarea
                        id="description"
                        value={product.description || ''}
                        onChange={(e) => setProduct({...product, description: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle>Media & Assets</CardTitle>
                    <CardDescription>Product images and gallery.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {product.imageUrls?.map((url: string, i: number) => (
                        <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                           <Image src={url} alt={`Product ${i}`} fill className="object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="icon" variant="secondary" className="h-8 w-8">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                           </div>
                        </div>
                      ))}
                      <button className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:border-zinc-900 hover:bg-zinc-50 transition-all text-zinc-400 hover:text-zinc-900">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-xs font-medium">Add Image</span>
                      </button>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-zinc-50/50 border-t py-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Recommended: 1000x1000px JPG/PNG</p>
                  </CardFooter>
                </Card>
              </div>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader>
                   <CardTitle>Detailed Description</CardTitle>
                   <CardDescription>Rich text description for e-commerce and internal catalogs.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Textarea
                      placeholder="Write a detailed product description..."
                      className="min-h-[200px] text-base leading-relaxed"
                      value={product.detailedDescription || ''}
                      onChange={(e) => setProduct({...product, detailedDescription: e.target.value})}
                    />
                 </CardContent>
              </Card>
            </TabsContent>

            {/* VARIANTS TAB */}
            <TabsContent value="variants" className="mt-0">
               <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                     <CardTitle>Product Variants</CardTitle>
                     <CardDescription>Manage different sizes, colors, or materials.</CardDescription>
                   </div>
                   <Button
                    className="gap-2 bg-zinc-900 hover:bg-zinc-800"
                    onClick={() => {
                      setEditingVariant(null);
                      setVariantForm({
                        name: '',
                        sku: `${product.sku}-${(product.variants?.length || 0) + 1}`,
                        buyingPrice: Number(product.variants?.[0]?.buyingPrice || 0),
                        retailPrice: Number(product.variants?.[0]?.retailPrice || 0),
                        initialStock: 0
                      });
                      setIsVariantDialogOpen(true);
                    }}
                   >
                     <Plus className="w-4 h-4" /> Add Variant
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                   <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead className="w-12"></TableHead>
                           <TableHead>Variant Name</TableHead>
                           <TableHead>SKU</TableHead>
                           <TableHead>Barcode</TableHead>
                           <TableHead className="text-right">Price</TableHead>
                           <TableHead className="text-right">Stock</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead className="w-12"></TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {product.variants?.map((v: any) => (
                           <TableRow key={v.id}>
                             <TableCell>
                               <input
                                 type="checkbox"
                                 className="rounded"
                                 checked={selectedVariants.includes(v.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setSelectedVariants([...selectedVariants, v.id]);
                                   } else {
                                     setSelectedVariants(selectedVariants.filter(id => id !== v.id));
                                   }
                                 }}
                               />
                             </TableCell>
                             <TableCell className="font-medium text-zinc-900">{v.name}</TableCell>
                             <TableCell className="text-zinc-500">{v.sku}</TableCell>
                             <TableCell className="text-zinc-500">{v.barcode || '-'}</TableCell>
                             <TableCell className="text-right font-bold">
                               ${Number(v.retailPrice || 0).toFixed(2)}
                             </TableCell>
                             <TableCell className="text-right">
                               <Badge variant="outline" className="font-bold">
                                 {v.variantStocks?.reduce((acc: number, s: any) => acc + Number(s.currentStock), 0) || 0}
                               </Badge>
                             </TableCell>
                             <TableCell>
                               {v.isActive ? (
                                 <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">Active</Badge>
                               ) : (
                                 <Badge variant="secondary" className="text-[10px] uppercase font-bold">Inactive</Badge>
                               )}
                             </TableCell>
                             <TableCell>
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon">
                                     <MoreHorizontal className="w-4 h-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => {
                                      setEditingVariant(v);
                                      setVariantForm({
                                        name: v.name,
                                        sku: v.sku,
                                        buyingPrice: Number(v.buyingPrice),
                                        retailPrice: Number(v.retailPrice),
                                        initialStock: 0
                                      });
                                      setIsVariantDialogOpen(true);
                                   }}>
                                     <Edit className="w-4 h-4 mr-2"/> Edit Details
                                   </DropdownMenuItem>
                                   <DropdownMenuItem><ImageIcon className="w-4 h-4 mr-2"/> Manage Media</DropdownMenuItem>
                                   <DropdownMenuItem
                                     className="text-red-600"
                                     disabled={product.variants?.length <= 1}
                                     onClick={async () => {
                                       if (confirm('Are you sure you want to delete this variant?')) {
                                          await bulkDeleteVariants([v.id]);
                                          toast.success('Variant deleted');
                                          // Note: You'd ideally want a way to refresh the local 'product' state here
                                          // but for now revalidatePath in the action should handle it on next load.
                                          // A better UX would be to update the state.
                                          setProduct({
                                            ...product,
                                            variants: product.variants.filter((varItem: any) => varItem.id !== v.id)
                                          });
                                       }
                                     }}
                                   >
                                     <Trash2 className="w-4 h-4 mr-2"/> Delete
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 </CardContent>
                 <CardFooter className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="text-sm text-zinc-500">Bulk Actions ({selectedVariants.length}):</span>
                       <Button
                          variant="outline"
                          size="sm"
                          disabled={selectedVariants.length === 0}
                          onClick={() => handleBulkStatusUpdate(true)}
                        >
                          Mark Active
                        </Button>
                       <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          disabled={selectedVariants.length === 0 || selectedVariants.length >= (product.variants?.length || 0)}
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete these variants?')) {
                              await bulkDeleteVariants(selectedVariants);
                              toast.success('Variants deleted');
                              setProduct({
                                ...product,
                                variants: product.variants.filter((v: any) => !selectedVariants.includes(v.id))
                              });
                              setSelectedVariants([]);
                            }
                          }}
                        >
                          Delete Selected
                        </Button>
                    </div>
                 </CardFooter>
               </Card>
            </TabsContent>

            {/* PRICING TAB */}
            <TabsContent value="pricing" className="space-y-6 mt-0">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Retail Price</CardTitle>
                      <CardDescription>Default selling price.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                          <Input className="pl-9 text-2xl font-bold h-14" defaultValue={Number(product.variants?.[0]?.retailPrice || 0).toFixed(2)} />
                       </div>
                    </CardContent>
                 </Card>
                 <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Price</CardTitle>
                      <CardDescription>Base manufacturing/buying cost.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                          <Input className="pl-9 text-2xl font-bold h-14" defaultValue={Number(product.variants?.[0]?.buyingPrice || 0).toFixed(2)} />
                       </div>
                    </CardContent>
                 </Card>
                 <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Margin</CardTitle>
                      <CardDescription>Estimated profit percentage.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-14 flex items-center">
                       <span className="text-3xl font-black text-emerald-600">
                          {((1 - Number(product.variants?.[0]?.buyingPrice || 0) / Number(product.variants?.[0]?.retailPrice || 1)) * 100).toFixed(1)}%
                       </span>
                    </CardContent>
                 </Card>
               </div>

               <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Price Lists & Rules</CardTitle>
                      <CardDescription>Assign special pricing for customer segments or events.</CardDescription>
                    </div>
                    <Button variant="outline" className="gap-2">
                       <Plus className="w-4 h-4" /> Create Rule
                    </Button>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                       <div className="bg-zinc-50 rounded-xl p-6 border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center">
                          <Tag className="w-12 h-12 text-zinc-200 mb-4" />
                          <h4 className="font-bold text-zinc-900 mb-1">No custom pricing rules found</h4>
                          <p className="text-sm text-zinc-500 max-w-[300px]">Create rules to offer discounts for bulk orders, specific seasons or VIP customers.</p>
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6 mt-0">
               <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader>
                   <CardTitle>Stock by Location</CardTitle>
                   <CardDescription>Real-time inventory levels across your warehouses and stores.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead>Variant</TableHead>
                          <TableHead className="text-right">Available</TableHead>
                          <TableHead className="text-right">Reserved</TableHead>
                          <TableHead className="text-right">On Hand</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locations.map((loc: any) => {
                          const variantStocks = product.variants?.[0]?.variantStocks?.filter((s: any) => s.locationId === loc.id) || [];
                          return (
                            <TableRow key={loc.id}>
                              <TableCell className="font-bold">{loc.name}</TableCell>
                              <TableCell className="text-zinc-500">Default</TableCell>
                              <TableCell className="text-right font-medium">
                                {variantStocks[0]?.availableStock ? Number(variantStocks[0].availableStock) : 0}
                              </TableCell>
                              <TableCell className="text-right text-zinc-400">0</TableCell>
                              <TableCell className="text-right font-bold text-zinc-900">
                                {variantStocks[0]?.currentStock ? Number(variantStocks[0].currentStock) : 0}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader>
                   <CardTitle>Inventory Settings</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <Label className="text-base font-bold">Low Stock Alerts</Label>
                            <p className="text-sm text-zinc-500">Notify when stock falls below threshold.</p>
                         </div>
                         <input type="checkbox" className="w-10 h-6 rounded-full" checked />
                      </div>
                      <div className="grid gap-2">
                         <Label htmlFor="threshold">Alert Threshold</Label>
                         <Input id="threshold" type="number" defaultValue={product.lowStockThreshold || 10} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <Label className="text-base font-bold">Expiry Tracking</Label>
                            <p className="text-sm text-zinc-500">Track expiration dates for this product.</p>
                         </div>
                         <input type="checkbox" className="w-10 h-6 rounded-full" />
                      </div>
                      <div className="grid gap-2">
                         <Label htmlFor="expiry">Shelf Life (Days)</Label>
                         <Input id="expiry" type="number" placeholder="Enter days..." />
                      </div>
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* SUPPLIERS TAB */}
            <TabsContent value="suppliers" className="mt-0">
               <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                 <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                     <CardTitle>Assigned Suppliers</CardTitle>
                     <CardDescription>Who you buy this product from.</CardDescription>
                   </div>
                   <Button variant="outline" className="gap-2">
                     <Plus className="w-4 h-4" /> Link Supplier
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead>Supplier SKU</TableHead>
                          <TableHead className="text-right">Cost Price</TableHead>
                          <TableHead className="text-right">Lead Time</TableHead>
                          <TableHead>Preferred</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {product.suppliers?.length > 0 ? product.suppliers.map((s: any) => (
                           <TableRow key={s.id}>
                             <TableCell className="font-bold text-zinc-900">{s.supplier.name}</TableCell>
                             <TableCell className="text-zinc-500">{s.supplierSku || '-'}</TableCell>
                             <TableCell className="text-right font-medium">${Number(s.costPrice).toFixed(2)}</TableCell>
                             <TableCell className="text-right">{s.leadTimeDays || '7'} days</TableCell>
                             <TableCell>
                               {s.isPreferred ? (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">YES</Badge>
                               ) : (
                                  <Badge variant="secondary">NO</Badge>
                               )}
                             </TableCell>
                             <TableCell>
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon">
                                     <MoreHorizontal className="w-4 h-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem>View Supplier</DropdownMenuItem>
                                   <DropdownMenuItem>Update Pricing</DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem className="text-red-600">Unlink Supplier</DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </TableCell>
                           </TableRow>
                         )) : (
                            <TableRow>
                               <TableCell colSpan={6} className="h-40 text-center">
                                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                                     <Truck className="w-8 h-8" />
                                     <p className="text-sm font-medium">No suppliers linked to this product.</p>
                                  </div>
                               </TableCell>
                            </TableRow>
                         )}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <Card className="border-none shadow-sm ring-1 ring-zinc-200 overflow-hidden">
              <div className="aspect-square relative bg-zinc-100">
                 {product.imageUrls?.[0] ? (
                    <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" />
                 ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Package className="w-16 h-16 text-zinc-300" />
                    </div>
                 )}
              </div>
              <CardContent className="pt-6">
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-4 border-b">
                       <span className="text-sm text-zinc-500 font-medium">Global Stock</span>
                       <span className="text-lg font-black text-zinc-900">
                          {product.variants?.reduce((acc: number, v: any) => acc + (v.variantStocks?.reduce((sa: number, s: any) => sa + Number(s.currentStock), 0) || 0), 0)}
                       </span>
                    </div>
                    <div className="space-y-3">
                       <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick Actions</h4>
                       <Button className="w-full justify-start gap-2 h-11" variant="outline">
                          <ExternalLink className="w-4 h-4" /> View Storefront
                       </Button>
                       <Button className="w-full justify-start gap-2 h-11" variant="outline">
                          <History className="w-4 h-4" /> Audit History
                       </Button>
                       <Button className="w-full justify-start gap-2 h-11" variant="outline">
                          <Layers className="w-4 h-4" /> Duplicate Product
                       </Button>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm ring-1 ring-zinc-200">
              <CardHeader>
                 <CardTitle className="text-base">Tags & Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" placeholder="Add tag..." />
                    <div className="flex flex-wrap gap-2 mt-2">
                       {product.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-zinc-100 border-zinc-200 hover:bg-zinc-200 transition-colors cursor-pointer">
                             {tag}
                          </Badge>
                       )) || (
                          <span className="text-xs text-zinc-400 italic">No tags added</span>
                       )}
                    </div>
                 </div>
                 <div className="grid gap-2 pt-4 border-t">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Created At</Label>
                    <p className="text-sm font-medium text-zinc-600">{new Date(product.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Last Updated</Label>
                    <p className="text-sm font-medium text-zinc-600">{new Date(product.updatedAt).toLocaleDateString()}</p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
            <DialogDescription>
              {editingVariant ? 'Update the details of your variant.' : 'Create a new variant for this product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="v-name">Variant Name</Label>
              <Input
                id="v-name"
                placeholder="e.g. XL / Red"
                value={variantForm.name}
                onChange={(e) => setVariantForm({...variantForm, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="v-sku">SKU</Label>
              <Input
                id="v-sku"
                value={variantForm.sku}
                onChange={(e) => setVariantForm({...variantForm, sku: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-buying">Buying Price</Label>
                <Input
                  id="v-buying"
                  type="number"
                  value={variantForm.buyingPrice}
                  onChange={(e) => setVariantForm({...variantForm, buyingPrice: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-retail">Retail Price</Label>
                <Input
                  id="v-retail"
                  type="number"
                  value={variantForm.retailPrice}
                  onChange={(e) => setVariantForm({...variantForm, retailPrice: Number(e.target.value)})}
                />
              </div>
            </div>
            {!editingVariant && (
              <div className="grid gap-2">
                <Label htmlFor="v-stock">Initial Stock</Label>
                <Input
                  id="v-stock"
                  type="number"
                  value={variantForm.initialStock}
                  onChange={(e) => setVariantForm({...variantForm, initialStock: Number(e.target.value)})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-zinc-900"
              onClick={async () => {
                try {
                  if (editingVariant) {
                    await updateVariant(editingVariant.id, variantForm);
                    toast.success('Variant updated');
                    // Manually update local state for better UX
                    setProduct({
                      ...product,
                      variants: product.variants.map((v: any) =>
                        v.id === editingVariant.id ? { ...v, ...variantForm } : v
                      )
                    });
                  } else {
                    const newVariant = await createVariant({
                      productId: product.id,
                      ...variantForm
                    });
                    toast.success('Variant created');
                    // Add to local state
                    setProduct({
                      ...product,
                      variants: [...(product.variants || []), {
                        ...newVariant,
                        variantStocks: [{ currentStock: variantForm.initialStock }] // Mock for display
                      }]
                    });
                  }
                  setIsVariantDialogOpen(false);
                } catch (e) {
                  toast.error('Operation failed');
                }
              }}
            >
              {editingVariant ? 'Save Changes' : 'Create Variant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
