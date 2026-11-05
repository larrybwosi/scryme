"use client";

import { useState, useTransition } from "react";
import {
  saveKRAConfigAction,
  validateKRAPinAction,
  retryKRAAction,
} from "@/app/actions/kra";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface TaxComplianceClientProps {
  initialConfig: any;
  initialSummary: any;
  initialLogs: any[];
}

export function TaxComplianceClient({
  initialConfig,
  initialSummary,
  initialLogs,
}: TaxComplianceClientProps) {
  const [config, setConfig] = useState(
    initialConfig || {
      provider: "NAVARI",
      environment: "SANDBOX",
      enforcementMode: "ASYNC",
      kraPin: "",
      businessName: "",
      branchCode: "00",
      deviceSerialNumber: "",
      controlUnitId: "",
      apiKey: "",
      apiSecret: "",
      highValueThreshold: 100000,
      autoSyncSales: true,
      autoSyncPurchases: true,
      isActive: false,
    },
  );

  const [logs, setLogs] = useState(initialLogs || []);
  const [pinToValidate, setPinToValidate] = useState("");
  const [pinValidationResult, setPinValidationResult] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveConfig = () => {
    startTransition(async () => {
      try {
        const res = await saveKRAConfigAction(config);
        setConfig(res);
        toast.success("KRA & eTIMS settings saved successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to save settings");
      }
    });
  };

  const handleValidatePin = () => {
    if (!pinToValidate) return;
    startTransition(async () => {
      try {
        const res = await validateKRAPinAction(pinToValidate);
        setPinValidationResult(res);
        if (res.valid) {
          toast.success("KRA PIN is valid!");
        } else {
          toast.error(res.message || "Invalid KRA PIN");
        }
      } catch (err: any) {
        toast.error(err.message || "PIN verification failed");
      }
    });
  };

  const handleRetryLog = (logId: string) => {
    startTransition(async () => {
      try {
        const res = await retryKRAAction(logId);
        if (res.success) {
          toast.success("Invoice successfully resubmitted to KRA!");
          setLogs((prev) =>
            prev.map((l) =>
              l.id === logId
                ? {
                    ...l,
                    status: res.status,
                    controlCode: res.controlCode,
                    receiptNumber: res.receiptNumber,
                    errorMessage: null,
                  }
                : l,
            ),
          );
        } else {
          toast.error(res.errorMessage || "Submission retry failed");
        }
      } catch (err: any) {
        toast.error(err.message || "Retry failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Output VAT (Sales)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number(initialSummary?.outputVat || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From fiscalized customer invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input VAT (Purchases)</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number(initialSummary?.inputVat || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From supplier purchases with tax invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net VAT Payable</CardTitle>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number(initialSummary?.netVatPayable || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Obligation for current period</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">eTIMS Status</CardTitle>
            {config.isActive ? (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                ACTIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                DISABLED
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">{config.provider.toLowerCase()} Mode</div>
            <p className="text-xs text-muted-foreground mt-1">
              Environment: <span className="font-mono">{config.environment}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Fiscal Transmission Logs</TabsTrigger>
          <TabsTrigger value="validate">PIN Verification Tool</TabsTrigger>
          <TabsTrigger value="config">KRA & eTIMS Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fiscal Audit Trail</CardTitle>
                <CardDescription>
                  Real-time record of all invoices and purchases transmitted to KRA eTIMS.
                </CardDescription>
              </div>
              <Badge variant="secondary">{logs.length} Submissions</Badge>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <FileText className="w-10 h-10 mb-2 opacity-40" />
                  <p>No fiscal transmissions logged yet.</p>
                  <p className="text-xs">Finalize sales or invoices with KRA integration enabled to record audit logs.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                      <tr>
                        <th className="py-3 px-4">Invoice / Doc</th>
                        <th className="py-3 px-4">Taxpayer PIN</th>
                        <th className="py-3 px-4">Taxable</th>
                        <th className="py-3 px-4">Tax (16%)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Control Code</th>
                        <th className="py-3 px-4">Receipt No</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium">{log.invoiceId}</td>
                          <td className="py-3 px-4 font-mono">{log.kraPin}</td>
                          <td className="py-3 px-4">KES {Number(log.taxableAmount).toLocaleString()}</td>
                          <td className="py-3 px-4 font-medium">KES {Number(log.taxAmount).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            {log.status === "ACKNOWLEDGED" || log.status === "SUBMITTED" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                {log.status}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">{log.status}</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{log.controlCode || "-"}</td>
                          <td className="py-3 px-4 font-mono text-xs">{log.receiptNumber || "-"}</td>
                          <td className="py-3 px-4 text-right">
                            {log.status === "FAILED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryLog(log.id)}
                                disabled={isPending}
                                className="h-7 text-xs gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Taxpayer KRA PIN</CardTitle>
              <CardDescription>
                Validate buyer or supplier PIN with KRA database prior to generating fiscal tax invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 max-w-lg">
                <Input
                  placeholder="Enter KRA PIN (e.g. A001234567X)"
                  value={pinToValidate}
                  onChange={(e) => setPinToValidate(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <Button onClick={handleValidatePin} disabled={isPending || !pinToValidate} className="gap-2">
                  <Search className="w-4 h-4" />
                  Validate
                </Button>
              </div>

              {pinValidationResult && (
                <div
                  className={`p-4 rounded-lg border max-w-lg mt-4 ${
                    pinValidationResult.valid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {pinValidationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span>{pinValidationResult.valid ? "Valid Taxpayer PIN" : "Invalid PIN"}</span>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <p>
                      <strong>PIN:</strong> {pinValidationResult.kraPin}
                    </p>
                    {pinValidationResult.taxpayerName && (
                      <p>
                        <strong>Registered Name:</strong> {pinValidationResult.taxpayerName}
                      </p>
                    )}
                    {pinValidationResult.status && (
                      <p>
                        <strong>Status:</strong> {pinValidationResult.status}
                      </p>
                    )}
                    <p className="text-xs opacity-80 mt-1">{pinValidationResult.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KRA & eTIMS Configuration</CardTitle>
              <CardDescription>
                Configure regional tax compliance settings, eTIMS hardware / API credentials, and threshold rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div>
                  <h4 className="font-semibold text-sm">Enable Tax Integration (eTIMS)</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatically fiscalize POS sales and invoices with KRA eTIMS.
                  </p>
                </div>
                <Switch
                  checked={config.isActive}
                  onCheckedChange={(val) => setConfig((p: any) => ({ ...p, isActive: val }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Integration</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={config.provider}
                    onChange={(e) => setConfig((p: any) => ({ ...p, provider: e.target.value }))}
                  >
                    <option value="NAVARI">Navari KRA Integration (API Aggregator)</option>
                    <option value="DIRECT_ETIMS">Direct KRA eTIMS (OSCU / VSCU)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Environment Mode</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={config.environment}
                    onChange={(e) => setConfig((p: any) => ({ ...p, environment: e.target.value }))}
                  >
                    <option value="SANDBOX">Sandbox (Testing / Staging)</option>
                    <option value="PRODUCTION">Production (Live KRA Fiscalization)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Taxpayer KRA PIN</Label>
                  <Input
                    placeholder="e.g. P051123456Z"
                    value={config.kraPin}
                    onChange={(e) => setConfig((p: any) => ({ ...p, kraPin: e.target.value.toUpperCase() }))}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registered Business / Trader Name</Label>
                  <Input
                    placeholder="e.g. Scryme Enterprises Ltd"
                    value={config.businessName || ""}
                    onChange={(e) => setConfig((p: any) => ({ ...p, businessName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Branch Code</Label>
                  <Input
                    placeholder="e.g. 00"
                    value={config.branchCode}
                    onChange={(e) => setConfig((p: any) => ({ ...p, branchCode: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Device Serial Number / Control Unit ID</Label>
                  <Input
                    placeholder="e.g. KRAMW012345"
                    value={config.deviceSerialNumber || ""}
                    onChange={(e) => setConfig((p: any) => ({ ...p, deviceSerialNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Key / CMC Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter API key"
                    value={config.apiKey || ""}
                    onChange={(e) => setConfig((p: any) => ({ ...p, apiKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter API secret"
                    value={config.apiSecret || ""}
                    onChange={(e) => setConfig((p: any) => ({ ...p, apiSecret: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>High-Value Lock Threshold (KES)</Label>
                  <Input
                    type="number"
                    value={config.highValueThreshold}
                    onChange={(e) =>
                      setConfig((p: any) => ({ ...p, highValueThreshold: Number(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Sales exceeding this amount require confirmed tax server response before completion.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Enforcement Mode</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={config.enforcementMode}
                    onChange={(e) => setConfig((p: any) => ({ ...p, enforcementMode: e.target.value }))}
                  >
                    <option value="ASYNC">Async (Non-blocking background sync)</option>
                    <option value="BLOCKING">Blocking (Wait for KRA acknowledgment)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button onClick={handleSaveConfig} disabled={isPending}>
                  {isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
