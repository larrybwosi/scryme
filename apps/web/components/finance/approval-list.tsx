'use client';

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
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { makeApprovalDecision } from "../../app/actions/approvals";
import { useTransition } from "react";
import { toast } from "sonner";

interface ApprovalListProps {
  requests: any[];
}

export function ApprovalList({ requests }: ApprovalListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDecision = (requestId: string, status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      try {
        await makeApprovalDecision({ requestId, status });
        toast.success(`Request ${status.toLowerCase()} successfully`);
      } catch (error) {
        toast.error("Failed to process decision");
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requested Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No pending approval requests
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{request.requestType}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {request.relatedRecordNumber}
                </TableCell>
                <TableCell>{request.requester.user.name}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: request.currency || "USD",
                  }).format(Number(request.amount))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status.toLowerCase()}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {request.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDecision(request.id, "REJECTED")}
                        disabled={isPending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleDecision(request.id, "APPROVED")}
                        disabled={isPending}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
