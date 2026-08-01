"use client";

import React from "react";
import { Settings } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { cn } from "@repo/ui/lib/utils";

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

interface CoreTabProps {
  coreForm: {
    name: string;
    description: string;
    sku: string;
    categoryId: string;
    pricingModel: PricingModel;
    price: string;
    minPrice: string;
    estimatedDuration: string;
    requiresDeposit: boolean;
    depositAmount: string;
    depositType: DepositType;
    isActive: boolean;
  };
  setCoreForm: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
}

export function CoreTab({
  coreForm,
  setCoreForm,
  categories,
}: CoreTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 border shadow-sm">
      <div>
        <h3 className="text-base font-bold text-slate-900">Standard Service Settings</h3>
        <p className="text-xs text-slate-500 mt-0.5">Edit basic parameters used for bookings, checkout sessions, and invoice generation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="core-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Name</Label>
          <Input
            id="core-name"
            value={coreForm.name}
            onChange={(e) => setCoreForm((prev: any) => ({ ...prev, name: e.target.value }))}
            className="rounded-none bg-white border-slate-300"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="core-desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">Brief Summary</Label>
          <Input
            id="core-desc"
            value={coreForm.description}
            onChange={(e) => setCoreForm((prev: any) => ({ ...prev, description: e.target.value }))}
            placeholder="Short plain-text summary displayed on invoices & booking emails"
            className="rounded-none bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="core-sku" className="text-xs font-bold uppercase tracking-wider text-slate-500">Unique SKU Code</Label>
          <Input
            id="core-sku"
            value={coreForm.sku}
            onChange={(e) => setCoreForm((prev: any) => ({ ...prev, sku: e.target.value }))}
            className="rounded-none bg-white border-slate-300 font-mono"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="core-cat" className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Placement</Label>
          <Select
            value={coreForm.categoryId}
            onValueChange={(val) => setCoreForm((prev: any) => ({ ...prev, categoryId: val }))}
          >
            <SelectTrigger id="core-cat" className="rounded-none bg-white border-slate-300 h-9">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="rounded-none">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="core-model" className="text-xs font-bold uppercase tracking-wider text-slate-500">Pricing Engine</Label>
          <Select
            value={coreForm.pricingModel}
            onValueChange={(val: PricingModel) => setCoreForm((prev: any) => ({ ...prev, pricingModel: val }))}
          >
            <SelectTrigger id="core-model" className="rounded-none bg-white border-slate-300 h-9">
              <SelectValue placeholder="Pricing structure" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value={PricingModel.FIXED} className="rounded-none">Fixed Pricing</SelectItem>
              <SelectItem value={PricingModel.HOURLY} className="rounded-none">Hourly Rate</SelectItem>
              <SelectItem value={PricingModel.VARIABLE} className="rounded-none">Variable Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="core-price" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {coreForm.pricingModel === PricingModel.VARIABLE ? "Maximum Price" : "Rate / Price"}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
            <Input
              id="core-price"
              type="number"
              step="0.01"
              className="pl-7 rounded-none bg-white border-slate-300"
              value={coreForm.price}
              onChange={(e) => setCoreForm((prev: any) => ({ ...prev, price: e.target.value }))}
              required
            />
          </div>
        </div>

        {coreForm.pricingModel === PricingModel.VARIABLE && (
          <div className="space-y-1.5">
            <Label htmlFor="core-min" className="text-xs font-bold uppercase tracking-wider text-slate-500">Minimum Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
              <Input
                id="core-min"
                type="number"
                step="0.01"
                className="pl-7 rounded-none bg-white border-slate-300"
                value={coreForm.minPrice}
                onChange={(e) => setCoreForm((prev: any) => ({ ...prev, minPrice: e.target.value }))}
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="core-duration" className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Duration (Mins)</Label>
          <Input
            id="core-duration"
            type="number"
            value={coreForm.estimatedDuration}
            onChange={(e) => setCoreForm((prev: any) => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="e.g., 60 minutes"
            className="rounded-none bg-white border-slate-300"
          />
        </div>

        <div className="md:col-span-2 pt-2 border-t mt-2 flex items-center space-x-2">
          <Checkbox
            id="core-deposit"
            checked={coreForm.requiresDeposit}
            onCheckedChange={(checked) => setCoreForm((prev: any) => ({ ...prev, requiresDeposit: !!checked }))}
          />
          <Label htmlFor="core-deposit" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none">
            Requires Deposit to confirm Bookings
          </Label>
        </div>

        {coreForm.requiresDeposit && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="core-dep-type" className="text-xs font-bold uppercase tracking-wider text-slate-500">Deposit Calculation</Label>
              <Select
                value={coreForm.depositType}
                onValueChange={(val: DepositType) => setCoreForm((prev: any) => ({ ...prev, depositType: val }))}
              >
                <SelectTrigger id="core-dep-type" className="rounded-none bg-white border-slate-300 h-9">
                  <SelectValue placeholder="Select deposit type" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value={DepositType.FIXED} className="rounded-none">Fixed Standard Amount</SelectItem>
                  <SelectItem value={DepositType.PERCENTAGE} className="rounded-none">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="core-dep-amt" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {coreForm.depositType === DepositType.PERCENTAGE ? "Deposit %" : "Deposit Amount"}
              </Label>
              <div className="relative">
                {coreForm.depositType === DepositType.FIXED && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                )}
                <Input
                  id="core-dep-amt"
                  type="number"
                  step="0.01"
                  className={cn("rounded-none bg-white border-slate-300", coreForm.depositType === DepositType.FIXED && "pl-7")}
                  value={coreForm.depositAmount}
                  onChange={(e) => setCoreForm((prev: any) => ({ ...prev, depositAmount: e.target.value }))}
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="md:col-span-2 pt-2 flex items-center space-x-2">
          <Checkbox
            id="core-active"
            checked={coreForm.isActive}
            onCheckedChange={(checked) => setCoreForm((prev: any) => ({ ...prev, isActive: !!checked }))}
          />
          <Label htmlFor="core-active" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none">
            Active & Listed on Booking Dashboards
          </Label>
        </div>
      </div>
    </div>
  );
}
