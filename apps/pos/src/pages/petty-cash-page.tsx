"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/pos-auth-store";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Banknote, History, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { usePosStore } from "@/store/store";
import { useCashDrawer } from "@/hooks/use-cash-drawer";

export default function PettyCashPage() {
  const { openPhysicalDrawer } = useCashDrawer();
  const { currentLocation } = useAuth();
  const orgSlug = useAuthStore((state) => state.deviceConfig?.orgSlug);
  const currency = usePosStore((state) => state.settings.currency);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  useEffect(() => {
    fetchFunds();
  }, [orgSlug]);

  const fetchFunds = async () => {
    if (!orgSlug) return;
    try {
      setIsLoadingFunds(true);
      const response = await invoke<any>("authenticated_api_request", {
        method: "GET",
        path: `api/v3/${orgSlug}/pos/petty-cash/funds`,
      });
      setFunds(response.data || []);
    } catch (error) {
      console.error("Failed to fetch petty cash funds:", error);
    } finally {
      setIsLoadingFunds(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !orgSlug) return;

    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        description,
        paymentMethod: "CASH",
      };

      await invoke("register_petty_cash_command", {
        orgSlug,
        payload,
      });

      // Open physical drawer
      await openPhysicalDrawer();

      toast.success("Petty cash expense registered successfully");
      setAmount("");
      setDescription("");
      fetchFunds(); // Refresh balance
    } catch (error: any) {
      console.error("Failed to register petty cash:", error);
      toast.error("Failed to register petty cash", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Petty Cash</h1>
          <p className="text-muted-foreground mt-1">Register and track minor expenses</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchFunds} disabled={isLoadingFunds}>
          <RefreshCcw className={isLoadingFunds ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Register New Expense</CardTitle>
            <CardDescription>Enter details for the petty cash expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currency})</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Purpose</Label>
                <Textarea
                  id="description"
                  placeholder="What was this expense for?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Expense"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Fund Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFunds ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded" />
              ) : funds.length > 0 ? (
                <div className="text-3xl font-bold">
                  {currency} {parseFloat(funds[0].amount).toLocaleString()}
                </div>
              ) : (
                <div className="text-muted-foreground italic">No active fund</div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Location: {currentLocation?.name || "Global"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Register an expense to see it reflected in the dashboard reports.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
