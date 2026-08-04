"use client";

import React from "react";
import { format } from "date-fns";
import { ShieldCheck, FileText, FileEdit, Plus, Copy, ExternalLink, Download, Paperclip, Loader2 } from "lucide-react";
import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

interface DocumentsTabProps {
  transaction: any;
  publicLinkType: "invoice" | "receipt";
  setPublicLinkType: (type: "invoice" | "receipt") => void;
  publicLinkExpiry: string;
  setPublicLinkExpiry: (expiry: string) => void;
  isLoadingPublicLink: boolean;
  onCreatePublicLink: () => Promise<void>;
  onCopyLink: (url: string) => void;
  getCleanUrl: (url: string | null | undefined) => string;
}

export function DocumentsTab({
  transaction,
  publicLinkType,
  setPublicLinkType,
  publicLinkExpiry,
  setPublicLinkExpiry,
  isLoadingPublicLink,
  onCreatePublicLink,
  onCopyLink,
  getCleanUrl,
}: DocumentsTabProps) {
  return (
    <div className="space-y-6 rounded-none">
      <Card className="p-6 shadow-sm dark:shadow-none border-border bg-card rounded-none space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Share a document link
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Create a secure public link to this order&apos;s invoice or receipt
          so you can send it directly to the customer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
              Document
            </label>
            <Select
              value={publicLinkType}
              onValueChange={v => setPublicLinkType(v as "invoice" | "receipt")}
            >
              <SelectTrigger className="w-full text-xs bg-background border-border text-foreground rounded-none h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
              Expires
            </label>
            <Select
              value={publicLinkExpiry}
              onValueChange={setPublicLinkExpiry}
            >
              <SelectTrigger className="w-full text-xs bg-background border-border text-foreground rounded-none h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="1">In 1 day</SelectItem>
                <SelectItem value="7">In 7 days</SelectItem>
                <SelectItem value="30">In 30 days</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-none shadow-sm"
          onClick={onCreatePublicLink}
          disabled={isLoadingPublicLink}
        >
          {isLoadingPublicLink ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Creating link...
            </>
          ) : (
            "Create link"
          )}
        </Button>
      </Card>

      {transaction.attachments && transaction.attachments.length > 0 ? (
        (() => {
          const sortedAttachments = [...transaction.attachments].sort(
            (a, b) =>
              new Date(b.uploadedAt).getTime() -
              new Date(a.uploadedAt).getTime(),
          );

          const groups = sortedAttachments.reduce(
            (acc: any, att: any) => {
              const desc = att.description?.toLowerCase() || "";
              let group = "Other files";
              if (desc.includes("public")) group = "Shared links";
              else if (desc.includes("invoice")) group = "Invoices";
              else if (desc.includes("receipt")) group = "Receipts";
              else if (
                desc.includes("proof") ||
                desc.includes("delivery")
              )
                group = "Delivery proof";

              if (!acc[group]) acc[group] = [];
              acc[group].push(att);
              return acc;
            },
            {},
          );

          const order = [
            "Shared links",
            "Invoices",
            "Receipts",
            "Delivery proof",
            "Other files",
          ];

          return (
            <div className="space-y-4 rounded-none">
              {order.map(groupName => {
                const docs = groups[groupName];
                if (!docs) return null;

                return (
                  <Card
                    key={groupName}
                    className="overflow-hidden border-border bg-card rounded-none shadow-sm dark:shadow-none"
                  >
                    <div className="px-4 py-3 bg-muted border-b border-border">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {groupName} ({docs.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {docs.map((att: any) => {
                        const isPublicLink = groupName === "Shared links";
                        return (
                          <div
                            key={att.id}
                            className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-none flex items-center justify-center border",
                                  isPublicLink
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    : "bg-muted border-border text-muted-foreground/80",
                                )}
                              >
                                {att.mimeType === "application/pdf" ? (
                                  <FileText
                                    className={cn(
                                      "w-4 h-4",
                                      isPublicLink
                                        ? "text-emerald-500"
                                        : "text-red-500",
                                    )}
                                  />
                                ) : (
                                  <Paperclip className="w-4 h-4" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-1.5 leading-none">
                                  {isPublicLink ? (
                                    <>
                                      {att.description}
                                      {att.expiresAt ? (
                                        new Date(att.expiresAt) < new Date() ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] text-red-600 border-red-200 bg-red-50/50 py-0 px-1 rounded-none font-bold uppercase"
                                          >
                                            Expired
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] text-emerald-600 border-emerald-200 bg-emerald-50/50 py-0 px-1 rounded-none font-bold uppercase"
                                          >
                                            Active • Exp.{" "}
                                            {format(
                                              new Date(att.expiresAt),
                                              "MMM d",
                                            )}
                                          </Badge>
                                        )
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] text-blue-600 border-blue-200 bg-blue-50/50 py-0 px-1 rounded-none font-bold uppercase"
                                        >
                                          Never expires
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    att.fileName
                                  )}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[250px] block">
                                    {isPublicLink
                                      ? getCleanUrl(att.shortUrl || att.fileUrl)
                                      : att.description || "No description"}
                                  </span>
                                  {!isPublicLink && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                      <span className="text-[10px] text-muted-foreground">
                                        {format(
                                          new Date(att.uploadedAt),
                                          "MMM d, yyyy",
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                              {isPublicLink && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                  onClick={() =>
                                    onCopyLink(
                                      getCleanUrl(att.shortUrl || att.fileUrl!),
                                    )
                                  }
                                  aria-label="Copy document link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                asChild
                                aria-label="Open document in new tab"
                              >
                                <a
                                  href={getCleanUrl(att.shortUrl || att.fileUrl!)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                              {!isPublicLink && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                  asChild
                                  aria-label="Download document file"
                                >
                                  <a
                                    href={getCleanUrl(att.shortUrl || att.fileUrl!)}
                                    download={att.fileName!}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()
      ) : (
        <Card className="p-12 text-center space-y-2 border-dashed border-border rounded-none bg-muted/10">
          <div className="w-12 h-12 rounded-none bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground/50 mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            No documents yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Invoices and receipts will show up here once generated.
          </p>
        </Card>
      )}
    </div>
  );
}
