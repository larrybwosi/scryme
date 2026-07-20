"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Building2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { getCompanies, deleteCompany } from "../../actions/companies";
import { StatCard } from "../../../components/ui/stat-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { CompanyForm } from "./company-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { createCustomer } from "../../actions/customers";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
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

const PAGE_SIZE = 10;

export function CompaniesView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactCompany, setAddContactCompany] = useState<any>(null);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Use SWR for data fetching
  const {
    data: companies = [],
    error,
    isLoading,
    mutate,
  } = useSWR(["companies"], () => getCompanies(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  const filtered = useMemo(() => {
    return companies.filter((c: any) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.taxId && c.taxId.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [search, companies]);

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
      const updatedCompanies = companies.filter((c: any) => c.id !== id);
      mutate(updatedCompanies, false);

      // Perform actual deletion
      await deleteCompany(id);

      toast.success("Company deleted successfully");

      // Revalidate to ensure data consistency
      mutate();

      // Adjust page if current page becomes empty
      if (paged.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      // Revert on error
      mutate();
      toast.error("Failed to delete company");
      console.error("Failed to delete company", error);
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Column Headers
      const headers = ["Company ID", "Company Name", "Tax ID", "Customers Count", "Discount %", "Payment Terms (Days)", "Created At"];

      // Generate Rows
      const rows = companies.map((company: any) => [
        company.id,
        company.name,
        company.taxId || "",
        company._count?.contacts || company.contacts?.length || 0,
        company.discountPercentage !== null ? `${company.discountPercentage}%` : "0%",
        company.paymentTermsDays !== null ? `${company.paymentTermsDays} days` : "—",
        new Date(company.createdAt).toLocaleDateString()
      ]);

      // Combine Headers and Rows into CSV string with escape
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
          const str = String(val);
          if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(","))
      ].join("\n");

      // Download Blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `companies-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel spreadsheet downloaded successfully");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed. Please try again.");
    }
  };

  const handleCompanySuccess = () => {
    setIsCreateOpen(false);
    setEditingCompany(null);
    mutate(); // Re-fetch companies data
    toast.success(
      editingCompany
        ? "Company updated successfully"
        : "Company created successfully",
    );
  };

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="flex-1 px-8 pb-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Error loading companies
                </h3>
                <p className="text-muted-foreground">
                  Failed to load companies. Please try again later.
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
      {/* Page Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">
              Companies
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {companies.length} compan{companies.length !== 1 ? "ies" : "y"}{" "}
              &bull; B2B accounts
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-[12.5px] font-semibold hover:bg-primary/90 transition-colors h-8">
                <Plus size={13} />
                Add Company
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl overflow-y-scroll">
              <SheetHeader>
                <SheetTitle>Add New Company</SheetTitle>
              </SheetHeader>
              <CompanyForm onSuccess={handleCompanySuccess} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Total Companies"
            value={companies.length}
            sub="Active business accounts"
            icon={Building2}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by name or tax ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Download Section */}
            <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-1.5 bg-muted/20">
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-semibold text-foreground">Spreadsheet Export</p>
                <p className="text-[10px] text-muted-foreground">Download whole list of companies</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                className="h-8 px-3 text-[12px] font-medium flex items-center gap-1 bg-background hover:bg-accent text-foreground border-border"
              >
                <Download size={13} className="mr-1" />
                Download Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Company <ArrowUpDown size={11} className="opacity-50" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-[13px] text-muted-foreground">
                          Loading companies...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-16 text-[13px] text-muted-foreground"
                    >
                      {search
                        ? "No companies match your search."
                        : "No companies found. Create your first company to get started!"}
                    </td>
                  </tr>
                ) : (
                  paged.map((company: any) => (
                    <tr
                      key={company.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        deletingId === company.id &&
                          "opacity-50 pointer-events-none",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/companies/${company.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                            {company.name}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {company.taxId || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] text-foreground">
                        {company._count?.contacts || 0}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet
                            open={editingCompany?.id === company.id}
                            onOpenChange={(open: boolean) =>
                              !open && setEditingCompany(null)
                            }
                          >
                            <button
                              onClick={() => setEditingCompany(company)}
                              className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors"
                            >
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-2xl overflow-y-scroll">
                              <SheetHeader>
                                <SheetTitle>Edit Company</SheetTitle>
                              </SheetHeader>
                              <CompanyForm
                                initialData={company}
                                onSuccess={handleCompanySuccess}
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    disabled={deletingId === company.id}
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
                                onClick={() => {
                                  setAddContactCompany(company);
                                  setIsAddContactOpen(true);
                                }}
                              >
                                Add Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setCompanyToDelete(company.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={deletingId === company.id}
                              >
                                {deletingId === company.id
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
              Showing {startItem}–{endItem} of {filtered.length} companies
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

      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Contact to {addContactCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Email
              </label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. john@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Phone
              </label>
              <input
                type="text"
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. +1 234 567 890"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddContactOpen(false);
                  setNewContact({ name: "", email: "", phone: "" });
                }}
                disabled={isSavingContact}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newContact.name.trim()) {
                    toast.error("Name is required");
                    return;
                  }
                  setIsSavingContact(true);
                  try {
                    const res = await createCustomer({
                      name: newContact.name,
                      email: newContact.email || undefined,
                      phone: newContact.phone || undefined,
                      customerType: "B2B",
                      businessAccountId: addContactCompany?.id,
                      isActive: true,
                    });

                    if (res.success) {
                      toast.success("Contact added successfully");
                      setIsAddContactOpen(false);
                      setNewContact({ name: "", email: "", phone: "" });
                      mutate(); // Refresh the companies table data
                    } else {
                      toast.error(res.error || "Failed to add contact");
                    }
                  } catch (err: any) {
                    console.error("Error adding contact:", err);
                    toast.error("An error occurred while adding contact");
                  } finally {
                    setIsSavingContact(false);
                  }
                }}
                disabled={isSavingContact}
              >
                {isSavingContact ? "Saving..." : "Add Contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompanyToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                if (companyToDelete) {
                  handleDelete(companyToDelete);
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
