"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, AlertTriangle, ShieldCheck, DollarSign, Clock, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import {
  getCompanyFinancialOverview,
  updateCompanyCreditTerms,
  type CompanyFinancialOverview,
} from "@/app/actions/company-enterprise";

export function CompanyFinancialsTab({
  company,
  currency = "USD",
}: {
  company: any;
  currency?: string;
}) {
  const [data, setData] = useState<CompanyFinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [creditLimit, setCreditLimit] = useState(company.creditLimit || 0);
  const [creditHold, setCreditHold] = useState(company.creditHold || false);
  const [paymentTermsDays, setPaymentTermsDays] = useState(company.paymentTermsDays || 30);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getCompanyFinancialOverview(company.id);
      setData(res);
      setCreditLimit(res.creditLimit);
      setCreditHold(res.creditHold);
      setPaymentTermsDays(res.paymentTermsDays);
    } catch (err: any) {
      toast.error(err.message || "Failed to load financial overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company.id]);

  const handleSaveTerms = async () => {
    try {
      setIsUpdating(true);
      const res = await updateCompanyCreditTerms(company.id, {
        creditLimit: Number(creditLimit) || 0,
        creditHold,
        paymentTermsDays: Number(paymentTermsDays) || 0,
      });

      if (res.success) {
        toast.success("Credit & financial terms updated");
        await loadData();
      } else {
        toast.error(res.error || "Failed to update credit terms");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update credit terms");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat(currency === "KES" ? "en-KE" : "en-US", {
      style: "currency",
      currency,
    }).format(val || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading credit & financial metrics...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Alert if on Credit Hold */}
      {creditHold && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">Account on Credit Hold</div>
            <div className="text-xs opacity-90">All new orders and credit dispatches for this company are blocked.</div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>Credit Limit</span>
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">{formatMoney(data?.creditLimit || 0)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Maximum approved revolving balance</div>
        </div>

        <div className="p-4 border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>Outstanding Balance</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-foreground">{formatMoney(data?.totalReceivables || 0)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Unsettled receivables & active invoices</div>
        </div>

        <div className="p-4 border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>Available Credit</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-500">{formatMoney(data?.availableCredit || 0)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Remaining headroom for new orders</div>
        </div>

        <div className="p-4 border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>Payment Terms</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-foreground">Net {data?.paymentTermsDays || 0} Days</div>
          <div className="text-[11px] text-muted-foreground mt-1">Standard invoice payment window</div>
        </div>
      </div>

      {/* Credit Utilization Bar */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-3">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span>Credit Utilization</span>
          <span className={data && data.creditUtilizationRate > 85 ? "text-destructive font-bold" : "text-primary"}>
            {data?.creditUtilizationRate || 0}%
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              (data?.creditUtilizationRate || 0) > 85
                ? "bg-destructive"
                : (data?.creditUtilizationRate || 0) > 60
                ? "bg-amber-500"
                : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, data?.creditUtilizationRate || 0)}%` }}
          />
        </div>
      </div>

      {/* Receivables Aging Breakdown */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Accounts Receivable Aging</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 border border-border rounded-lg bg-background">
            <div className="text-xs text-muted-foreground">Current (0-30 days)</div>
            <div className="text-base font-bold text-foreground mt-1">{formatMoney(data?.aging.current || 0)}</div>
          </div>
          <div className="p-3 border border-border rounded-lg bg-background">
            <div className="text-xs text-muted-foreground">31 - 60 Days Overdue</div>
            <div className="text-base font-bold text-amber-500 mt-1">{formatMoney(data?.aging.overdue30 || 0)}</div>
          </div>
          <div className="p-3 border border-border rounded-lg bg-background">
            <div className="text-xs text-muted-foreground">61 - 90 Days Overdue</div>
            <div className="text-base font-bold text-orange-500 mt-1">{formatMoney(data?.aging.overdue60 || 0)}</div>
          </div>
          <div className="p-3 border border-border rounded-lg bg-background">
            <div className="text-xs text-muted-foreground">90+ Days Critical Overdue</div>
            <div className="text-base font-bold text-destructive mt-1">{formatMoney(data?.aging.overdue90Plus || 0)}</div>
          </div>
        </div>
      </div>

      {/* Credit Governance Form */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Credit & Terms Governance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Approved Credit Limit ({currency})
            </label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Net Payment Terms (Days)
            </label>
            <input
              type="number"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Credit Hold Status
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditHold}
                  onChange={(e) => setCreditHold(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
              </label>
              <span className={`text-xs font-bold ${creditHold ? "text-destructive" : "text-muted-foreground"}`}>
                {creditHold ? "ON CREDIT HOLD" : "Normal Credit"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleSaveTerms}
            disabled={isUpdating}
            className="px-5 font-semibold text-xs h-9"
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Financial Terms
          </Button>
        </div>
      </div>
    </div>
  );
}
