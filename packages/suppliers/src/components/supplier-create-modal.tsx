"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
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
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import {
  useCreateSupplier,
  useGetSupplier,
  useUpdateSupplier,
} from "../lib/api/suppliers";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui/alert";
import { memo, useEffect } from "react";
import { supplierSchema } from "../lib/validations/suppliers";
import type { SupplierFormValues } from "../lib/validations/suppliers";

interface CreateEditSupplierSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  supplierId?: string;
}

const typeConfig = {
  manufacturer: { label: "Manufacturer", icon: Building2 },
  distributor: { label: "Distributor", icon: Truck },
  wholesaler: { label: "Wholesaler", icon: Package },
  service_provider: { label: "Service Provider", icon: Users },
};

const riskLevelConfig = {
  low: {
    label: "Low",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  medium: {
    label: "Medium",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  high: {
    label: "High",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
};

function CreateEditSupplierSheet({
  isOpen,
  onOpenChange,
  mode,
  supplierId,
}: CreateEditSupplierSheetProps) {
  const {
    data: supplierData,
    isLoading: isLoadingSupplier,
    error: supplierError,
  } = useGetSupplier(supplierId || "");

  const { mutateAsync: createSupplier, isPending: isCreating } =
    useCreateSupplier();
  const { mutateAsync: updateSupplier, isPending: isUpdating } =
    useUpdateSupplier();

  const isLoading = mode === "edit" ? isLoadingSupplier : false;
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema as any),
    defaultValues: {
      id: "",
      name: "",
      code: "",
      type: "manufacturer",
      contact: {
        primaryContact: "",
        phone: "",
        email: "",
        website: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "KE",
      },
      businessInfo: {
        taxId: "",
        registrationNumber: "",
        paymentTerms: "Net 30",
        currency: "USD",
      },
      categories: [],
      customBadges: [],
      riskLevel: "low",
    },
  });

  // Reset form when supplier data loads or mode changes
  useEffect(() => {
    if (mode === "edit" && supplierData) {
      // Transform the API data to match the form structure
      const formData = {
        id: supplierData.id || "",
        name: supplierData.name || "",
        code: supplierData.code || "",
        type: supplierData.type || "manufacturer",
        contact: {
          primaryContact: supplierData.contact?.primaryContact || "",
          phone: supplierData.contact?.phone || "",
          email: supplierData.contact?.email || "",
          website: supplierData.contact?.website || "",
        },
        address: {
          street: supplierData.address?.street || "",
          city: supplierData.address?.city || "",
          state: supplierData.address?.state || "",
          zipCode: supplierData.address?.zipCode || "",
          country: supplierData.address?.country || "USA",
        },
        businessInfo: {
          taxId: supplierData.businessInfo?.taxId || "",
          registrationNumber:
            supplierData.businessInfo?.registrationNumber || "",
          paymentTerms: supplierData.businessInfo?.paymentTerms || "Net 30",
          currency: supplierData.businessInfo?.currency || "USD",
        },
        categories: Array.isArray(supplierData.categories)
          ? supplierData.categories.join(", ")
          : supplierData.categories || "",
        customBadges: Array.isArray(supplierData.customBadges)
          ? supplierData.customBadges.join(", ")
          : supplierData.customBadges || "",
        riskLevel: supplierData.riskLevel || "low",
      };
      form.reset(formData);
    } else if (mode === "create") {
      form.reset({
        id: "",
        name: "",
        code: "",
        type: "manufacturer",
        contact: {
          primaryContact: "",
          phone: "",
          email: "",
          website: "",
        },
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        },
        businessInfo: {
          taxId: "",
          registrationNumber: "",
          paymentTerms: "Net 30",
          currency: "USD",
        },
        categories: [],
        customBadges: [],
        riskLevel: "low",
      });
    }
  }, [supplierData, mode, form, isOpen]);

  const handleSubmit = async (data: SupplierFormValues) => {
    try {
      if (mode === "create") {
        await createSupplier(data);
      } else if (mode === "edit" && supplierId) {
        await updateSupplier({ supplierId, data });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error("Error submitting form:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    const Icon = typeConfig[type as keyof typeof typeConfig]?.icon || Building2;
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  const renderRiskBadge = (level: string) => {
    const config =
      riskLevelConfig[level as keyof typeof riskLevelConfig] ||
      riskLevelConfig.low;
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const generateSupplierCode = (name: string) => {
    if (!name) return "";
    const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomNum}`;
  };

  // Skeleton loader component
  const FieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 bg-muted" />
      <Skeleton className="h-10 w-full bg-muted" />
    </div>
  );

  if (mode === "edit" && supplierError) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl">
          <Alert
            variant="destructive"
            className="bg-destructive/10 text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load supplier data. Please try again.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <SheetHeader className="flex-1">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              {mode === "create" ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Add New Supplier
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5" />
                  {isLoading ? (
                    <Skeleton className="h-6 w-40 bg-muted" />
                  ) : (
                    `Edit Supplier: ${supplierData?.name}`
                  )}
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {mode === "create"
                ? "Register a new supplier for your organization. Fill in all required information to establish a new supplier relationship."
                : "Update the information for this supplier."}
            </SheetDescription>
          </SheetHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6 mt-6">
            <div className="space-y-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24 bg-muted" />
              <Skeleton className="h-10 w-32 bg-muted" />
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 mt-6"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Basic Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Building2 className="h-4 w-4" />
                          Supplier Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter supplier company name"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Official company name as registered in business
                            documents
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Package className="h-4 w-4" />
                          Supplier Code *
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="e.g., SUP123"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                              disabled={mode === "edit" || isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          {mode === "create" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const name = form.getValues("name");
                                if (name) {
                                  const generatedCode =
                                    generateSupplierCode(name);
                                  form.setValue("code", generatedCode);
                                }
                              }}
                              disabled={isSubmitting}
                            >
                              Generate
                            </Button>
                          )}
                        </div>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Auto-generated unique identifier (first 3 letters of
                            name + random 3 digits)
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <Truck className="h-4 w-4" />
                            Supplier Type *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background text-foreground border-input">
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(field.value)}
                                  <span>
                                    {
                                      typeConfig[
                                        field.value as keyof typeof typeConfig
                                      ]?.label
                                    }
                                  </span>
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background text-foreground border-input">
                              <SelectItem value="manufacturer">
                                {mode === "create"
                                  ? "Manufacturer - Produces goods directly"
                                  : "Manufacturer"}
                              </SelectItem>
                              <SelectItem value="distributor">
                                {mode === "create"
                                  ? "Distributor - Distributes products from manufacturers"
                                  : "Distributor"}
                              </SelectItem>
                              <SelectItem value="wholesaler">
                                {mode === "create"
                                  ? "Wholesaler - Sells in bulk quantities"
                                  : "Wholesaler"}
                              </SelectItem>
                              <SelectItem value="service_provider">
                                {mode === "create"
                                  ? "Service Provider - Provides services"
                                  : "Service Provider"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <Shield className="h-4 w-4" />
                            Risk Level
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background text-foreground border-input">
                                {renderRiskBadge(field.value || "low")}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background text-foreground border-input">
                              <SelectItem value="low">
                                {mode === "create"
                                  ? "Low - Established, reliable supplier"
                                  : "Low"}
                              </SelectItem>
                              <SelectItem value="medium">
                                {mode === "create"
                                  ? "Medium - Some concerns or new relationship"
                                  : "Medium"}
                              </SelectItem>
                              <SelectItem value="high">
                                {mode === "create"
                                  ? "High - Requires close monitoring"
                                  : "High"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Contact Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="contact.primaryContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Users className="h-4 w-4" />
                          Primary Contact *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contact person full name"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Main point of contact for business communications
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1-555-0123"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <Mail className="h-4 w-4" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contact@supplier.com"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contact.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Globe className="h-4 w-4" />
                          Website (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="www.supplier.com"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Company website for reference and verification
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Address Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <MapPin className="h-4 w-4" />
                          Street Address *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Business Street"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Complete street address including building number
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            City *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="New York"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            State/Province *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="NY"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            ZIP/Postal Code *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10001"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            Country *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background text-foreground border-input">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background text-foreground border-input">
                              <SelectItem value="KE">Kenya</SelectItem>
                              <SelectItem value="USA">United States</SelectItem>
                              <SelectItem value="UG">Uganda</SelectItem>
                              <SelectItem value="GBR">
                                United Kingdom
                              </SelectItem>
                              <SelectItem value="DEU">Germany</SelectItem>
                              <SelectItem value="FRA">France</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Business Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessInfo.taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <FileText className="h-4 w-4" />
                            {form.watch("address.country") === "KE"
                              ? "KRA PIN *"
                              : "Tax ID/EIN *"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12-3456789"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessInfo.registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground">
                            <Award className="h-4 w-4" />
                            Registration Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="REG123456"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-background text-foreground border-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessInfo.paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <DollarSign className="h-4 w-4" />
                          Payment Terms *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background text-foreground border-input">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background text-foreground border-input">
                            {mode === "create" ? (
                              <>
                                <SelectItem value="Net 15">
                                  Net 15 - Payment due in 15 days
                                </SelectItem>
                                <SelectItem value="Net 30">
                                  Net 30 - Payment due in 30 days
                                </SelectItem>
                                <SelectItem value="Net 45">
                                  Net 45 - Payment due in 45 days
                                </SelectItem>
                                <SelectItem value="Net 60">
                                  Net 60 - Payment due in 60 days
                                </SelectItem>
                                <SelectItem value="COD">
                                  COD - Cash on Delivery
                                </SelectItem>
                                <SelectItem value="Prepaid">
                                  Prepaid - Payment before delivery
                                </SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Net 15">Net 15</SelectItem>
                                <SelectItem value="Net 30">Net 30</SelectItem>
                                <SelectItem value="Net 45">Net 45</SelectItem>
                                <SelectItem value="Net 60">Net 60</SelectItem>
                                <SelectItem value="COD">COD</SelectItem>
                                <SelectItem value="Prepaid">Prepaid</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Standard payment terms for invoices and orders
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Package className="h-4 w-4" />
                          Product Categories
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Electronics, Accessories, Components"
                            {...field}
                            disabled={isSubmitting}
                            className="min-h-[60px] bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Comma-separated list of product categories this
                            supplier provides
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customBadges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-foreground">
                          <Award className="h-4 w-4" />
                          Custom Badges (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Premium Partner, ISO Certified, Green Supplier"
                            {...field}
                            disabled={isSubmitting}
                            className="min-h-[60px] bg-background text-foreground border-input"
                          />
                        </FormControl>
                        {mode === "create" && (
                          <p className="text-xs text-muted-foreground">
                            Comma-separated list of special certifications or
                            designations
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? mode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : mode === "create"
                      ? "Add Supplier"
                      : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default memo(CreateEditSupplierSheet);
