"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  UserPlus,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { getLeads, qualifyLead } from "../../actions/leads";
import { StatCard } from "../../../components/ui/stat-card";
import { useOrg } from "../../../components/org-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { LeadForm } from "./lead-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "../../../components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

const PAGE_SIZE = 10;

export function LeadsView() {
  const { organizationId } = useOrg();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [qualifyingId, setQualifyingId] = useState<string | null>(null);
  const [isQualifyDialogOpen, setIsQualifyDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [createDeal, setCreateDeal] = useState(false);
  const [dealName, setDealName] = useState("");
  const [dealAmount, setDealAmount] = useState("0");

  const {
    data: leads = [],
    error,
    isLoading,
    mutate,
  } = useSWR(organizationId ? ["leads", organizationId] : null, () =>
    getLeads(organizationId),
  );

  const filtered = useMemo(() => {
    return leads.filter((l: any) => {
      const data = l.data;
      const matchesSearch =
        search === "" ||
        data.name.toLowerCase().includes(search.toLowerCase()) ||
        (data.email &&
          data.email.toLowerCase().includes(search.toLowerCase())) ||
        (data.company &&
          data.company.toLowerCase().includes(search.toLowerCase()));

      return matchesSearch;
    });
  }, [search, leads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  const startItem =
    filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const openQualifyDialog = (lead: any) => {
    setSelectedLead(lead);
    setDealName(`Deal for ${lead.data.name}`);
    setDealAmount("0");
    setCreateDeal(false);
    setIsQualifyDialogOpen(true);
  };

  const handleQualify = async () => {
    if (!selectedLead) return;
    try {
      setQualifyingId(selectedLead.id);
      const result = await qualifyLead(selectedLead.id, organizationId, {
        createDeal,
        dealName,
        dealAmount: parseFloat(dealAmount) || 0,
      });
      if (result.success) {
        toast.success("Lead qualified and converted to customer");
        setIsQualifyDialogOpen(false);
        mutate();
      } else {
        toast.error(result.error || "Failed to qualify lead");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setQualifyingId(null);
    }
  };

  const handleSuccess = () => {
    setIsCreateOpen(false);
    mutate();
    toast.success("Lead created successfully");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Leads</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Track and qualify potential customers before they enter your CRM.
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={15} />
                Add Lead
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Lead</SheetTitle>
              </SheetHeader>
              <LeadForm onSuccess={handleSuccess} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Leads"
            value={leads.length}
            sub="Potential customers"
            icon={UserPlus}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <StatCard
            title="New Leads"
            value={leads.filter((l: any) => l.data.status === "new").length}
            sub="Awaiting contact"
            icon={UserPlus}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
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
                placeholder="Search leads..."
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
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Source
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
                          Loading leads...
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
                        ? "No leads match your search."
                        : "No leads found."}
                    </td>
                  </tr>
                ) : (
                  paged.map((lead: any) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {lead.data.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground">
                              {lead.data.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {lead.data.email || "No email"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-[13px] text-foreground font-medium">
                          <Building2
                            size={14}
                            className="text-muted-foreground"
                          />
                          {lead.data.company || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={lead.data.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {lead.data.source || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {lead.data.status !== "qualified" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-[11.5px]"
                              onClick={() => openQualifyDialog(lead)}
                              disabled={qualifyingId === lead.id}
                            >
                              <CheckCircle2
                                size={14}
                                className="text-green-600"
                              />
                              {qualifyingId === lead.id
                                ? "Qualifying..."
                                : "Qualify"}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete
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
              Showing {startItem}–{endItem} of {filtered.length} leads
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="w-8 h-8"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="w-8 h-8"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isQualifyDialogOpen} onOpenChange={setIsQualifyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Qualify Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will convert <strong>{selectedLead?.data.name}</strong> into
              a customer.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createDeal"
                checked={createDeal}
                onCheckedChange={(checked) => setCreateDeal(!!checked)}
              />
              <Label
                htmlFor="createDeal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Create a deal in the pipeline
              </Label>
            </div>

            {createDeal && (
              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="dealName">Deal Name</Label>
                  <Input
                    id="dealName"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dealAmount">Expected Amount</Label>
                  <Input
                    id="dealAmount"
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsQualifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleQualify} disabled={!!qualifyingId}>
              {qualifyingId ? "Qualifying..." : "Confirm Qualification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
