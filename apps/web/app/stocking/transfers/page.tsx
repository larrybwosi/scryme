import React from "react";
import { PageHeader } from "../../../components/page-header";
import {
  getStockTransferList,
  getStockTransferStats,
} from "../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  ArrowLeftRight,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle2,
} from "lucide-react";
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
import { Card, CardContent } from "@repo/ui/components/ui/card";

export default async function TransfersPage() {
  const [transfers, stats] = await Promise.all([
    getStockTransferList(),
    getStockTransferStats(),
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            Approved
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Shipped
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            In Transit
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200"
          >
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
        <Link href="/stocking/transfers/new">
          <Button className="gap-2 shadow-sm">
            <Plus size={16} />
            <span>New Transfer</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">In Transit</p>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
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
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={14} />
            <span>Filter</span>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-bold py-4">Transfer #</TableHead>
              <TableHead className="font-bold py-4">Route</TableHead>
              <TableHead className="font-bold py-4">Items</TableHead>
              <TableHead className="font-bold py-4">Requested Date</TableHead>
              <TableHead className="font-bold py-4">Requested By</TableHead>
              <TableHead className="font-bold py-4">Status</TableHead>
              <TableHead className="text-right font-bold py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <ArrowLeftRight size={40} className="opacity-20 mb-2" />
                    <p className="text-lg font-medium">No stock transfers found</p>
                    <p className="text-sm">Initiate your first transfer to track stock movements.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((transfer) => (
                <TableRow key={transfer.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-bold text-blue-600">
                    {transfer.transferNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{transfer.fromLocation.name}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className="font-medium">{transfer.toLocation.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {transfer._count.items} {transfer._count.items === 1 ? 'item' : 'items'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {format(new Date(transfer.requestedDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {transfer.requestedBy.user.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{transfer.requestedBy.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/stocking/transfers/${transfer.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye size={14} />
                        <span>View Details</span>
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
