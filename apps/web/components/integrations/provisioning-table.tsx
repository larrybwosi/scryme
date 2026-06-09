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
import {
  MoreHorizontal,
  Trash2,
  Download,
  Copy,
  Terminal,
  Monitor,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

interface ProvisioningToken {
  tokenId: string;
  deviceName: string;
  deviceType: string;
  locationId: string;
  locationName: string;
  environment: string;
  status: "pending" | "used" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  rawToken?: string;
}

interface ProvisioningTableProps {
  data: ProvisioningToken[];
  onDelete: (ids: string[]) => Promise<void>;
}

export function ProvisioningTable({ data, onDelete }: ProvisioningTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((t) => t.tokenId));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDownload = (token: ProvisioningToken) => {
    if (!token.rawToken) {
      toast.error("Raw token not available for download");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([token.rawToken], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `provisioning-token-${token.deviceName}.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success("Token downloaded");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/20">
            Pending
          </Badge>
        );
      case "used":
        return (
          <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
            Used
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-status-error/10 text-status-error border-status-error/20">
            Expired
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {selectedIds.length} tokens selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(selectedIds);
              setSelectedIds([]);
            }}
            className="gap-2"
          >
            <Trash2 size={14} />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-12 bg-gray-50/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === data.length && data.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Device Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Environment</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Expiry</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No setup tokens found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((token) => (
                <TableRow key={token.tokenId} className="h-16">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(token.tokenId)}
                      onCheckedChange={() => toggleSelect(token.tokenId)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Monitor size={16} className="text-gray-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{token.deviceName}</span>
                        <span className="text-[10px] text-muted-foreground">Created by {token.createdBy}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{token.deviceType.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs">{token.locationName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {token.environment}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(token.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(token.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {token.rawToken && (
                          <>
                            <DropdownMenuItem onClick={() => copyToClipboard(token.rawToken!)}>
                              <Copy size={14} className="mr-2" />
                              Copy Token
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(token)}>
                              <Download size={14} className="mr-2" />
                              Download (.txt)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                copyToClipboard(
                                  `curl -X POST "${process.env.NEXT_PUBLIC_API_URL}/v2/devices/provision" -H "Content-Type: application/json" -d '{"setupToken":"${token.rawToken}"}'`
                                )
                              }
                            >
                              <Terminal size={14} className="mr-2" />
                              Copy cURL
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete([token.tokenId])}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
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
    </div>
  );
}
