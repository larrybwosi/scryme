"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Contact,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { getCustomers, deleteCustomer } from "../../actions/customers";
import { StatCard } from "../../../components/ui/stat-card";
import { useOrg } from "../../../components/org-context";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { StatusBadge } from "../../../components/ui/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { ContactForm } from "./contact-form";
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

export function ContactsView() {
  const { organizationId } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  // Use SWR for data fetching
  const {
    data: contacts = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    organizationId ? ["contacts", organizationId] : null,
    () => getCustomers(organizationId, { type: "CONTACT" }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  const filtered = useMemo(() => {
    return contacts.filter((c: any) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.businessAccount?.name &&
          c.businessAccount.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "customer" && c.customerType === "B2B") ||
        (statusFilter === "lead" && c.customerType === "B2C"); // Using customerType as a proxy for status if no explicit status

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, contacts]);

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
      const updatedContacts = contacts.filter((c: any) => c.id !== id);
      mutate(updatedContacts, false);
      await deleteCustomer(id);
      toast.success("Contact deleted successfully");
      mutate();
      if (paged.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      mutate();
      toast.error("Failed to delete contact");
      console.error("Failed to delete contact", error);
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleSuccess = () => {
    setIsCreateOpen(false);
    setEditingContact(null);
    mutate();
    toast.success(
      editingContact
        ? "Contact updated successfully"
        : "Contact created successfully",
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
                  Error loading contacts
                </h3>
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
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-background/50">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Contacts
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage and organize your business contacts and relationships.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="h-9 gap-2">
                  <Plus size={15} />
                  Add Contact
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add New Contact</SheetTitle>
                </SheetHeader>
                <ContactForm onSuccess={handleSuccess} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-auto"
          >
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all" className="text-xs px-4 h-7">
                All Contacts
              </TabsTrigger>
              <TabsTrigger value="customer" className="text-xs px-4 h-7">
                Customers
              </TabsTrigger>
              <TabsTrigger value="lead" className="text-xs px-4 h-7">
                Leads
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company
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
                    <td colSpan={4} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-[13px] text-muted-foreground">
                          Loading contacts...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-16 text-[13px] text-muted-foreground"
                    >
                      {search
                        ? "No contacts match your search."
                        : "No contacts found."}
                    </td>
                  </tr>
                ) : (
                  paged.map((contact: any) => (
                    <tr
                      key={contact.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        deletingId === contact.id &&
                          "opacity-50 pointer-events-none",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/customers/${contact.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                              {contact.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {contact.email || "No email"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={
                            contact.customerType === "B2B" ? "customer" : "lead"
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        {contact.businessAccount ? (
                          <Link
                            href={`/companies/${contact.businessAccountId}`}
                            className="flex items-center gap-2 text-[13px] text-foreground font-medium hover:text-primary transition-colors"
                          >
                            <Building2
                              size={14}
                              className="text-muted-foreground"
                            />
                            {contact.businessAccount.name}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                            <Building2 size={14} />—
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {contact.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet
                            open={editingContact?.id === contact.id}
                            onOpenChange={(open) =>
                              !open && setEditingContact(null)
                            }
                          >
                            <button
                              onClick={() => setEditingContact(contact)}
                              className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors"
                            >
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Edit Contact</SheetTitle>
                              </SheetHeader>
                              <ContactForm
                                initialData={contact}
                                onSuccess={handleSuccess}
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    disabled={deletingId === contact.id}
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
                                  setContactToDelete(contact.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={deletingId === contact.id}
                              >
                                {deletingId === contact.id
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
              Showing {startItem}–{endItem} of {filtered.length} contacts
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contact and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                if (contactToDelete) {
                  handleDelete(contactToDelete);
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
