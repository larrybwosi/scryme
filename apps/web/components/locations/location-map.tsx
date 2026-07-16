"use client";

import React, { useRef, useState, useEffect } from "react";
import { MapPin, HelpCircle, Navigation } from "lucide-react";

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

  // Convert Latitude / Longitude to SVG % coordinate (0-100)
  const coordsToPos = (lat: number, lng: number) => {
    // lat of MAX_LAT maps to y = 0%, MIN_LAT maps to y = 100%
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;
    // lng of MIN_LNG maps to x = 0%, MAX_LNG maps to x = 100%
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
    // Round to 4 decimal places for clean storage
    return {
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
    };
  };

  // Keep pin position updated whenever props change
  useEffect(() => {
    if (
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null
    ) {
      setPinPos(coordsToPos(latitude, longitude));
    } else {
      setPinPos(null);
    }
  }, [latitude, longitude]);

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
      {/* Map Canvas */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className={`relative w-full h-55 rounded-xl border bg-sky-100 overflow-hidden select-none transition-all ${
          editable
            ? "cursor-crosshair border-dashed hover:border-blue-400"
            : "cursor-default border-solid"
        }`}>
        {/* Beautiful vector city map design using SVGs */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 400 220">
          {/* Waterbody / River */}
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

          {/* Central Park / Greenery Areas */}
          <rect x="180" y="20" width="70" height="90" rx="4" fill="#DCFCE7" />
          <circle cx="50" cy="50" r="25" fill="#DCFCE7" />
          <path d="M 330,150 Q 360,140 380,180 L 350,190 Z" fill="#DCFCE7" />

          {/* Major Roads / Highways Grid */}
          {/* Vertical highway */}
          <line
            x1="120"
            y1="0"
            x2="150"
            y2="220"
            stroke="#FFFFFF"
            strokeWidth="10"
          />
          <line
            x1="120"
            y1="0"
            x2="150"
            y2="220"
            stroke="#FED7AA"
            strokeWidth="6"
          />

          {/* Horizontal highway */}
          <line
            x1="0"
            y1="120"
            x2="400"
            y2="100"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <line
            x1="0"
            y1="120"
            x2="400"
            y2="100"
            stroke="#FED7AA"
            strokeWidth="4"
          />

          {/* Minor Grid Streets */}
          {/* Vertical streets */}
          <line
            x1="60"
            y1="0"
            x2="60"
            y2="220"
            stroke="#F3F4F6"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <line
            x1="220"
            y1="0"
            x2="220"
            y2="220"
            stroke="#F3F4F6"
            strokeWidth="3"
          />
          <line
            x1="280"
            y1="0"
            x2="280"
            y2="220"
            stroke="#F3F4F6"
            strokeWidth="3"
          />
          <line
            x1="340"
            y1="0"
            x2="340"
            y2="220"
            stroke="#F3F4F6"
            strokeWidth="3"
          />

          {/* Horizontal streets */}
          <line
            x1="0"
            y1="40"
            x2="400"
            y2="40"
            stroke="#F3F4F6"
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="80"
            x2="400"
            y2="80"
            stroke="#F3F4F6"
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="160"
            x2="400"
            y2="160"
            stroke="#F3F4F6"
            strokeWidth="3"
          />

          {/* Pinned Landmarks / Neighborhood Labels */}
          <text
            x="195"
            y="65"
            fill="#15803D"
            fontSize="7"
            fontWeight="bold"
            fontFamily="sans-serif">
            Central Park
          </text>
          <text
            x="25"
            y="115"
            fill="#4B5563"
            fontSize="6"
            fontWeight="semibold"
            fontFamily="sans-serif">
            Downtown District
          </text>
          <text
            x="245"
            y="155"
            fill="#4B5563"
            fontSize="6"
            fontWeight="semibold"
            fontFamily="sans-serif">
            Eastside Port
          </text>
          <text
            x="280"
            y="200"
            fill="#0369A1"
            fontSize="7"
            fontWeight="bold"
            fontFamily="sans-serif">
            Grand Bay
          </text>
        </svg>

        {/* Map Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

        {/* Animated radar rings if pinned */}
        {pinPos && (
          <div
            className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-red-500/20 animate-ping pointer-events-none"
            style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
          />
        )}

        {/* The Location Pin */}
        {pinPos ? (
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${pinPos.x}%`,
              top: `${pinPos.y}%`,
              transform: "translate(-50%, -100%)",
            }}>
            <div className="relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
                <Navigation size={8} className="text-red-400 rotate-45" />
                <span>Pinned Location</span>
              </div>
              {/* Pin Icon */}
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

      {/* Coordinate Info Panel */}
      {pinPos && (
        <div className="flex items-center justify-between rounded-lg bg-white border p-2.5 shadow-sm text-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium text-slate-700">Coordinates:</span>
          </div>
          <div className="font-mono text-slate-900 bg-slate-50 px-2 py-0.5 rounded border flex gap-3">
            <span>
              Lat:{" "}
              <strong className="text-blue-600 font-semibold">
                {latitude?.toFixed(4)}
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Lng:{" "}
              <strong className="text-blue-600 font-semibold">
                {longitude?.toFixed(4)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
