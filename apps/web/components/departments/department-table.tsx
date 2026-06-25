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
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Button } from "@repo/ui/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { EditDepartmentSheet } from "./edit-department-sheet";
import { DeleteDepartmentDialog } from "./delete-department-dialog";
import Image from "next/image";

interface DepartmentTableProps {
  data: any[];
}

export function DepartmentTable({ data }: DepartmentTableProps) {
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deletingDept, setDeletingDept] = useState<any>(null);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[300px]">Department Name</TableHead>
            <TableHead>Head of Department</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                No departments found. Create your first department to get started.
              </TableCell>
            </TableRow>
          ) : (
            data.map((dept) => (
              <TableRow key={dept.id} className="group hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border relative shrink-0">
                      {dept.image ? (
                        <Image
                          src={dept.image}
                          alt={dept.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Users className="text-gray-400" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">{dept.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {dept.description || "No description"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {dept.head ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border">
                        <AvatarImage src={dept.head.user.image} />
                        <AvatarFallback className="text-[10px]">
                          {dept.head.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{dept.head.user.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not Assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none font-medium">
                    {dept._count.departmentMembers} Members
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(dept.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>More actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/staff/departments/${dept.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Eye size={14} />
                          <span>View Details</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setEditingDept(dept)}
                      >
                        <Edit size={14} />
                        <span>Edit Dept</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600 cursor-pointer"
                        onClick={() => setDeletingDept(dept)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editingDept && (
        <EditDepartmentSheet
          department={editingDept}
          open={!!editingDept}
          onOpenChange={(open) => !open && setEditingDept(null)}
        >
          <span className="hidden" />
        </EditDepartmentSheet>
      )}

      {deletingDept && (
        <DeleteDepartmentDialog
          departmentId={deletingDept.id}
          departmentName={deletingDept.name}
          open={!!deletingDept}
          onOpenChange={(open) => !open && setDeletingDept(null)}
        />
      )}
    </div>
  );
}
