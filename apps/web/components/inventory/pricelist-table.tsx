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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Tag,
  Calendar,
} from "lucide-react";
import { deletePriceList } from "../../app/actions/pricing";
import { toast } from "sonner";
import { PriceListDialog } from "./pricelist-dialog";
import Link from "next/link";
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

interface PriceListTableProps {
  data: any[];
  availableTags: string[];
}

export function PriceListTable({ data, availableTags }: PriceListTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPriceList, setEditingPriceList] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deletePriceList(id);
      toast.success("Price list deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete price list");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (priceList: any) => {
    const now = new Date();
    const from = priceList.validFrom ? new Date(priceList.validFrom) : null;
    const to = priceList.validTo ? new Date(priceList.validTo) : null;

    if (!priceList.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (from && now < from) return <Badge variant="secondary">Scheduled</Badge>;
    if (to && now > to) return <Badge variant="outline">Expired</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>;
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead>Price List</TableHead>
            <TableHead>Targeting</TableHead>
            <TableHead>Validity</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                No price lists found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            data.map(priceList => (
              <TableRow key={priceList.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {priceList.name}
                      </span>
                      {priceList.isGlobal && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">
                          <Globe size={10} className="mr-1" />
                          Global
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {priceList.code} • {priceList.currency}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {priceList.isGlobal ? (
                      <span className="text-xs text-gray-400 italic">All Customers</span>
                    ) : priceList.customerTags?.length > 0 ? (
                      priceList.customerTags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-600 border-none">
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Explicit assignment only</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="shrink-0" />
                      <span>{priceList.validFrom ? new Date(priceList.validFrom).toLocaleDateString() : "Always"}</span>
                    </div>
                    {priceList.validTo && (
                      <span className="pl-4 text-[10px]">until {new Date(priceList.validTo).toLocaleDateString()}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {priceList._count?.items || 0} items
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(priceList)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/inventory/pricelists/${priceList.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingPriceList(priceList)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Configuration</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeletingId(priceList.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
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

      <PriceListDialog
        priceList={editingPriceList}
        isOpen={!!editingPriceList}
        onOpenChange={open => !open && setEditingPriceList(null)}
        availableTags={availableTags}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Price List?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the price list and all associated prices and rules.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingId && handleDelete(deletingId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
