"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "../../../components/page-header";
import { getStockTransferList } from "../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, ArrowLeftRight, Search, Eye, FileDown } from "lucide-react";
import Link from "next/link";
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
import { Input } from "@repo/ui/components/ui/input";
import { useDebounce } from "use-debounce";

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getStockTransferList({ search: debouncedSearch });
        setTransfers(data);
      } catch (error) {
        console.error("Failed to fetch stock transfers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [debouncedSearch]);

  const downloadPdf = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    window.open(
      `/api/stocking/documents/transfers?${params.toString()}`,
      "_blank",
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200">
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Approved
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 border-amber-200">
            Shipped
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200">
            In Transit
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stock Transfers"
          description="Manage and track stock movements between locations."
          icon={<ArrowLeftRight size={24} />}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={downloadPdf}>
            <FileDown size={18} />
            Download PDF
          </Button>
          <Link href="/stocking/transfers/new">
            <Button className="gap-2">
              <Plus size={16} />
              <span>New Transfer</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              type="text"
              placeholder="Search transfers..."
              className="pl-10 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer #</TableHead>
              <TableHead>From Location</TableHead>
              <TableHead>To Location</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500">
                  No stock transfers found.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map(transfer => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {transfer.transferNumber}
                  </TableCell>
                  <TableCell>{transfer.fromLocation.name}</TableCell>
                  <TableCell>{transfer.toLocation.name}</TableCell>
                  <TableCell>
                    {format(new Date(transfer.requestedDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{transfer.requestedBy.user.name}</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/stocking/transfers/${transfer.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye size={16} />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
