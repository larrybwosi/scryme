"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Camera, Scan, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
  title?: string;
  placeholder?: string;
}

export function BarcodeScannerDialog({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode / QR Code",
  placeholder = "e.g., SN-10023, BATCH-991, 0123456789",
}: BarcodeScannerDialogProps) {
  const [manualInput, setManualInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a"],
        });

        const scanFrame = async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                if (rawVal) {
                  toast.success(`Scanned: ${rawVal}`);
                  onScan(rawVal);
                  stopCamera();
                  onClose();
                  return;
                }
              }
            } catch (err) {
              console.error("Frame detection error:", err);
            }
          }
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        };
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraError(err.message || "Failed to access camera");
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualInput("");
      setCameraError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length > 1 && e.key !== "Enter") return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (timeDiff > 50 && e.key !== "Enter") {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          onScan(buffer);
          toast.success(`Scanner captured: ${buffer}`);
          onClose();
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onScan, onClose]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onScan(manualInput.trim());
    toast.success(`Applied code: ${manualInput.trim()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex flex-col items-center justify-center border border-dashed border-border">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-primary rounded-md shadow-lg" />
                </div>
              </>
            ) : (
              <div className="text-center p-4 space-y-2">
                <Camera className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {cameraError ? (
                    <span className="text-destructive flex items-center gap-1 justify-center">
                      <AlertCircle className="w-4 h-4" /> {cameraError}
                    </span>
                  ) : (
                    "Use camera to scan physical QR or barcodes directly."
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Camera Scanner
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <Label htmlFor="scanner-input" className="text-xs font-semibold uppercase text-muted-foreground">
              Hardware Scanner / Manual Input
            </Label>
            <div className="flex gap-2">
              <Input
                id="scanner-input"
                autoFocus
                placeholder={placeholder}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <Button type="submit" disabled={!manualInput.trim()}>
                Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Hardware USB/Bluetooth barcode readers auto-submit when scanned.
            </p>
          </form>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {isCameraActive ? (
            <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
              Stop Camera
            </Button>
          ) : <div />}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
