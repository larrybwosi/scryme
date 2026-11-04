"use client";

import React, { useState } from "react";
import { Network, Building2, ChevronRight, Link2, Plus, Unlink } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { updateCompanyHierarchy } from "@/app/actions/company-enterprise";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@repo/ui/components/ui/dialog";

export function CompanyHierarchyTab({
  company,
  companies = [],
}: {
  company: any;
  companies?: any[];
}) {
  const [parentAccount, setParentAccount] = useState<any>(company.parentAccount);
  const [subsidiaries, setSubsidiaries] = useState<any[]>(company.subsidiaries || []);
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLinkParent = async () => {
    if (!selectedParentId) return;
    try {
      setIsSubmitting(true);
      const res = await updateCompanyHierarchy(company.id, selectedParentId);
      if (res.success) {
        toast.success("Parent company linked");
        setIsLinkParentOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to link parent company");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update hierarchy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkParent = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateCompanyHierarchy(company.id, null);
      if (res.success) {
        toast.success("Unlinked from parent company");
        setParentAccount(null);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to unlink parent company");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink parent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Corporate Account Hierarchy
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage parent enterprise organizations, holding companies, and subsidiary branch entities.
          </p>
        </div>

        {!parentAccount && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLinkParentOpen(true)}
            className="text-xs h-8 gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Link Parent Company
          </Button>
        )}
      </div>

      {/* Visual Tree */}
      <div className="p-6 border border-border rounded-xl bg-card space-y-6">
        {/* Parent Block */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Parent Organization
          </div>
          {parentAccount ? (
            <div className="p-4 border border-border rounded-xl bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <Link
                    href={`/companies/${parentAccount.id}`}
                    className="font-bold text-sm text-foreground hover:underline flex items-center gap-1.5"
                  >
                    {parentAccount.name}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    Tax ID: {parentAccount.taxId || "N/A"}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkParent}
                disabled={isSubmitting}
                className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1"
              >
                <Unlink className="h-3.5 w-3.5" />
                Unlink Parent
              </Button>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
              This account is operating as an independent top-level entity.
            </div>
          )}
        </div>

        {/* Current Node */}
        <div className="pl-6 border-l-2 border-primary/40 space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Current Account</div>
          <div className="p-4 border border-primary/50 bg-primary/5 rounded-xl flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <div className="font-bold text-sm text-foreground">{company.name}</div>
              <div className="text-xs text-muted-foreground">
                Lifecycle: {company.lifecycleStage || "ACTIVE"} • Industry: {company.industry || "General"}
              </div>
            </div>
          </div>
        </div>

        {/* Subsidiaries Block */}
        <div className="pl-12 border-l-2 border-border space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Subsidiaries & Branches ({subsidiaries.length})
          </div>
          {subsidiaries.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
              No subsidiary companies or child branches linked under this account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subsidiaries.map((sub) => (
                <div key={sub.id} className="p-3 border border-border rounded-lg bg-background flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Link href={`/companies/${sub.id}`} className="font-semibold text-xs text-foreground hover:underline">
                        {sub.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {sub.industry || "Branch Account"} • {sub.lifecycleStage || "ACTIVE"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link Parent Dialog */}
      <Dialog open={isLinkParentOpen} onOpenChange={setIsLinkParentOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Link Parent Organization</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <p className="text-xs text-muted-foreground">
              Select an existing business account to designate as the parent holding entity for {company.name}.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
                Parent Account ID / CUID
              </label>
              <input
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                placeholder="Enter Business Account ID"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleLinkParent}
              disabled={isSubmitting || !selectedParentId.trim()}
              className="text-xs font-semibold h-8"
            >
              Link Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
