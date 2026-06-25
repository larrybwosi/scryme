'use client';

import React, { useState } from 'react';
import {
  Building2,
  Package,
  Truck,
  Users,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Award,
  DollarSign,
  Shield,
  Edit,
  AlertCircle,
  X,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ArrowUpDown,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus,
  History as HistoryIcon,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { formatDate, useFormattedCurrency } from '../lib/utils';
import { Supplier, ProductSupplier } from '../types';
import { EditSupplierDialog } from './edit.supplier';
import { DeliveriesTab } from './deliveries-tab';
import { AddProductDialog } from './add-product-supplier';
import { QualityIncidentsTab } from './traceability/quality-incidents-tab';
import { SupplierDocumentsTab } from './traceability/supplier-documents-tab';
import { SupplierAnalyticsTab } from './supplier-analytics-tab';
import { PerformanceScorecard } from './performance-scorecard';
import { UpdatePriceDialog } from './update-price-dialog';
import { PriceHistoryDialog } from './price-history-dialog';
import { BulkProductUpdateDialog } from './bulk-product-update-dialog';
import { useRouter } from 'next/navigation';
import {
  useGetSupplierDeliveries,
  useDeleteSupplierProduct,
  useListSupplierProducts,
  useGetSupplierAnalytics
} from '../lib/api/suppliers';
import { toast } from 'sonner';

interface SupplierDetailViewProps {
  supplier: Supplier;
}

export const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ supplier: initialSupplier }) => {
  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [updatePriceData, setUpdatePriceData] = useState<{ open: boolean; productId: string; productName: string; price: number }>({
    open: false,
    productId: '',
    productName: '',
    price: 0
  });

  const [priceHistoryData, setPriceHistoryData] = useState<{ open: boolean; variantId?: string; productName: string }>({
    open: false,
    productName: ''
  });

  const router = useRouter();
  const formatCurrency = useFormattedCurrency(supplier.businessInfo.currency);

  const { data: deliveries, isLoading: isLoadingDeliveries } = useGetSupplierDeliveries(supplier.id);
  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useListSupplierProducts(supplier.id);
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetSupplierAnalytics(supplier.id);
  const deleteProductMutation = useDeleteSupplierProduct(supplier.id);

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to remove this product from this supplier?')) {
      try {
        await deleteProductMutation.mutateAsync(productId);
        refetchProducts();
        toast.success('Product removed successfully');
      } catch (error) {
        toast.error('Failed to remove product');
      }
    }
  };

  const handleSupplierUpdate = (updatedData: Partial<Supplier>) => {
    setSupplier({ ...supplier, ...updatedData } as Supplier);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full h-8 w-8"
                aria-label="Go back"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Go back</TooltipContent>
          </Tooltip>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{supplier.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 text-muted-foreground text-sm">
              <Badge variant="secondary" className="font-mono">{supplier.code}</Badge>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="capitalize">{supplier.type.replace('_', ' ')}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <Badge className={
                supplier.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                (supplier.status as string) === 'on_hold' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-slate-100 text-slate-800 border-slate-200'
              }>
                {supplier.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Contact & Business Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex items-start gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-slate-600" />
                </div>
                <div className="grid gap-0.5">
                  <p className="text-sm font-semibold">{supplier.contact.primaryContact}</p>
                  <p className="text-xs text-muted-foreground">Primary Point of Contact</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Phone className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-sm font-medium">{supplier.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-sm font-medium truncate">{supplier.contact.email}</span>
              </div>
              {supplier.contact.website && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <Globe className="h-4 w-4 text-slate-600" />
                  </div>
                  <a href={supplier.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                    {supplier.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-3 border-t pt-5">
                <div className="bg-slate-100 p-2 rounded-lg mt-0.5">
                  <MapPin className="h-4 w-4 text-slate-600" />
                </div>
                <div className="grid gap-0.5 text-sm text-slate-600">
                  <p>{supplier.address.street}</p>
                  <p>{supplier.address.city}, {supplier.address.state} {supplier.address.zipCode}</p>
                  <p className="font-semibold text-slate-900">{supplier.address.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Commercial Terms</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Currency</span>
                <Badge variant="outline" className="font-mono bg-slate-50">{supplier.businessInfo.currency}</Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Payment Terms</span>
                <span className="font-semibold text-slate-700">{supplier.businessInfo.paymentTerms}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Tax ID</span>
                <span className="font-semibold text-slate-700">{supplier.businessInfo.taxId}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Registration #</span>
                <span className="font-semibold text-slate-700">{supplier.businessInfo.registrationNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area: Content Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-6">
              <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Products</TabsTrigger>
              <TabsTrigger value="deliveries" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Deliveries & POs</TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Performance</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Analytics</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-0 space-y-4">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Inventory Catalogue</CardTitle>
                    <CardDescription>All products currently sourced from {supplier.name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedProductIds.length > 0 && (
                      <Button variant="outline" onClick={() => setBulkUpdateOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Bulk Update ({selectedProductIds.length})
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setAddProductDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-y bg-slate-50/50">
                          <th className="h-10 px-4 w-[50px]"><Checkbox /></th>
                          <th className="h-10 px-4 text-left font-semibold text-slate-600">Product Specification</th>
                          <th className="h-10 px-4 text-left font-semibold text-slate-600">SKU / Ref</th>
                          <th className="h-10 px-4 text-right font-semibold text-slate-600">Current Cost</th>
                          <th className="h-10 px-4 text-center font-semibold text-slate-600">Status</th>
                          <th className="h-10 px-4 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingProducts ? (
                          <tr><td colSpan={6} className="p-12 text-center text-slate-400">Loading catalog...</td></tr>
                        ) : products && products.length > 0 ? (
                          products.map((p: any) => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedProductIds.includes(p.productId)}
                                  onCheckedChange={() => toggleProductSelection(p.productId)}
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">
                                <div className="flex flex-col">
                                  <span>{p.product.name}</span>
                                  {p.variant?.name && <span className="text-xs text-muted-foreground font-normal">{p.variant.name}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.supplierSku || p.product.sku}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-slate-900">{formatCurrency(p.costPrice)}</span>
                                  <button
                                    onClick={() => setPriceHistoryData({ open: true, variantId: p.variantId, productName: p.product.name })}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                  >
                                    <HistoryIcon className="h-2.5 w-2.5" /> History
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={p.isPreferred ? 'default' : 'secondary'} className={p.isPreferred ? 'bg-blue-600' : ''}>
                                  {p.isPreferred ? 'Preferred' : 'Secondary'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500"
                                        onClick={() => setUpdatePriceData({
                                          open: true,
                                          productId: p.productId,
                                          productName: p.product.name,
                                          price: p.costPrice
                                        })}
                                        aria-label="Update Price"
                                      >
                                        <DollarSign className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Update Price</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDeleteProduct(p.productId)}
                                        aria-label="Delete Product"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Product</TooltipContent>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} className="p-16 text-center text-slate-400">No products linked to this supplier.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliveries" className="mt-0">
              <DeliveriesTab deliveries={deliveries || []} isLoading={isLoadingDeliveries} />
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              <PerformanceScorecard supplier={supplier} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <SupplierAnalyticsTab analytics={analytics} isLoading={isLoadingAnalytics} />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <SupplierDocumentsTab documents={[]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EditSupplierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        supplier={supplier}
        onSave={handleSupplierUpdate}
      />

      <AddProductDialog
        open={addProductDialogOpen}
        onOpenChange={setAddProductDialogOpen}
        supplierId={supplier.id}
      />

      <UpdatePriceDialog
        open={updatePriceData.open}
        onOpenChange={(open) => setUpdatePriceData(prev => ({ ...prev, open }))}
        supplierId={supplier.id}
        productId={updatePriceData.productId}
        productName={updatePriceData.productName}
        currentPrice={updatePriceData.price}
      />

      <PriceHistoryDialog
        open={priceHistoryData.open}
        onOpenChange={(open) => setPriceHistoryData(prev => ({ ...prev, open }))}
        supplierId={supplier.id}
        variantId={priceHistoryData.variantId}
        productName={priceHistoryData.productName}
      />

      <BulkProductUpdateDialog
        open={bulkUpdateOpen}
        onOpenChange={setBulkUpdateOpen}
        supplierId={supplier.id}
        selectedProductIds={selectedProductIds}
      />
    </div>
  );
};
