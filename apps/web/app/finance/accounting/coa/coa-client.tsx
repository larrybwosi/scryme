"use client";

import { useState, useEffect } from "react";
import { Plus, Download, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { getLedgerAccounts, initializeCOA } from "../../../actions/accounting";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";

export function COAClient() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const data = await getLedgerAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleInitialize() {
    try {
      await initializeCOA();
      toast.success("Chart of Accounts initialized");
      loadAccounts();
    } catch (error) {
      toast.error("Failed to initialize accounts");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chart of Accounts</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitialize}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize Standard
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sub-Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No accounts found. Initialize the standard Chart of Accounts to get started.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.type}</Badge>
                    </TableCell>
                    <TableCell>{account.subType.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {account.isActive ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
