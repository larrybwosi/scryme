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
import { format } from "date-fns";
import Link from "next/link";
import { User, Truck, Phone, Mail, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { deleteDriver } from "../../app/actions/drivers";
import { toast } from "sonner";

interface Driver {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  availability: string;
  createdAt: Date;
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  } | null;
  deliveryPartner: {
    id: string;
    name: string;
  } | null;
  _count: {
    fulfillments: number;
  };
}

export function DriverTable({ data }: { data: Driver[] }) {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      const result = await deleteDriver(id);
      if (result.success) {
        toast.success("Driver deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete driver");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[250px]">Driver</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Partner</TableHead>
            <TableHead>Deliveries</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-10 text-gray-500">
                No drivers found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(driver => (
              <TableRow
                key={driver.id}
                className="group hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <User size={18} />
                    </div>
                    <Link
                      href={`/staff/drivers/${driver.id}`}
                      className="flex flex-col hover:opacity-70 transition-opacity">
                      <span className="font-semibold text-sm text-[#1D1D1F]">
                        {driver.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Joined {format(new Date(driver.createdAt), "MMM yyyy")}
                      </span>
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone size={12} className="text-gray-400" />
                      {driver.phone}
                    </div>
                    {driver.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Mail size={12} />
                        {driver.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      driver.availability === "ONLINE"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : driver.availability === "ON_DELIVERY"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }>
                    {driver.availability.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {driver.vehicle ? (
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {driver.vehicle.licensePlate}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {driver.vehicle.make} {driver.vehicle.model}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.deliveryPartner ? (
                    <Badge variant="secondary" className="font-normal text-[11px]">
                      {driver.deliveryPartner.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">In-house</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {driver._count.fulfillments}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/staff/drivers/${driver.id}`} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => handleDelete(driver.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Driver
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
  );
}
