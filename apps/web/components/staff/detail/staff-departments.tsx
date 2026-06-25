"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Building2, ShieldCheck, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/ui/button";

interface StaffDepartmentsProps {
  memberships: any[];
}

export function StaffDepartments({ memberships }: StaffDepartmentsProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50/30 flex items-center justify-between">
        <h3 className="font-bold text-[#1D1D1F]">Department Memberships</h3>
        <span className="text-xs text-gray-500">{memberships.length} active memberships</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                This member is not assigned to any departments.
              </TableCell>
            </TableRow>
          ) : (
            memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <Building2 size={16} />
                    </div>
                    <span className="font-medium text-sm">{membership.department.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{membership.role}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {membership.canApproveExpenses && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200 bg-green-50">
                        <ShieldCheck size={10} />
                        Expense Approver
                      </Badge>
                    )}
                    {membership.canManageBudget && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-blue-600 border-blue-200 bg-blue-50">
                        <CreditCard size={10} />
                        Budget Manager
                      </Badge>
                    )}
                    {!membership.canApproveExpenses && !membership.canManageBudget && (
                      <span className="text-xs text-gray-400">Standard Access</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/staff/departments/${membership.departmentId}`}>
                    <Button variant="ghost" size="sm" className="text-xs">View Department</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
