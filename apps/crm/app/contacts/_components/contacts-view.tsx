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
import { ContactForm } from "./contact-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function ContactsView() {
  const { organizationId } = useOrg();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use SWR for data fetching
  const {
    data: contacts = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    organizationId ? ["contacts", organizationId] : null,
    () => getCustomers(organizationId, { type: 'CONTACT' }),
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
        (c.businessAccount?.name && c.businessAccount.name.toLowerCase().includes(search.toLowerCase()));

      return matchesSearch;
    });
  }, [search, contacts]);

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
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to delete this contact?")
    ) {
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
      }
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
                <h3 className="text-lg font-semibold mb-2">Error loading contacts</h3>
                <Button onClick={() => mutate()} className="mt-4">Retry</Button>
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
            <h1 className="text-[22px] font-bold text-foreground">Contacts</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage people associated with your business accounts.
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={15} />
                Add Contact
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Contact</SheetTitle>
              </SheetHeader>
              <ContactForm onSuccess={handleSuccess} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Contacts"
            value={contacts.length}
            sub="Linked to companies"
            icon={Contact}
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Contact
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
                        <p className="text-[13px] text-muted-foreground">Loading contacts...</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-[13px] text-muted-foreground">
                      {search ? "No contacts match your search." : "No contacts found."}
                    </td>
                  </tr>
                ) : (
                  paged.map((contact: any) => (
                    <tr key={contact.id} className={cn("hover:bg-muted/30 transition-colors group", deletingId === contact.id && "opacity-50 pointer-events-none")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground">{contact.name}</div>
                            <div className="text-[11.5px] text-muted-foreground">{contact.email || "No email"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-[13px] text-foreground font-medium">
                          <Building2 size={14} className="text-muted-foreground" />
                          {contact.businessAccount?.name || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {contact.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet open={editingContact?.id === contact.id} onOpenChange={(open) => !open && setEditingContact(null)}>
                            <button onClick={() => setEditingContact(contact)} className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors">
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Edit Contact</SheetTitle>
                              </SheetHeader>
                              <ContactForm initialData={contact} onSuccess={handleSuccess} />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors" disabled={deletingId === contact.id}>
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(contact.id)} disabled={deletingId === contact.id}>
                                {deletingId === contact.id ? "Deleting..." : "Delete"}
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
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="w-8 h-8">
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="w-8 h-8">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
