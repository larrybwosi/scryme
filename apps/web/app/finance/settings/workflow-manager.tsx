"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Shield,
  Clock,
  Filter,
  MoreVertical,
  Settings2,
  Workflow,
  Zap,
  MapPin,
  Tag as TagIcon,
  DollarSign
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/ui/select";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@repo/ui/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  createApprovalWorkflow,
  updateApprovalWorkflow,
  deleteApprovalWorkflow
} from "@/app/actions/finance-settings";
import { cn } from "@repo/ui/lib/utils";

export function WorkflowManager({
  initialWorkflows,
  locations,
  categories,
  windmillScripts
}: {
  initialWorkflows: any[];
  locations: any[];
  categories: any[];
  windmillScripts: any[];
}) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddWorkflow = () => {
    setEditingWorkflow({
      name: "",
      description: "",
      triggerEvent: "EXPENSE_CREATED",
      isActive: true,
      steps: [
        {
          name: "Manager Approval",
          stepNumber: 1,
          allConditionsMustMatch: true,
          conditions: [],
          actions: [
            {
              type: "ROLE",
              approverRole: "MANAGER",
              approvalMode: "ANY_ONE"
            }
          ]
        }
      ]
    });
  };

  const handleSave = async () => {
    if (!editingWorkflow.name) {
      toast.error("Workflow name is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingWorkflow.id) {
          await updateApprovalWorkflow(editingWorkflow.id, editingWorkflow);
          toast.success("Workflow updated");
        } else {
          const newWorkflow = await createApprovalWorkflow(editingWorkflow);
          setWorkflows([...workflows, newWorkflow]);
          toast.success("Workflow created");
        }
        setEditingWorkflow(null);
      } catch (error) {
        toast.error("Failed to save workflow");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    startTransition(async () => {
      try {
        await deleteApprovalWorkflow(id);
        setWorkflows(workflows.filter(w => w.id !== id));
        toast.success("Workflow deleted");
      } catch (error) {
        toast.error("Failed to delete workflow");
      }
    });
  };

  if (editingWorkflow) {
    return (
      <div className="flex flex-col h-full bg-zinc-50">
        <div className="p-6 border-b border-zinc-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setEditingWorkflow(null)}>
              Cancel
            </Button>
            <div className="h-4 w-px bg-zinc-200" />
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#34A853]" />
              {editingWorkflow.id ? "Edit Workflow" : "New Workflow"}
            </h3>
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm" className="bg-[#34A853] hover:bg-[#2d9147]">
            {isPending ? "Saving..." : "Save Workflow"}
          </Button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8 max-w-5xl mx-auto w-full">
          {/* Basic Info */}
          <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Basic Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  placeholder="e.g., High Value Purchase Approval"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select
                  value={editingWorkflow.triggerEvent}
                  onValueChange={(val) => setEditingWorkflow({ ...editingWorkflow, triggerEvent: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE_CREATED">Expense Created</SelectItem>
                    <SelectItem value="PURCHASE_ORDER_CREATED">Purchase Order Created</SelectItem>
                    <SelectItem value="STOCK_TRANSFER_CREATED">Stock Transfer Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingWorkflow.description}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                  placeholder="Describe the purpose of this workflow..."
                />
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Approval Steps</h4>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={() => {
                  const newSteps = [...editingWorkflow.steps];
                  newSteps.push({
                    name: `Step ${newSteps.length + 1}`,
                    stepNumber: newSteps.length + 1,
                    allConditionsMustMatch: true,
                    conditions: [],
                    actions: [{ type: "ROLE", approverRole: "ADMIN", approvalMode: "ANY_ONE" }]
                  });
                  setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                }}
              >
                <Plus className="w-3 h-3" /> Add Step
              </Button>
            </div>

            <div className="space-y-6">
              {editingWorkflow.steps.map((step: any, sIdx: number) => (
                <div key={sIdx} className="relative pl-8">
                  {/* Vertical line connecting steps */}
                  {sIdx < editingWorkflow.steps.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-zinc-200" />
                  )}

                  {/* Step number indicator */}
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold border-4 border-zinc-50 z-10">
                    {step.stepNumber}
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                      <Input
                        value={step.name}
                        onChange={(e) => {
                          const newSteps = [...editingWorkflow.steps];
                          newSteps[sIdx].name = e.target.value;
                          setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                        }}
                        className="bg-transparent border-none font-bold text-sm h-8 p-0 focus-visible:ring-0 w-1/2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newSteps = editingWorkflow.steps.filter((_: any, i: number) => i !== sIdx);
                          // Re-number steps
                          const updatedSteps = newSteps.map((s: any, i: number) => ({ ...s, stepNumber: i + 1 }));
                          setEditingWorkflow({ ...editingWorkflow, steps: updatedSteps });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Conditions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <Filter className="w-3 h-3" /> Conditions
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] uppercase font-bold text-[#34A853]"
                            onClick={() => {
                              const newSteps = [...editingWorkflow.steps];
                              newSteps[sIdx].conditions.push({ type: "AMOUNT_RANGE", minAmount: 0 });
                              setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                            }}
                          >
                            + Add Condition
                          </Button>
                        </div>

                        {step.conditions.length === 0 ? (
                          <div className="p-4 rounded-lg border border-dashed border-zinc-200 text-center">
                            <p className="text-[11px] text-zinc-400 italic">No conditions. This step will always trigger.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {step.conditions.map((cond: any, cIdx: number) => (
                              <div key={cIdx} className="flex gap-2 items-start bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                                <Select
                                  value={cond.type}
                                  onValueChange={(val) => {
                                    const newSteps = [...editingWorkflow.steps];
                                    newSteps[sIdx].conditions[cIdx].type = val;
                                    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AMOUNT_RANGE">Amount Range</SelectItem>
                                    <SelectItem value="LOCATION">Branch/Location</SelectItem>
                                    <SelectItem value="EXPENSE_CATEGORY">Category</SelectItem>
                                  </SelectContent>
                                </Select>

                                {cond.type === "AMOUNT_RANGE" && (
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Min"
                                      className="h-8 text-xs"
                                      value={cond.minAmount}
                                      onChange={(e) => {
                                        const newSteps = [...editingWorkflow.steps];
                                        newSteps[sIdx].conditions[cIdx].minAmount = Number(e.target.value);
                                        setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                      }}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Max"
                                      className="h-8 text-xs"
                                      value={cond.maxAmount}
                                      onChange={(e) => {
                                        const newSteps = [...editingWorkflow.steps];
                                        newSteps[sIdx].conditions[cIdx].maxAmount = Number(e.target.value);
                                        setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                      }}
                                    />
                                  </div>
                                )}

                                {cond.type === "LOCATION" && (
                                  <Select
                                    className="flex-1"
                                    value={cond.locationId}
                                    onValueChange={(val) => {
                                      const newSteps = [...editingWorkflow.steps];
                                      newSteps[sIdx].conditions[cIdx].locationId = val;
                                      setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs flex-1">
                                      <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                {cond.type === "EXPENSE_CATEGORY" && (
                                  <Select
                                    className="flex-1"
                                    value={cond.expenseCategoryId}
                                    onValueChange={(val) => {
                                      const newSteps = [...editingWorkflow.steps];
                                      newSteps[sIdx].conditions[cIdx].expenseCategoryId = val;
                                      setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs flex-1">
                                      <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-zinc-400"
                                  onClick={() => {
                                    const newSteps = [...editingWorkflow.steps];
                                    newSteps[sIdx].conditions = step.conditions.filter((_: any, i: number) => i !== cIdx);
                                    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Zap className="w-3 h-3" /> Approver Actions
                        </Label>

                        <div className="space-y-4">
                          {step.actions.map((action: any, aIdx: number) => (
                            <div key={aIdx} className="space-y-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/30">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] text-zinc-500">Approver Type</Label>
                                  <Select
                                    value={action.type}
                                    onValueChange={(val) => {
                                      const newSteps = [...editingWorkflow.steps];
                                      newSteps[sIdx].actions[aIdx].type = val;
                                      setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ROLE">By Member Role</SelectItem>
                                      <SelectItem value="SPECIFIC_MEMBER">Specific Member</SelectItem>
                                      <SelectItem value="WINDMILL_SCRIPT">Windmill Script</SelectItem>
                                      <SelectItem value="SUBMITTER_MANAGER">Submitter's Manager</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {action.type === "ROLE" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] text-zinc-500">Select Role</Label>
                                    <Select
                                      value={action.approverRole}
                                      onValueChange={(val) => {
                                        const newSteps = [...editingWorkflow.steps];
                                        newSteps[sIdx].actions[aIdx].approverRole = val;
                                        setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="OWNER">Owner</SelectItem>
                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {action.type === "WINDMILL_SCRIPT" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] text-zinc-500">Select Script</Label>
                                    <Select
                                      value={action.windmillScriptPath}
                                      onValueChange={(val) => {
                                        const newSteps = [...editingWorkflow.steps];
                                        newSteps[sIdx].actions[aIdx].windmillScriptPath = val;
                                        setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Choose script" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {windmillScripts.map(script => (
                                          <SelectItem key={script.path} value={script.path}>{script.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-500">Mode:</span>
                                    <Select
                                      value={action.approvalMode}
                                      onValueChange={(val) => {
                                        const newSteps = [...editingWorkflow.steps];
                                        newSteps[sIdx].actions[aIdx].approvalMode = val;
                                        setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-[10px] w-[90px] border-none bg-transparent hover:bg-zinc-100">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ANY_ONE">Any One</SelectItem>
                                        <SelectItem value="ALL">All Must</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Approval Workflows</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Manage custom multi-step approval sequences</p>
        </div>
        <Button onClick={handleAddWorkflow} size="sm" className="bg-[#34A853] hover:bg-[#2d9147]">
          <Plus className="w-4 h-4 mr-2" /> New Workflow
        </Button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-zinc-200 rounded-2xl">
            <div className="p-4 rounded-full bg-zinc-100 text-zinc-400 mb-4">
              <GitMerge className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900">No workflows defined</h4>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Create your first approval workflow to automate multi-step validations for expenses and purchases.
            </p>
            <Button onClick={handleAddWorkflow} variant="outline" size="sm" className="mt-6">
              Create Workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group p-5 rounded-2xl border border-zinc-200 bg-white hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#34A853]/10 text-[#34A853]">
                      <GitMerge className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{workflow.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] h-4 uppercase font-bold tracking-wider">
                          {workflow.triggerEvent?.replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] text-zinc-400">•</span>
                        <span className="text-[10px] text-zinc-400">{workflow.steps?.length || 0} Steps</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingWorkflow(workflow)}>
                        Edit Workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDelete(workflow.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-xs text-zinc-500 flex-1 leading-relaxed line-clamp-2">
                  {workflow.description || "No description provided."}
                </p>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {workflow.steps?.map((step: any, i: number) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-zinc-500">
                        {step.stepNumber}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Status</span>
                    <Switch
                      checked={workflow.isActive}
                      onCheckedChange={async (val) => {
                        await updateApprovalWorkflow(workflow.id, { ...workflow, isActive: val });
                        setWorkflows(workflows.map(w => w.id === workflow.id ? { ...w, isActive: val } : w));
                        toast.success(`Workflow ${val ? 'activated' : 'deactivated'}`);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
