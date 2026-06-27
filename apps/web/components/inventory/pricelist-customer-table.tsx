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
import { MoreHorizontal, Trash2, User, Mail, Phone, Plus } from "lucide-react";
import {
  removeCustomerFromPriceList,
  assignCustomersToPriceList,
  getCustomers,
} from "../../app/actions/pricing";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Input } from "@repo/ui/components/ui/input";

interface PriceListCustomerTableProps {
  priceListId: string;
  customers: any[];
}

export function PriceListCustomerTable({
  priceListId,
  customers,
}: PriceListCustomerTableProps) {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (customerId: string) => {
    try {
      await removeCustomerFromPriceList(priceListId, customerId);
      toast.success("Customer removed from price list");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove customer");
    }
  };

  const handleOpenAdd = async () => {
    setIsAddCustomerOpen(true);
    setLoading(true);
    try {
      const allCustomers = await getCustomers();
      // Filter out customers already in the price list
      const filtered = allCustomers.filter(
        c => !customers.some(existing => existing.id === c.id),
      );
      setAvailableCustomers(filtered);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomers = async () => {
    if (selectedCustomerIds.length === 0) return;
    setLoading(true);
    try {
      await assignCustomersToPriceList(priceListId, selectedCustomerIds);
      toast.success("Customers added to price list");
      setIsAddCustomerOpen(false);
      setSelectedCustomerIds([]);
    } catch (error) {
      toast.error("Failed to add customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableCustomers.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus size={16} />
          <span>Add Customers</span>
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Customer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-gray-500">
                  No customers explicitly assigned to this price list.
                </TableCell>
              </TableRow>
            ) : (
              customers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <User size={14} />
                      </div>
                      <span className="font-medium text-sm text-gray-900">
                        {customer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {customer.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail size={12} />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone size={12} />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-600 uppercase font-medium">
                      {customer.type || "Individual"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Customers to Price List</SheetTitle>
            <SheetDescription>
              Select customers to explicitly assign to this price list.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[60vh] overflow-y-auto border rounded-md">
              <Table>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredAvailable.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-8 text-gray-500">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAvailable.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="w-[40px]">
                          <Checkbox
                            checked={selectedCustomerIds.includes(customer.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedCustomerIds(prev => [
                                  ...prev,
                                  customer.id,
                                ]);
                              } else {
                                setSelectedCustomerIds(prev =>
                                  prev.filter(id => id !== customer.id),
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {customer.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {customer.email ||
                                customer.phone ||
                                "No contact info"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomers}
                disabled={loading || selectedCustomerIds.length === 0}>
                Add {selectedCustomerIds.length} Customer
                {selectedCustomerIds.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
