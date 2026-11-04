"use client";

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
import { MoreHorizontal, Repeat, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { approveExpenseAction, rejectExpenseAction } from "../../app/actions/finance";
import { toast } from "sonner";
import { Check, X, Coins } from "lucide-react";

interface ExpenseTableProps {
  expenses: any[];
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "PENDING":
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cost Center</TableHead>
            <TableHead>Utility Account</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map(expense => (
              <TableRow key={expense.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {expense.recurringExpenseId && (
                      <Repeat className="h-3 w-3 text-blue-500" />
                    )}
                    {expense.expenseNumber}
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{expense.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category.name}</Badge>
                </TableCell>
                <TableCell>
                  {expense.costCenter ? (
                    <Badge variant="secondary">{expense.costCenter.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground/60 italic text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {expense.pettyCashFund && (
                    <Badge variant="outline" className="mr-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1">
                      <Coins className="w-3 h-3" />
                      Petty Cash
                    </Badge>
                  )}
                  {expense.utilityAccount ? (
                    <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {expense.utilityAccount.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/60 text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {expense.location?.name || (
                    <span className="text-muted-foreground/60 italic text-xs">Global</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: expense.currencyCode || "USD",
                  }).format(Number(expense.amount))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(expense.status)}>
                    {expense.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      {expense.receiptUrl && <DropdownMenuItem>Download Receipt</DropdownMenuItem>}
                      {(expense.status === "PENDING" || expense.status === "PENDING_APPROVAL") && (
                        <>
                          <DropdownMenuItem
                            className="text-emerald-600 dark:text-emerald-400 font-medium"
                            onClick={async () => {
                              try {
                                await approveExpenseAction(expense.id);
                                toast.success("Expense approved");
                              } catch (e: any) {
                                toast.error(e.message || "Failed to approve expense");
                              }
                            }}>
                            <Check className="w-4 h-4 mr-2" />
                            Approve Expense
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 dark:text-rose-400 font-medium"
                            onClick={async () => {
                              try {
                                await rejectExpenseAction(expense.id);
                                toast.success("Expense rejected");
                              } catch (e: any) {
                                toast.error(e.message || "Failed to reject expense");
                              }
                            }}>
                            <X className="w-4 h-4 mr-2" />
                            Reject Expense
                          </DropdownMenuItem>
                        </>
                      )}
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
