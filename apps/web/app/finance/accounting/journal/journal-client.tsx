"use client";

import { useState, useEffect } from "react";
import { getJournalEntries } from "../../../actions/accounting";
import { Card, CardContent } from "@repo/ui/components/ui/card";
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

export function JournalClient() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await getJournalEntries({});
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Journal Entries</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No journal entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map(entry =>
                  entry.lines.map((line: any, index: number) => (
                    <TableRow key={`${entry.id}-${line.id}`}>
                      {index === 0 && (
                        <>
                          <TableCell
                            rowSpan={entry.lines.length}
                            className="align-top font-medium">
                            {format(new Date(entry.entryDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell
                            rowSpan={entry.lines.length}
                            className="align-top font-mono text-xs">
                            {entry.reference || "-"}
                            <div className="text-[10px] text-muted-foreground">
                              {entry.sourceType}
                            </div>
                          </TableCell>
                          <TableCell
                            rowSpan={entry.lines.length}
                            className="align-top">
                            {entry.description}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="font-medium text-sm">
                          {line.ledgerAccount.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {line.ledgerAccount.code}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(line.debit) > 0
                          ? line.debit.toLocaleString()
                          : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(line.credit) > 0
                          ? line.credit.toLocaleString()
                          : ""}
                      </TableCell>
                    </TableRow>
                  )),
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
