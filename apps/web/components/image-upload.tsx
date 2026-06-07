"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 3,
  disabled
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const filesArray = Array.from(files).filter(file => file.type.startsWith("image/"));

    if (value.length + filesArray.length > maxImages) {
      toast.error(`Maximum of ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesArray.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const resData = await response.json();
        // Handle standard API response wrapping if present
        return resData.data?.url || resData.url;
      });

      const urls = await Promise.all(uploadPromises);
      onChange([...value, ...urls]);
      toast.success(`${urls.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload image(s)");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }, [value, maxImages, onChange]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
    },
    [disabled, isUploading, uploadFiles]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled || isUploading) return;

      const items = e.clipboardData.items;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        uploadFiles(files);
      }
    },
    [disabled, isUploading, uploadFiles]
  );

  const removeImage = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-3 gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative aspect-square rounded-md overflow-hidden border bg-gray-100 group"
          >
            <Image
              src={url}
              alt="Product"
              fill
              className="object-cover"
            />
            <button
              onClick={() => removeImage(url)}
              type="button"
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < maxImages && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={onPaste}
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            className={cn(
              "aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#34A853] focus:ring-offset-2",
              isUploading && "opacity-50 cursor-not-allowed",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-[10px] text-gray-500 text-center px-2">
                  Drop, paste or click
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={onFileSelect}
        disabled={disabled || isUploading}
      />
      <p className="text-[11px] text-gray-500">
        Upload up to {maxImages} images. Drag and drop or paste directly into the box.
      </p>
    </div>
  );
}
