"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Building,
  Check,
  X,
  Edit2,
  Search,
  Activity
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";
import { upsertCostCenter } from "@/app/actions/finance-settings";
import { cn } from "@repo/ui/lib/utils";

export function CostCenterManager({ initialCostCenters }: { initialCostCenters: any[] }) {
  const [costCenters, setCostCenters] = useState(initialCostCenters);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true
  });

  const handleEdit = (cc: any) => {
    setIsEditing(cc.id);
    setFormData({
      name: cc.name,
      code: cc.code,
      description: cc.description || "",
      isActive: cc.isActive
    });
  };

  const handleSave = async (id?: string) => {
    if (!formData.name || !formData.code) {
      toast.error("Name and Code are required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await upsertCostCenter({ ...formData, id });
        if (id) {
          setCostCenters(costCenters.map(cc => cc.id === id ? result : cc));
          toast.success("Cost center updated");
        } else {
          setCostCenters([...costCenters, result]);
          toast.success("Cost center created");
        }
        setIsEditing(null);
        setFormData({ name: "", code: "", description: "", isActive: true });
      } catch (error) {
        toast.error("Failed to save cost center");
      }
    });
  };

  const filtered = costCenters.filter(cc =>
    cc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Cost Centers</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Manage financial dimensions for reporting</p>
        </div>
      </div>

      <div className="p-6 border-b border-zinc-100 flex items-center gap-4 bg-white sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search cost centers..."
            className="pl-9 h-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setIsEditing('new')}
          disabled={isEditing === 'new'}
          size="sm"
          className="bg-[#34A853] hover:bg-[#2d9147]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Center
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {isEditing === 'new' && (
            <div className="p-6 rounded-2xl border-2 border-[#34A853] bg-[#34A853]/5 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Marketing Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CC-MKT-01"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(null)}>Cancel</Button>
                <Button size="sm" onClick={() => handleSave()} disabled={isPending}>
                  {isPending ? "Creating..." : "Create Cost Center"}
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 && isEditing !== 'new' ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed border-zinc-200 rounded-2xl">
              <div className="p-4 rounded-full bg-zinc-100 text-zinc-400 mb-4">
                <Building className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900">No cost centers found</h4>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Cost centers allow you to track spending across different departments, projects, or branches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((cc) => (
                <div
                  key={cc.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex items-center justify-between group",
                    isEditing === cc.id ? "border-[#34A853] bg-[#34A853]/5" : "border-zinc-200 bg-white hover:border-zinc-300"
                  )}
                >
                  {isEditing === cc.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase">Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase">Code</Label>
                        <Input
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-[#34A853] hover:bg-[#2d9147]" onClick={() => handleSave(cc.id)} disabled={isPending}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition-colors">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                            {cc.name}
                            {!cc.isActive && <Badge variant="secondary" className="text-[8px] h-3 px-1">Inactive</Badge>}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-[#34A853] font-bold">{cc.code}</span>
                            {cc.description && (
                              <>
                                <span className="text-[10px] text-zinc-300">•</span>
                                <span className="text-[10px] text-zinc-400 line-clamp-1">{cc.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cc.isActive}
                          onCheckedChange={async (val) => {
                            await upsertCostCenter({ ...cc, isActive: val });
                            setCostCenters(costCenters.map(item => item.id === cc.id ? { ...item, isActive: val } : item));
                            toast.success(`Cost center ${val ? 'activated' : 'deactivated'}`);
                          }}
                        />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => handleEdit(cc)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
