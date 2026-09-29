"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  RotateCcw,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
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
import { toast } from "sonner";
import { getProductActivityLogs, revertProductState } from "../../../../actions/inventory";

interface ActivityTabProps {
  productId: string;
  onRevertSuccess?: () => void;
}

export function ActivityTab({ productId, onRevertSuccess }: ActivityTabProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State for Revert Confirmation
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductActivityLogs(productId);
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load product activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [productId]);

  const handleConfirmRevert = async () => {
    if (!selectedLog) return;

    try {
      setIsReverting(true);
      const res = await revertProductState(productId, selectedLog.id);
      if (res.success) {
        toast.success("Product state successfully reverted!");
        setSelectedLog(null);
        if (onRevertSuccess) {
          onRevertSuccess();
        }
        await fetchLogs();
      } else {
        toast.error(res.message || "Failed to revert product state.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while reverting product state.");
    } finally {
      setIsReverting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm">Loading activity logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-lg text-foreground">Access Restricted</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Product Activity History
            </CardTitle>
            <CardDescription className="mt-1">
              Audit log of product updates and state snapshot history. Visible exclusively to Admins and Owners.
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Admin & Owner Access
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
              <p className="font-medium text-foreground">No activity logs found</p>
              <p className="text-sm mt-1 max-w-sm">
                Updates to this product will automatically be recorded here with complete state snapshots.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border space-y-8">
              {logs.map((log) => {
                const isRestore = log.action === "RESTORE";
                const details = log.details || {};
                const snapshot = details.snapshot || details.afterState || details.previousState;
                const canRevert = Boolean(snapshot);

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] top-1 h-5 w-5 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-xs">
                      {isRestore ? (
                        <RotateCcw className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>

                    <div className="bg-card border rounded-lg p-4 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {log.actorImage ? (
                              <AvatarImage src={log.actorImage} alt={log.actorName} />
                            ) : null}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {log.actorName ? log.actorName.slice(0, 2).toUpperCase() : "US"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {log.actorName}
                              </span>
                              {log.actorEmail ? (
                                <span className="text-xs text-muted-foreground">
                                  ({log.actorEmail})
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(log.performedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isRestore ? "warning" : "secondary"}
                            className="font-mono text-[11px] capitalize"
                          >
                            {log.action}
                          </Badge>
                          {canRevert && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => setSelectedLog(log)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Revert to this state
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-foreground mb-2">
                        {log.description}
                      </p>

                      {snapshot && (
                        <div className="mt-3 bg-muted/40 rounded-md p-3 text-xs space-y-1.5 border font-mono">
                          <div className="font-semibold text-muted-foreground mb-1 font-sans">
                            Snapshot Preview:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                            <div><span className="text-foreground">Name:</span> {snapshot.name || "N/A"}</div>
                            <div><span className="text-foreground">SKU:</span> {snapshot.sku || "N/A"}</div>
                            <div><span className="text-foreground">Category ID:</span> {snapshot.categoryId || "N/A"}</div>
                            <div><span className="text-foreground">Status:</span> {snapshot.isActive ? "Active" : "Inactive"}</div>
                            {snapshot.variants?.[0] && (
                              <>
                                <div><span className="text-foreground">Buying Price:</span> {snapshot.variants[0].buyingPrice ?? "N/A"}</div>
                                <div><span className="text-foreground">Retail Price:</span> {snapshot.variants[0].retailPrice ?? "N/A"}</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Confirm Product Revert
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-sm space-y-3 text-foreground/90">
              <p>
                Are you sure you want to revert this product to the state saved on{" "}
                <span className="font-semibold text-foreground">
                  {selectedLog ? new Date(selectedLog.performedAt).toLocaleString() : ""}
                </span>
                ?
              </p>
              <p className="text-xs text-muted-foreground">
                This action will update the product details and variants to match this snapshot, and record an audit log entry of this revert.
              </p>

              {selectedLog?.details?.snapshot && (
                <div className="bg-muted p-3 rounded-md text-xs font-mono space-y-1 border mt-2">
                  <div className="font-semibold text-foreground mb-1 font-sans">
                    Target Snapshot Attributes:
                  </div>
                  <div>Product Name: {selectedLog.details.snapshot.name}</div>
                  <div>SKU: {selectedLog.details.snapshot.sku}</div>
                  <div>Type: {selectedLog.details.snapshot.type}</div>
                  <div>Active: {selectedLog.details.snapshot.isActive ? "Yes" : "No"}</div>
                  {selectedLog.details.snapshot.variants?.[0] && (
                    <div>
                      Pricing: Buying {selectedLog.details.snapshot.variants[0].buyingPrice || "0"} | Retail {selectedLog.details.snapshot.variants[0].retailPrice || "0"}
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRevert();
              }}
              disabled={isReverting}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {isReverting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reverting...
                </>
              ) : (
                "Confirm Revert"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
