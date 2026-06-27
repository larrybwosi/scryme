"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Trash2, CheckCircle2, History } from "lucide-react";
import { format } from "date-fns";
import { updateDepartmentActiveBudget } from "../../../app/actions/department";
import { toast } from "sonner";
import { AddBudgetSheet } from "./add-budget-sheet";

interface DepartmentBudgetTableProps {
  departmentId: string;
  activeBudgetId: string | null;
  budgets: any[];
}

export function DepartmentBudgetTable({
  departmentId,
  activeBudgetId,
  budgets,
}: DepartmentBudgetTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSetActive = async (budgetId: string) => {
    setLoading(budgetId);
    const result = await updateDepartmentActiveBudget(departmentId, budgetId);
    setLoading(null);

    if (result.success) {
      toast.success("Active budget updated");
    } else {
      toast.error(result.error || "Failed to update active budget");
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/30">
        <div>
          <h3 className="font-bold text-[#1D1D1F]">Department Budgets</h3>
          <p className="text-xs text-gray-500">
            Track and manage department spending allocations.
          </p>
        </div>
        <AddBudgetSheet departmentId={departmentId}>
          <Button size="sm" className="gap-2 bg-[#1D1D1F] text-white">
            <Plus size={14} />
            <span>New Budget</span>
          </Button>
        </AddBudgetSheet>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Budget Name</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No budgets defined for this department.
              </TableCell>
            </TableRow>
          ) : (
            budgets.map(budget => {
              const isActive = budget.id === activeBudgetId;
              const isExpired = new Date(budget.periodEnd) < new Date();

              return (
                <TableRow
                  key={budget.id}
                  className={isActive ? "bg-green-50/30" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{budget.name}</span>
                      <span className="text-[10px] text-gray-500 line-clamp-1">
                        {budget.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>
                        {format(new Date(budget.periodStart), "MMM dd, yyyy")}
                      </span>
                      <span className="text-gray-400">to</span>
                      <span>
                        {format(new Date(budget.periodEnd), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">
                      KES {Number(budget.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      <Badge className="bg-[#34A853] text-white border-none gap-1">
                        <CheckCircle2 size={10} />
                        Active
                      </Badge>
                    ) : isExpired ? (
                      <Badge
                        variant="secondary"
                        className="text-gray-500 gap-1">
                        <History size={10} />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline">Planned</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isActive && !isExpired && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSetActive(budget.id)}
                        disabled={loading === budget.id}>
                        Set Active
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
