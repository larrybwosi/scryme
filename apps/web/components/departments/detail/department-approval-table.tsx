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
import { Plus, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";
import { toggleApprovalChainStatus } from "../../../app/actions/department";
import { toast } from "sonner";
import { AddApprovalChainSheet } from "./add-approval-chain-sheet";

interface DepartmentApprovalTableProps {
  departmentId: string;
  chains: any[];
  members: any[];
}

export function DepartmentApprovalTable({
  departmentId,
  chains,
  members,
}: DepartmentApprovalTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (chainId: string, currentStatus: boolean) => {
    setLoading(chainId);
    const result = await toggleApprovalChainStatus(chainId, !currentStatus);
    setLoading(null);

    if (result.success) {
      toast.success(
        `Approval chain ${!currentStatus ? "enabled" : "disabled"}`,
      );
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/30">
        <div>
          <h3 className="font-bold text-[#1D1D1F]">Purchase Approval Chains</h3>
          <p className="text-xs text-gray-500">
            Configure multi-step approval workflows for this department.
          </p>
        </div>
        <AddApprovalChainSheet departmentId={departmentId} members={members}>
          <Button size="sm" className="gap-2 bg-[#1D1D1F] text-white">
            <Plus size={14} />
            <span>New Chain</span>
          </Button>
        </AddApprovalChainSheet>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chain Name</TableHead>
            <TableHead>Conditions</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No approval chains defined for this department.
              </TableCell>
            </TableRow>
          ) : (
            chains.map(chain => (
              <TableRow key={chain.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{chain.name}</span>
                    <span className="text-[10px] text-gray-500">
                      {chain.description || "No description"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {chain.minAmount && (
                      <Badge variant="secondary" className="text-[10px] w-fit">
                        Min: KES {Number(chain.minAmount).toLocaleString()}
                      </Badge>
                    )}
                    {chain.maxAmount && (
                      <Badge variant="secondary" className="text-[10px] w-fit">
                        Max: KES {Number(chain.maxAmount).toLocaleString()}
                      </Badge>
                    )}
                    {!chain.minAmount && !chain.maxAmount && (
                      <span className="text-xs text-gray-400 italic">
                        Always trigger
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {chain.steps.map((step: any, idx: number) => (
                      <React.Fragment key={step.id}>
                        <div
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold"
                          title={step.approver.user.name}>
                          {idx + 1}
                        </div>
                        {idx < chain.steps.length - 1 && (
                          <div className="w-2 h-[1px] bg-gray-300" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 h-7 ${chain.isActive ? "text-[#34A853]" : "text-gray-400"}`}
                    onClick={() => handleToggle(chain.id, chain.isActive)}
                    disabled={loading === chain.id}>
                    {chain.isActive ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                    <span className="text-[11px] font-medium">
                      {chain.isActive ? "Active" : "Disabled"}
                    </span>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
