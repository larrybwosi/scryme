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
import { Button } from "@repo/ui/components/ui/button";
import { Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface StockRequest {
  id: string;
  requestNumber: string;
  requestDate: Date;
  status: string;
  priority: string;
  totalEstimatedCost: number;
  toLocation: { name: string };
  requestedBy: { user: { name: string | null } };
  _count: { items: number };
}

export function StockRequestTable({ data }: { data: StockRequest[] }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
            <Clock size={12} />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
            <CheckCircle size={12} />
            Approved
          </Badge>
        );
      case "PARTIALLY_FULFILLED":
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50">
            <AlertCircle size={12} />
            Partial
          </Badge>
        );
      case "FULFILLED":
        return (
          <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
            <CheckCircle size={12} />
            Fulfilled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive" className="h-5 text-[10px]">URGENT</Badge>;
      case "HIGH":
        return <Badge className="h-5 text-[10px] bg-orange-500 hover:bg-orange-600">HIGH</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary" className="h-5 text-[10px]">MEDIUM</Badge>;
      case "LOW":
        return <Badge variant="outline" className="h-5 text-[10px]">LOW</Badge>;
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead>Request #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Est. Cost</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-32 text-center text-gray-500">
              No stock requests found.
            </TableCell>
          </TableRow>
        ) : (
          data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.requestNumber}</TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(request.requestDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{request.toLocation.name}</TableCell>
              <TableCell>{request._count.items} variants</TableCell>
              <TableCell>{getPriorityBadge(request.priority)}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-right font-medium">
                {request.totalEstimatedCost.toLocaleString()} KES
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/stocking/requests/${request.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye size={16} />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
