"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Building2,
  Plus,
  Users,
  Wallet,
  Settings,
  Percent,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function PartnersClient({ partners: initialPartners }: { partners: any[] }) {
  const [partners, setPartners] = useState(initialPartners);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [benefitType, setBenefitType] = useState<"COMMISSION" | "FIXED_FEE">("FIXED_FEE");
  const [fixedFee, setFixedFee] = useState("5.00");
  const [commissionRate, setCommissionRate] = useState("10.00");

  const handleCreatePartner = async () => {
    if (!name.trim()) {
      toast.error("Partner name is required");
      return;
    }
    setSubmitting(true);
    try {
      toast.success("Delivery partner successfully created");
      setDialogOpen(false);
      setName("");
      setPhone("");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create partner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Active Logistics Partners</h3>
          <p className="text-xs text-muted-foreground">Manage external delivery providers and commission agreements.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Delivery Partner
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner.id} className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{partner.name}</CardTitle>
                  <CardDescription className="text-xs">{partner.phone || partner.email || "No contact info"}</CardDescription>
                </div>
              </div>
              <Badge variant={partner.isActive ? "default" : "secondary"}>
                {partner.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Assigned Drivers:</span>
                <span className="font-semibold text-foreground">{partner._count?.drivers || 0} Drivers</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Fee Model:</span>
                <Badge variant="outline" className="capitalize">
                  {partner.benefitType?.toLowerCase().replace("_", " ") || "Fixed Fee"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Rate / Payout:</span>
                <span className="font-semibold text-foreground">
                  {partner.benefitType === "COMMISSION"
                    ? `${partner.commissionRate || 0}% Commission`
                    : `$${partner.fixedFee || "0.00"} Fixed Fee`}
                </span>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-3.5 h-3.5" /> Balance: ${partner.walletBalance || "0.00"}
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {partners.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-xl border-dashed border-border/60">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-semibold text-sm">No Delivery Partners Configured</h4>
            <p className="text-xs text-muted-foreground mt-1">Add external 3rd-party delivery partners to track fleet payouts.</p>
          </div>
        )}
      </div>

      {/* Add Partner Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Add Delivery Partner
            </DialogTitle>
            <DialogDescription>
              Create a new 3rd-party logistics company and define driver fee structures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Partner Company Name</Label>
              <Input
                placeholder="e.g., Swift Logistics Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  placeholder="dispatch@partner.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Payout Model</Label>
              <Select value={benefitType} onValueChange={(v: any) => setBenefitType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_FEE">Fixed Fee Per Delivery</SelectItem>
                  <SelectItem value="COMMISSION">Percentage Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {benefitType === "FIXED_FEE" ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Fixed Fee Amount ($)</Label>
                <Input
                  type="number"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePartner} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Delivery Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
