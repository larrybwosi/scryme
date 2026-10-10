"use client";

import React, { useRef, useState, useEffect } from "react";
import { MapPin, HelpCircle, Navigation, ExternalLink, Map as MapIcon, Globe } from "lucide-react";

// Coordinate bounds of our mock city canvas (Times Square area)
const MIN_LAT = 40.7;
const MAX_LAT = 40.8;
const MIN_LNG = -74.05;
const MAX_LNG = -73.9;

interface LocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onPinChange?: (coords: { latitude: number; longitude: number }) => void;
  editable?: boolean;
}

export function LocationMap({
  latitude,
  longitude,
  onPinChange,
  editable = false,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [pinPos, setPinPos] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"google" | "vector">("google");

  const hasCoords =
    latitude !== undefined &&
    latitude !== null &&
    longitude !== undefined &&
    longitude !== null;

  // Convert Latitude / Longitude to SVG % coordinate (0-100)
  const coordsToPos = (lat: number, lng: number) => {
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  // Convert SVG % coordinate (0-100) back to Latitude / Longitude
  const posToCoords = (x: number, y: number) => {
    const lat = MAX_LAT - (y / 100) * (MAX_LAT - MIN_LAT);
    const lng = MIN_LNG + (x / 100) * (MAX_LNG - MIN_LNG);
    return {
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
    };
  };

  // Keep pin position updated whenever props change
  useEffect(() => {
    if (hasCoords) {
      setPinPos(coordsToPos(latitude!, longitude!));
    } else {
      setPinPos(null);
    }
  }, [latitude, longitude, hasCoords]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || !onPinChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    const newCoords = posToCoords(xPercent, yPercent);
    onPinChange(newCoords);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Mode Switcher Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Branch Location
        </span>
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode("google")}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-medium transition-all ${
              viewMode === "google"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            <Globe size={12} className="text-blue-500" />
            Google Maps
          </button>
          <button
            type="button"
            onClick={() => setViewMode("vector")}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-medium transition-all ${
              viewMode === "vector"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            <MapIcon size={12} className="text-emerald-600" />
            Pin Grid
          </button>
        </div>
      </div>

      {/* Map Canvas Box */}
      <div className="relative w-full h-55 rounded-xl border bg-slate-100 overflow-hidden select-none transition-all">
        {viewMode === "google" ? (
          hasCoords ? (
            <iframe
              title="Branch Location Google Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-white p-4 text-center">
              <HelpCircle
                size={32}
                className="text-slate-200 animate-pulse mb-2"
              />
              <p className="text-[13px] font-semibold">No Coordinates Set</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Switch to "Pin Grid" or enter coordinates to display on Google Maps.
              </p>
            </div>
          )
        ) : (
          /* Vector Pin Map */
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className={`relative w-full h-full bg-sky-100 ${
              editable
                ? "cursor-crosshair hover:ring-2 hover:ring-blue-400"
                : "cursor-default"
            }`}>
            {/* SVG city graphic */}
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 400 220">
              <path
                d="M 0,180 Q 150,150 250,220 L 0,220 Z"
                fill="#BAE6FD"
                className="opacity-90"
              />
              <path
                d="M 320,0 Q 340,100 400,120 L 400,0 Z"
                fill="#BAE6FD"
                className="opacity-90"
              />
              <rect x="180" y="20" width="70" height="90" rx="4" fill="#DCFCE7" />
              <circle cx="50" cy="50" r="25" fill="#DCFCE7" />
              <path d="M 330,150 Q 360,140 380,180 L 350,190 Z" fill="#DCFCE7" />
              <line x1="120" y1="0" x2="150" y2="220" stroke="#FFFFFF" strokeWidth="10" />
              <line x1="120" y1="0" x2="150" y2="220" stroke="#FED7AA" strokeWidth="6" />
              <line x1="0" y1="120" x2="400" y2="100" stroke="#FFFFFF" strokeWidth="8" />
              <line x1="0" y1="120" x2="400" y2="100" stroke="#FED7AA" strokeWidth="4" />
              <line x1="60" y1="0" x2="60" y2="220" stroke="#F3F4F6" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="220" y1="0" x2="220" y2="220" stroke="#F3F4F6" strokeWidth="3" />
              <line x1="280" y1="0" x2="280" y2="220" stroke="#F3F4F6" strokeWidth="3" />
              <line x1="340" y1="0" x2="340" y2="220" stroke="#F3F4F6" strokeWidth="3" />
              <line x1="0" y1="40" x2="400" y2="40" stroke="#F3F4F6" strokeWidth="3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="#F3F4F6" strokeWidth="3" />
              <line x1="0" y1="160" x2="400" y2="160" stroke="#F3F4F6" strokeWidth="3" />
              <text x="195" y="65" fill="#15803D" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                Central Park
              </text>
              <text x="25" y="115" fill="#4B5563" fontSize="6" fontWeight="semibold" fontFamily="sans-serif">
                Downtown District
              </text>
              <text x="245" y="155" fill="#4B5563" fontSize="6" fontWeight="semibold" fontFamily="sans-serif">
                Eastside Port
              </text>
              <text x="280" y="200" fill="#0369A1" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                Grand Bay
              </text>
            </svg>

            <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

            {pinPos && (
              <div
                className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-red-500/20 animate-ping pointer-events-none"
                style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
              />
            )}

            {pinPos ? (
              <div
                className="absolute transition-all duration-300 ease-out"
                style={{
                  left: `${pinPos.x}%`,
                  top: `${pinPos.y}%`,
                  transform: "translate(-50%, -100%)",
                }}>
                <div className="relative flex flex-col items-center">
                  <div className="bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
                    <Navigation size={8} className="text-red-400 rotate-45" />
                    <span>Pinned Location</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white animate-bounce">
                    <MapPin size={16} />
                  </div>
                  <div className="w-2 h-2 bg-red-600 rounded-full border border-white -mt-1 shadow" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-white p-4 text-center">
                <HelpCircle
                  size={32}
                  className="text-slate-200 animate-pulse mb-2"
                />
                <p className="text-[13px] font-semibold">No Pinned Location</p>
                {editable ? (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Click anywhere on the map grid to pin this branch.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Physical location coordinates not yet configured.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coordinate Info Panel */}
      {hasCoords && (
        <div className="flex items-center justify-between rounded-lg bg-card border p-2.5 shadow-2xs text-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Exact Coordinates:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-foreground bg-muted px-2 py-0.5 rounded border border-border flex gap-2 text-[11px]">
              <span>
                Lat: <strong className="text-blue-600 font-semibold">{latitude?.toFixed(4)}</strong>
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span>
                Lng: <strong className="text-blue-600 font-semibold">{longitude?.toFixed(4)}</strong>
              </span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline ml-1"
              title="Open in Google Maps">
              <span>View</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
