"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";

interface OrganizationProfileHeaderProps {
  logo?: string | null;
  banner?: string | null;
  onLogoChange: (url: string) => void;
  onBannerChange: (url: string) => void;
  disabled?: boolean;
}

export function OrganizationProfileHeader({
  logo,
  banner,
  onLogoChange,
  onBannerChange,
  disabled,
}: OrganizationProfileHeaderProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  console.log("logo", logo, "banner", banner);

  const handleUpload = async (file: File, type: "logo" | "banner") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (type === "logo") setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const resData = await response.json();
      const url = resData.data?.url || resData.url;

      if (type === "logo") onLogoChange(url);
      else onBannerChange(url);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
      console.error(error);
    } finally {
      if (type === "logo") setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
    }
  };

  return (
    <div className="relative w-full mb-20">
      {/* Banner */}
      <div
        className={cn(
          "relative h-48 w-full rounded-xl overflow-hidden border bg-zinc-100 group transition-all",
          !banner && "border-dashed border-2",
        )}>
        {banner ? (
          <Image
            src={banner}
            alt="Organization Banner"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <UploadCloud className="w-8 h-8 mb-2" />
            <p className="text-sm">Click to upload banner</p>
          </div>
        )}

        <button
          type="button"
          disabled={disabled || isUploadingBanner}
          onClick={() => bannerInputRef.current?.click()}
          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          {isUploadingBanner ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Change Banner</span>
            </div>
          )}
        </button>
        <input
          type="file"
          ref={bannerInputRef}
          className="hidden"
          accept="image/*"
          onChange={e =>
            e.target.files?.[0] && handleUpload(e.target.files[0], "banner")
          }
        />
      </div>

      {/* Logo Overlay */}
      <div className="absolute -bottom-16 left-8">
        <div className="relative group">
          <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-4 border-white bg-zinc-50 shadow-lg">
            {logo ? (
              <Image
                src={logo}
                alt="Organization Logo"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-300">
                <UploadCloud className="w-8 h-8" />
              </div>
            )}

            <button
              type="button"
              disabled={disabled || isUploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              {isUploadingLogo ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </button>
          </div>
          <input
            type="file"
            ref={logoInputRef}
            className="hidden"
            accept="image/*"
            onChange={e =>
              e.target.files?.[0] && handleUpload(e.target.files[0], "logo")
            }
          />
        </div>
      </div>
    </div>
  );
}
