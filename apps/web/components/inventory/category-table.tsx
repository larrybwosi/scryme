"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { deleteCategory } from "../../app/actions/inventory";
import { toast } from "sonner";
import { CategoryDialog } from "./category-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";

interface CategoryTableProps {
  data: any[];
}

export function CategoryTable({ data }: CategoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Products Count</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No categories found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            data.map((category) => (
              <React.Fragment key={category.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-6 flex items-center justify-center">
                        {category.subcategories?.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpand(category.id)}
                          >
                            {expandedIds.has(category.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: category.color || "#000" }}
                      >
                        <Tag size={14} />
                      </div>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[300px] truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {category._count?.products || 0} products
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Category</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeletingId(category.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Category</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedIds.has(category.id) &&
                  category.subcategories?.map((sub: any) => (
                    <TableRow key={sub.id} className="bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3 pl-12">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: sub.color || "#666" }}
                          >
                            <Tag size={10} />
                          </div>
                          <span className="text-sm">{sub.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 max-w-[300px] truncate italic">
                        {sub.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {sub._count?.products || 0} products
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCategory(sub)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeletingId(sub.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Category</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <CategoryDialog
        category={editingCategory}
        isOpen={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
