"use client";

import { ActivityLogItem } from "@/app/actions/activity";
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
import {
  LogIn,
  ShoppingCart,
  Receipt,
  Globe,
  Activity,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Laptop,
} from "lucide-react";

interface ActivityTableProps {
  logs: ActivityLogItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function ActivityTable({
  logs,
  pagination,
  onPageChange,
}: ActivityTableProps) {
  const renderTypeBadge = (type: ActivityLogItem["type"]) => {
    switch (type) {
      case "LOGIN":
        return (
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-normal text-blue-600 bg-blue-500/10 border-blue-200"
          >
            <LogIn className="size-3" aria-hidden="true" />
            User Login
          </Badge>
        );
      case "POS_SALE":
        return (
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-normal text-emerald-600 bg-emerald-500/10 border-emerald-200"
          >
            <ShoppingCart className="size-3" aria-hidden="true" />
            POS Sale
          </Badge>
        );
      case "SALES_ORDER":
        return (
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-normal text-amber-600 bg-amber-500/10 border-amber-200"
          >
            <Receipt className="size-3" aria-hidden="true" />
            Sales Order
          </Badge>
        );
      case "ONLINE_ORDER":
        return (
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-normal text-purple-600 bg-purple-500/10 border-purple-200"
          >
            <Globe className="size-3" aria-hidden="true" />
            Online Order
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Activity className="size-3" aria-hidden="true" />
            Transaction
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Event & Title</TableHead>
              <TableHead>User / Member</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">IP / Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No activity logs found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{renderTypeBadge(log.type)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-xs">
                        {log.title}
                      </span>
                      {log.channel && (
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">
                          Channel: {log.channel.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {log.userName || "Unknown"}
                      </span>
                      {log.userEmail && (
                        <span className="text-[11px] text-muted-foreground">
                          {log.userEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {log.organizationName || "Global Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {log.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      {log.ipAddress ? (
                        <span className="font-mono text-[11px] text-foreground">
                          {log.ipAddress}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          —
                        </span>
                      )}
                      {log.userAgent && (
                        <span
                          className="text-[10px] text-muted-foreground max-w-[140px] truncate"
                          title={log.userAgent}
                        >
                          {log.userAgent.includes("Mobile")
                            ? "Mobile Device"
                            : "Desktop Browser"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-muted-foreground">
          Showing page {pagination.page} of {pagination.totalPages} (
          {pagination.totalItems.toLocaleString()} total items)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
