"use client";

import React, { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  Clock,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { formatCurrency } from "../../../lib/utils";
import Link from "next/link";
import {
  createService,
  updateService,
  deleteService,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from "../../actions/services";

const PricingModel = {
  FIXED: "FIXED" as const,
  HOURLY: "HOURLY" as const,
  VARIABLE: "VARIABLE" as const,
};
type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];

const DepositType = {
  FIXED: "FIXED" as const,
  PERCENTAGE: "PERCENTAGE" as const,
};
type DepositType = (typeof DepositType)[keyof typeof DepositType];

interface ServicesPageClientProps {
  initialServices: any[];
  initialCategories: any[];
  currency?: string;
}

export function ServicesPageClient({
  initialServices,
  initialCategories,
  currency = "USD",
}: ServicesPageClientProps) {
  const [services, setServices] = useState(initialServices);
  const [categories, setCategories] = useState(initialCategories);

  const [activeTab, setActiveTab] = useState<"services" | "categories">(
    "services",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states - Service
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    description: "",
    sku: "",
    categoryId: "",
    pricingModel: PricingModel.FIXED as PricingModel,
    price: "",
    minPrice: "",
    estimatedDuration: "",
    requiresDeposit: false,
    depositAmount: "",
    depositType: DepositType.FIXED as DepositType,
    isActive: true,
  });

  // Dialog states - Category
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter lists
  const filteredServices = services.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.sku.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.category && s.category.name.toLowerCase().includes(query))
    );
  });

  const filteredCategories = categories.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  });

  // Handle open dialog for creating/editing services
  const handleOpenServiceDialog = (service: any | null = null) => {
    if (service) {
      setEditingService(service);
      setServiceFormData({
        name: service.name,
        description: service.description || "",
        sku: service.sku,
        categoryId: service.categoryId,
        pricingModel: service.pricingModel,
        price: service.price.toString(),
        minPrice: service.minPrice ? service.minPrice.toString() : "",
        estimatedDuration: service.estimatedDuration
          ? service.estimatedDuration.toString()
          : "",
        requiresDeposit: service.requiresDeposit,
        depositAmount: service.depositAmount
          ? service.depositAmount.toString()
          : "",
        depositType: service.depositType || DepositType.FIXED,
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      // Auto generate a unique random SKU
      const random = Math.floor(10000 + Math.random() * 90000);
      setServiceFormData({
        name: "",
        description: "",
        sku: `SRV-${random}`,
        categoryId: categories[0]?.id || "",
        pricingModel: PricingModel.FIXED,
        price: "",
        minPrice: "",
        estimatedDuration: "",
        requiresDeposit: false,
        depositAmount: "",
        depositType: DepositType.FIXED,
        isActive: true,
      });
    }
    setIsServiceDialogOpen(true);
  };

  // Handle open dialog for creating/editing categories
  const handleOpenCategoryDialog = (category: any | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: "",
        description: "",
      });
    }
    setIsCategoryDialogOpen(true);
  };

  // Handle delete service
  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success("Service deleted successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete service");
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This might fail if services still belong to it.",
      )
    )
      return;
    try {
      await deleteServiceCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete category");
    }
  };

  // Handle Submit Service
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name) return toast.error("Name is required");
    if (!serviceFormData.sku) return toast.error("SKU is required");
    if (!serviceFormData.categoryId) return toast.error("Category is required");
    if (!serviceFormData.price) return toast.error("Price is required");

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: serviceFormData.name,
        description: serviceFormData.description || undefined,
        sku: serviceFormData.sku,
        categoryId: serviceFormData.categoryId,
        pricingModel: serviceFormData.pricingModel,
        price: parseFloat(serviceFormData.price),
        minPrice: serviceFormData.minPrice
          ? parseFloat(serviceFormData.minPrice)
          : undefined,
        estimatedDuration: serviceFormData.estimatedDuration
          ? parseInt(serviceFormData.estimatedDuration, 10)
          : undefined,
        requiresDeposit: serviceFormData.requiresDeposit,
        depositAmount:
          serviceFormData.requiresDeposit && serviceFormData.depositAmount
            ? parseFloat(serviceFormData.depositAmount)
            : undefined,
        depositType: serviceFormData.depositType,
        isActive: serviceFormData.isActive,
      };

      if (editingService) {
        const updated = await updateService(editingService.id, payload);
        setServices(prev =>
          prev.map(s =>
            s.id === editingService.id
              ? {
                  ...updated,
                  category: categories.find(c => c.id === updated.categoryId),
                }
              : s,
          ),
        );
        toast.success("Service updated successfully");
      } else {
        const created = await createService(payload);
        setServices(prev => [
          {
            ...created,
            category: categories.find(c => c.id === created.categoryId),
          },
          ...prev,
        ]);
        toast.success("Service created successfully");
      }
      setIsServiceDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Category
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return toast.error("Category name is required");

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await updateServiceCategory(
          editingCategory.id,
          categoryFormData,
        );
        setCategories(prev =>
          prev.map(c => (c.id === editingCategory.id ? updated : c)),
        );
        toast.success("Category updated successfully");
      } else {
        const created = await createServiceCategory(categoryFormData);
        setCategories(prev => [...prev, created]);
        toast.success("Category created successfully");
      }
      setIsCategoryDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your service offerings, pricing structures, booking setups,
            and categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenCategoryDialog()}
            variant="outline"
            className="gap-2">
            <Layers size={16} />
            <span>New Category</span>
          </Button>
          <Button
            onClick={() => handleOpenServiceDialog()}
            className="gap-2"
            disabled={categories.length === 0}
            title={
              categories.length === 0 ? "Create a service category first" : ""
            }>
            <Plus size={16} />
            <span>Add Service</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={val => {
            setActiveTab(val as any);
            setSearchQuery("");
          }}
          className="w-full">
          <div className="flex items-center justify-between border-b pb-1 mb-4">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger
                value="services"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground rounded-none shadow-none bg-transparent">
                All Services ({services.length})
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground rounded-none shadow-none bg-transparent">
                Service Categories ({categories.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={
                  activeTab === "services"
                    ? "Search services by name, SKU, category..."
                    : "Search categories..."
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-card"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filters
            </Button>
          </div>

          <TabsContent
            value="services"
            className="m-0 border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing Model</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground text-sm">
                      {searchQuery
                        ? "No matching services found."
                        : "No services created yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map(srv => (
                    <TableRow key={srv.id}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex flex-col">
                          <Link
                            href={`/inventory/services/${srv.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors cursor-pointer">
                            {srv.name}
                          </Link>
                          {srv.description && (
                            <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                              {srv.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {srv.sku}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/80">
                        {srv.category?.name || (
                          <span className="text-muted-foreground text-xs italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="capitalize text-xs font-medium">
                          {srv.pricingModel.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-sm text-foreground">
                        {srv.pricingModel === PricingModel.VARIABLE ? (
                          <span>
                            {formatCurrency(
                              Number(srv.minPrice || 0),
                              currency,
                            )}{" "}
                            - {formatCurrency(Number(srv.price), currency)}
                          </span>
                        ) : (
                          formatCurrency(Number(srv.price), currency)
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/80">
                        {srv.estimatedDuration ? (
                          <span className="flex items-center gap-1">
                            <Clock
                              size={13}
                              className="text-muted-foreground"
                            />
                            {srv.estimatedDuration} mins
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {srv.requiresDeposit ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            {srv.depositType === DepositType.PERCENTAGE
                              ? `${srv.depositAmount}%`
                              : formatCurrency(
                                  Number(srv.depositAmount || 0),
                                  currency,
                                )}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={srv.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-xs px-1.5 py-0 h-5",
                            srv.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground hover:bg-muted border-none",
                          )}>
                          {srv.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/inventory/services/${srv.id}`}
                                className="cursor-pointer w-full flex items-center">
                                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                                Customize Content (CMS)
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenServiceDialog(srv)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Core Service
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteService(srv.id)}
                              className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent
            value="categories"
            className="m-0 border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground text-sm">
                      {searchQuery
                        ? "No matching categories found."
                        : "No categories created yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-semibold text-sm text-foreground">
                        {cat.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cat.description || (
                          <span className="text-muted-foreground text-xs italic">
                            No description provided
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenCategoryDialog(cat)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Dialog (Add/Edit) */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSubmitService} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add Service"}
              </DialogTitle>
              <DialogDescription>
                Fill out the core parameters below to save this service
                offering.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label
                  htmlFor="srv-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service Name
                </Label>
                <Input
                  id="srv-name"
                  placeholder="e.g., Bread Baking Masterclass"
                  value={serviceFormData.name}
                  onChange={e =>
                    setServiceFormData({
                      ...serviceFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label
                  htmlFor="srv-description"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="srv-description"
                  placeholder="e.g., A comprehensive hands-on session on baking artisan breads."
                  value={serviceFormData.description}
                  onChange={e =>
                    setServiceFormData({
                      ...serviceFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="srv-sku"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  SKU Code
                </Label>
                <Input
                  id="srv-sku"
                  placeholder="e.g., SRV-10294"
                  value={serviceFormData.sku}
                  onChange={e =>
                    setServiceFormData({
                      ...serviceFormData,
                      sku: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="srv-category"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={serviceFormData.categoryId}
                  onValueChange={val =>
                    setServiceFormData({ ...serviceFormData, categoryId: val })
                  }
                  required>
                  <SelectTrigger id="srv-category" className="bg-card">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="srv-model"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pricing Model
                </Label>
                <Select
                  value={serviceFormData.pricingModel}
                  onValueChange={(val: PricingModel) =>
                    setServiceFormData({
                      ...serviceFormData,
                      pricingModel: val,
                    })
                  }
                  required>
                  <SelectTrigger id="srv-model" className="bg-card">
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PricingModel.FIXED}>
                      Fixed Rate
                    </SelectItem>
                    <SelectItem value={PricingModel.HOURLY}>
                      Hourly Rate
                    </SelectItem>
                    <SelectItem value={PricingModel.VARIABLE}>
                      Variable Price
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="srv-price"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {serviceFormData.pricingModel === PricingModel.VARIABLE
                    ? "Maximum Price"
                    : "Price"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="srv-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={serviceFormData.price}
                    onChange={e =>
                      setServiceFormData({
                        ...serviceFormData,
                        price: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {serviceFormData.pricingModel === PricingModel.VARIABLE && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="srv-min-price"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Minimum Price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="srv-min-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={serviceFormData.minPrice}
                      onChange={e =>
                        setServiceFormData({
                          ...serviceFormData,
                          minPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="srv-duration"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Duration (Minutes)
                </Label>
                <Input
                  id="srv-duration"
                  type="number"
                  placeholder="e.g., 60"
                  value={serviceFormData.estimatedDuration}
                  onChange={e =>
                    setServiceFormData({
                      ...serviceFormData,
                      estimatedDuration: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2 pt-2 border-t mt-2">
                <Checkbox
                  id="srv-deposit"
                  checked={serviceFormData.requiresDeposit}
                  onCheckedChange={checked =>
                    setServiceFormData({
                      ...serviceFormData,
                      requiresDeposit: !!checked,
                    })
                  }
                />
                <Label
                  htmlFor="srv-deposit"
                  className="text-sm font-semibold cursor-pointer select-none">
                  Requires Deposit to Book
                </Label>
              </div>

              {serviceFormData.requiresDeposit && (
                <>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="srv-deposit-type"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Deposit Type
                    </Label>
                    <Select
                      value={serviceFormData.depositType}
                      onValueChange={(val: DepositType) =>
                        setServiceFormData({
                          ...serviceFormData,
                          depositType: val,
                        })
                      }
                      required>
                      <SelectTrigger id="srv-deposit-type" className="bg-card">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DepositType.FIXED}>
                          Fixed Amount
                        </SelectItem>
                        <SelectItem value={DepositType.PERCENTAGE}>
                          Percentage (%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="srv-deposit-amount"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {serviceFormData.depositType === DepositType.PERCENTAGE
                        ? "Deposit %"
                        : "Deposit Amount"}
                    </Label>
                    <div className="relative">
                      {serviceFormData.depositType === DepositType.FIXED && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                      )}
                      <Input
                        id="srv-deposit-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={cn(
                          serviceFormData.depositType === DepositType.FIXED &&
                            "pl-7",
                        )}
                        value={serviceFormData.depositAmount}
                        onChange={e =>
                          setServiceFormData({
                            ...serviceFormData,
                            depositAmount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2 flex items-center space-x-2 pt-2">
                <Checkbox
                  id="srv-active"
                  checked={serviceFormData.isActive}
                  onCheckedChange={checked =>
                    setServiceFormData({
                      ...serviceFormData,
                      isActive: !!checked,
                    })
                  }
                />
                <Label
                  htmlFor="srv-active"
                  className="text-sm font-semibold cursor-pointer select-none">
                  Active & Available for Booking
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsServiceDialogOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog (Add/Edit) */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add Category"}
              </DialogTitle>
              <DialogDescription>
                Create a distinct category grouping for your service offerings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cat-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category Name
                </Label>
                <Input
                  id="cat-name"
                  placeholder="e.g., Classes, Consultation, Repair"
                  value={categoryFormData.name}
                  onChange={e =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cat-description"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="cat-description"
                  placeholder="e.g., Group sessions, events and masterclasses."
                  value={categoryFormData.description}
                  onChange={e =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
