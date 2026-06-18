"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/pos-auth-store";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Banknote, History, RefreshCcw, Upload, X, Loader2 } from "lucide-react";
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
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    if (orgSlug) {
      fetchFunds();
      fetchTransactions();
    }
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

  const fetchTransactions = async () => {
    if (!orgSlug) return;
    try {
      setIsLoadingTransactions(true);
      const response = await invoke<any>("authenticated_api_request", {
        method: "GET",
        path: `api/v3/${orgSlug}/pos/petty-cash/transactions`,
        query: { limit: 10 },
      });
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch petty cash transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleFileUpload = async () => {
    if (!orgSlug) return;

    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
      });

      if (selected && typeof selected === "string") {
        setIsUploading(true);
        toast.info("Uploading receipt...");

        const response = await invoke<any>("upload_file_command", {
          filePath: selected,
        });

        if (response.url) {
          setReceiptUrl(response.url);
          toast.success("Receipt uploaded");
        } else {
          throw new Error("No URL returned from upload");
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload receipt");
    } finally {
      setIsUploading(false);
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
        receiptUrl,
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
      setReceiptUrl(null);
      fetchFunds(); // Refresh balance
      fetchTransactions(); // Refresh activity
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

              <div className="space-y-2">
                <Label>Receipt (Optional)</Label>
                <div className="flex items-center gap-4">
                  {receiptUrl ? (
                    <div className="relative w-20 h-20 rounded border overflow-hidden group">
                      <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReceiptUrl(null)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-20 w-24 flex-col gap-1"
                        disabled={isUploading}
                        onClick={handleFileUpload}
                      >
                        {isUploading ? <Loader2 className="animate-spin h-6 w-6" /> : <Upload className="h-6 w-6" />}
                        <span className="text-xs">Upload</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
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
              {isLoadingTransactions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-xs font-medium leading-none">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-xs font-bold whitespace-nowrap">
                        {tx.type === "EXPENSE" ? "-" : "+"} {currency} {parseFloat(tx.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  No recent activity found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
