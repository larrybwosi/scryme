"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Tag,
  Check,
  X,
  Edit2,
  Search,
  Lock,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";
import { createExpenseCategory } from "@/app/actions/finance";
import { cn } from "@repo/ui/lib/utils";

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: any[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    glCode: "",
  });

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createExpenseCategory(formData);
        setCategories([...categories, result]);
        toast.success("Category created");
        setIsAdding(false);
        setFormData({ name: "", code: "", description: "", glCode: "" });
      } catch (error) {
        toast.error("Failed to create category");
      }
    });
  };

  const filtered = categories.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            Expense Categories
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Categorize and map expenses to General Ledger
          </p>
        </div>
      </div>

      <div className="p-6 border-b border-zinc-100 flex items-center gap-4 bg-white sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search categories..."
            className="pl-9 h-10 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          size="sm"
          className="bg-[#34A853] hover:bg-[#2d9147]">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {isAdding && (
            <div className="p-6 rounded-2xl border-2 border-[#34A853] bg-[#34A853]/5 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Office Supplies"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={e =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g., OFFICE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GL Account Code</Label>
                  <Input
                    value={formData.glCode}
                    onChange={e =>
                      setFormData({ ...formData, glCode: e.target.value })
                    }
                    placeholder="e.g., 6100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief purpose..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={isPending}>
                  {isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {filtered.map(cat => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition-colors">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      {cat.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-[#34A853] font-bold">
                        {cat.code || "NO-CODE"}
                      </span>
                      <span className="text-[10px] text-zinc-300">•</span>
                      <div className="flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 font-medium">
                          GL: {cat.glCode || "Unmapped"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">
                      Approvals
                    </p>
                    <p className="text-xs font-semibold text-zinc-700">
                      {cat.requiresApproval ? "Mandatory" : "Optional"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900">
                General Ledger Integration
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                GL codes are used to automatically export financial data to your
                accounting software. Ensure these codes match your Chart of
                Accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
