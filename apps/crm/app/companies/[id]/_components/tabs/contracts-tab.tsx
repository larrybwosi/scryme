"use client";

import React, { useState } from "react";
import { FileCheck, Calendar, Shield, Percent, Save, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import { updateCompanyContract } from "@/app/actions/company-enterprise";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

export function CompanyContractsTab({ company }: { company: any }) {
  const [contractStatus, setContractStatus] = useState(company.contractStatus || "ACTIVE");
  const [slaTier, setSlaTier] = useState(company.slaTier || "STANDARD");
  const [discountPercentage, setDiscountPercentage] = useState(company.discountPercentage ?? 0);
  const [startDate, setStartDate] = useState(
    company.contractStartDate ? new Date(company.contractStartDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    company.contractEndDate ? new Date(company.contractEndDate).toISOString().split("T")[0] : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveContract = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateCompanyContract(company.id, {
        contractStatus,
        slaTier,
        discountPercentage: Number(discountPercentage) || 0,
        contractStartDate: startDate ? new Date(startDate) : null,
        contractEndDate: endDate ? new Date(endDate) : null,
      });

      if (res.success) {
        toast.success("Contract terms & SLA commitments updated");
      } else {
        toast.error(res.error || "Failed to update contract");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Enterprise Contracts & Custom Pricing
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure negotiated enterprise discount tiers, SLA guarantees, and contract lifecycle dates.
        </p>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Contract Lifecycle Status
            </label>
            <Select value={contractStatus} onValueChange={(val) => setContractStatus(val)}>
              <SelectTrigger className="w-full text-xs h-9 bg-background">
                <SelectValue placeholder="Select contract status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE - Fully Executed</SelectItem>
                <SelectItem value="UNDER_REVIEW">UNDER REVIEW - In Negotiation</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED - Awaiting Renewal</SelectItem>
                <SelectItem value="TERMINATED">TERMINATED - Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              SLA Commitment Tier
            </label>
            <Select value={slaTier} onValueChange={(val) => setSlaTier(val)}>
              <SelectTrigger className="w-full text-xs h-9 bg-background">
                <SelectValue placeholder="Select SLA tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">STANDARD - Next Business Day</SelectItem>
                <SelectItem value="PREMIUM">PREMIUM - 4hr Response SLA</SelectItem>
                <SelectItem value="ENTERPRISE_24_7">ENTERPRISE 24/7 - Dedicated Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Contract Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Contract Expiration / Renewal Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Global B2B Account Discount Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs bg-background border border-border rounded-lg pl-3 pr-8 py-2 outline-none focus:border-primary"
              />
              <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            onClick={handleSaveContract}
            disabled={isSubmitting}
            className="text-xs font-semibold h-9 px-5 gap-1.5"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Contract Terms
          </Button>
        </div>
      </div>
    </div>
  );
}
