"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Globe,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { getCustomers, deleteCustomer } from "../../actions/customers";
import { StatCard } from "../../../components/ui/stat-card";
import { useOrg } from "../../../components/org-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { CustomerForm } from "./customer-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function CustomersView() {
  const { organizationId } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Use SWR for data fetching
  const {
    data: customers = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    organizationId ? ["customers-b2c", organizationId] : null,
    () => getCustomers(organizationId, { type: 'B2C' }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    },
  );

  const filtered = useMemo(() => {
    return customers.filter((c: any) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && c.isActive) ||
        (statusFilter === "Inactive" && !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, customers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  const startItem =
    filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      // Optimistic update - remove from UI immediately
      const updatedCustomers = customers.filter((c: any) => c.id !== id);
      mutate(updatedCustomers, false);

      // Perform actual deletion
      await deleteCustomer(id);

      toast.success("Customer deleted successfully");

      // Revalidate to ensure data consistency
      mutate();

      // Adjust page if current page becomes empty
      if (paged.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      // Revert on error
      mutate();
      toast.error("Failed to delete customer");
      console.error("Failed to delete customer", error);
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleCustomerSuccess = () => {
    setIsCreateOpen(false);
    setEditingCustomer(null);
    mutate(); // Re-fetch customers data
    toast.success(
      editingCustomer
        ? "Customer updated successfully"
        : "Customer created successfully",
    );
  };

  const activeCount = customers.filter((c: any) => c.isActive).length;

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="flex-1 px-8 pb-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Error loading customers
                </h3>
                <p className="text-muted-foreground">
                  Failed to load customers. Please try again later.
                </p>
                <Button onClick={() => mutate()} className="mt-4">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Customers</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage and track all your customer relationships.
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={15} />
                Add Customer
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Customer</SheetTitle>
              </SheetHeader>
              <CustomerForm onSuccess={handleCustomerSuccess} type="B2C" />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Customers"
            value={customers.length}
            sub={`${activeCount} active`}
            icon={Users}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by name, email or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["All", "Active", "Inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1); // Reset to first page when filter changes
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-[13px] text-muted-foreground">
                          Loading customers...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-16 text-[13px] text-muted-foreground"
                    >
                      {search || statusFilter !== "All"
                        ? "No customers match your criteria."
                        : "No customers found. Create your first customer to get started!"}
                    </td>
                  </tr>
                ) : (
                  paged.map((customer: any) => (
                    <tr
                      key={customer.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        deletingId === customer.id &&
                          "opacity-50 pointer-events-none",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                              {customer.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {customer.email || "No email"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-foreground font-medium">
                        {customer.company || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {customer.customerType || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                            customer.isActive
                              ? "bg-status-success/10 text-status-success"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet
                            open={editingCustomer?.id === customer.id}
                            onOpenChange={(open: boolean) =>
                              !open && setEditingCustomer(null)
                            }
                          >
                            <button
                              onClick={() => setEditingCustomer(customer)}
                              className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors"
                            >
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Edit Customer</SheetTitle>
                              </SheetHeader>
                              <CustomerForm
                                initialData={customer}
                                onSuccess={handleCustomerSuccess}
                                type="B2C"
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    disabled={deletingId === customer.id}
                                    aria-label="More actions"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>More actions</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setCustomerToDelete(customer.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={deletingId === customer.id}
                              >
                                {deletingId === customer.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <p className="text-[12.5px] text-muted-foreground">
              Showing {startItem}–{endItem} of {filtered.length} customers
            </p>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="w-8 h-8"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="w-8 h-8"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                if (customerToDelete) {
                  handleDelete(customerToDelete);
                }
              }}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
