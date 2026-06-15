"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Bell,
  AlertTriangle,
  Mail,
  User,
  Activity,
  ArrowUpRight,
  Settings
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";
import { upsertBudgetAlert } from "@/app/actions/finance-settings";
import { cn } from "@repo/ui/lib/utils";

export function BudgetAlertManager({ initialAlerts }: { initialAlerts: any[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    budgetId: "",
    threshold: 80,
    recipients: [] as string[],
    isActive: true
  });

  const handleAdd = async () => {
    if (!formData.budgetId) {
      toast.error("Budget selection is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await upsertBudgetAlert(formData);
        setAlerts([...alerts, result]);
        toast.success("Alert created");
        setIsAdding(false);
        setFormData({ budgetId: "", threshold: 80, recipients: [], isActive: true });
      } catch (error) {
        toast.error("Failed to create alert");
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Budget Alerts</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Automated notifications for budget utilization</p>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#34A853] hover:bg-[#2d9147]">
          <Plus className="w-4 h-4 mr-2" /> New Alert
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {isAdding && (
            <div className="p-6 rounded-2xl border-2 border-[#34A853] bg-[#34A853]/5 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Budget Utilization Threshold (%)</Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                      className="pl-9"
                      placeholder="e.g., 80"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Budget ID</Label>
                  <Input
                    value={formData.budgetId}
                    onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                    placeholder="Enter Budget ID..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAdd} disabled={isPending}>
                  {isPending ? "Creating..." : "Create Alert"}
                </Button>
              </div>
            </div>
          )}

          {alerts.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed border-zinc-200 rounded-2xl">
              <div className="p-4 rounded-full bg-zinc-100 text-zinc-400 mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900">No active alerts</h4>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Stay informed when your departments or projects approach their budget limits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        alert.threshold >= 90 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                      )}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">
                          {alert.budget?.name || "General Budget"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-[#34A853]">{alert.threshold}% Threshold</span>
                          <span className="text-[10px] text-zinc-300">•</span>
                          <span className="text-[10px] text-zinc-400">Real-time tracking</span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={async (val) => {
                        await upsertBudgetAlert({ ...alert, isActive: val });
                        setAlerts(alerts.map(a => a.id === alert.id ? { ...a, isActive: val } : a));
                        toast.success(`Alert ${val ? 'enabled' : 'disabled'}`);
                      }}
                    />
                  </div>

                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      <span>Recipients</span>
                      <Mail className="w-3 h-3" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alert.recipients?.map((email: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[9px] font-medium bg-zinc-100 text-zinc-600">
                          {email}
                        </Badge>
                      )) || (
                        <span className="text-[10px] text-zinc-400 italic">No recipients defined. Admins will be notified by default.</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-zinc-300" />
                      <span className="text-[10px] text-zinc-400">Last triggered: {alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase hover:text-[#34A853]">
                      Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-600">Default Notification Channel</p>
            </div>
            <Badge className="bg-white text-zinc-900 border-zinc-200">Email & Dashboard</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
