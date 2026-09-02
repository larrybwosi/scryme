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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="font-bold text-foreground">Department Memberships</h3>
        <span className="text-xs text-muted-foreground">{memberships.length} active memberships</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">Department</TableHead>
            <TableHead className="text-muted-foreground">Role</TableHead>
            <TableHead className="text-muted-foreground">Permissions</TableHead>
            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                This member is not assigned to any departments.
              </TableCell>
            </TableRow>
          ) : (
            memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Building2 size={16} />
                    </div>
                    <span className="font-medium text-sm text-foreground">{membership.department.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-muted text-foreground">
                    {membership.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {membership.canApproveExpenses && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                        <ShieldCheck size={10} />
                        Expense Approver
                      </Badge>
                    )}
                    {membership.canManageBudget && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10">
                        <CreditCard size={10} />
                        Budget Manager
                      </Badge>
                    )}
                    {!membership.canApproveExpenses && !membership.canManageBudget && (
                      <span className="text-xs text-muted-foreground">Standard Access</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/staff/departments/${membership.departmentId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                      View Department
                    </Button>
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
