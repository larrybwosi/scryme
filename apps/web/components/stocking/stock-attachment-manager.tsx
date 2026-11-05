"use client";

import React, { useState, useRef } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Paperclip, UploadCloud, X, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadFileAction } from "../../app/actions/sales";

export interface StockAttachment {
  id: string;
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string;
  sizeBytes?: number | null;
}

interface StockAttachmentManagerProps {
  attachments: StockAttachment[];
  onChange: (attachments: StockAttachment[]) => void;
  readOnly?: boolean;
  label?: string;
}

export function StockAttachmentManager({
  attachments,
  onChange,
  readOnly = false,
  label = "Documents & Proof Attachments",
}: StockAttachmentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: StockAttachment[] = [...attachments];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadFileAction(formData);
        if (result?.id) {
          newAttachments.push({
            id: result.id,
            fileName: result.fileName || file.name,
            fileUrl: result.fileUrl,
            mimeType: result.mimeType || file.type,
            sizeBytes: result.sizeBytes || file.size,
          });
        }
      }
      onChange(newAttachments);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          {label} ({attachments.length})
        </label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,application/pdf,.csv,.xlsx,.doc,.docx"
        className="hidden"
      />

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40 text-sm group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {att.mimeType?.startsWith("image/") ? (
                  <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <a
                  href={att.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium truncate hover:underline text-foreground"
                  title={att.fileName || "Attachment"}
                >
                  {att.fileName || "Attachment"}
                </a>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground border border-dashed rounded-md p-3 text-center bg-muted/20">
          No attachments added yet. Delivery notes, waybills, or inspection photos can be uploaded here.
        </div>
      )}
    </div>
  );
}
