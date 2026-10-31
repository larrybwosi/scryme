"use client";

import Link from "next/link";
import React, { useState } from "react";

interface SquadMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  assignedHours: number;
  totalCapacity: number;
  allocations: {
    project: string;
    task: string;
    hours: number;
    color: string;
  }[];
}

const MEMBERS: SquadMember[] = [
  {
    id: "m1",
    name: "Elena Rostova",
    role: "Lead Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    assignedHours: 42,
    totalCapacity: 40,
    allocations: [
      { project: "Nexus 2.0", task: "SCR-104 Telemetry Canvas", hours: 26, color: "bg-primary-container" },
      { project: "Nexus 2.0", task: "Code Reviews & Specs", hours: 16, color: "bg-secondary-container" },
    ],
  },
  {
    id: "m2",
    name: "Marcus Vance",
    role: "Senior Graphics & WebGL",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    assignedHours: 38,
    totalCapacity: 40,
    allocations: [
      { project: "Nexus 2.0", task: "SCR-102 WebGL Pipeline", hours: 30, color: "bg-primary-container" },
      { project: "Core Engine", task: "Infra Benchmark", hours: 8, color: "bg-surface-container-highest" },
    ],
  },
  {
    id: "m3",
    name: "Sarah Chen",
    role: "Security & IAM Architect",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    assignedHours: 40,
    totalCapacity: 40,
    allocations: [
      { project: "Enterprise SSO", task: "SCR-105 SAML Provider", hours: 32, color: "bg-primary-container" },
      { project: "Enterprise SSO", task: "SCIM Provisioning", hours: 8, color: "bg-secondary-container" },
    ],
  },
  {
    id: "m4",
    name: "David Kim",
    role: "Distributed Systems Lead",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    assignedHours: 34,
    totalCapacity: 40,
    allocations: [
      { project: "Core Engine", task: "Turborepo & Docker Cache", hours: 22, color: "bg-primary-container" },
      { project: "Core Engine", task: "PostgreSQL Pooling", hours: 12, color: "bg-secondary-container" },
    ],
  },
];

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<"all" | "core" | "security">("all");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [members, setMembers] = useState<SquadMember[]>(MEMBERS);
  const [bookingMemberId, setBookingMemberId] = useState("m1");
  const [bookingHours, setBookingHours] = useState("4");
  const [bookingTask, setBookingTask] = useState("");

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(bookingHours) || 2;

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === bookingMemberId) {
          return {
            ...m,
            assignedHours: m.assignedHours + hours,
            allocations: [
              ...m.allocations,
              {
                project: "Ad-hoc Booking",
                task: bookingTask || "Sprint Consultation",
                hours,
                color: "bg-amber-500/30 text-amber-300",
              },
            ],
          };
        }
        return m;
      })
    );

    setIsBookModalOpen(false);
    setBookingTask("");
  };

  const totalAssigned = members.reduce((acc, m) => acc + m.assignedHours, 0);
  const totalCapacity = members.reduce((acc, m) => acc + m.totalCapacity, 0);
  const clusterPercentage = Math.round((totalAssigned / totalCapacity) * 100);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Action & Capacity Overview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
                <span className="font-headline-sm text-body-md text-on-surface font-medium">
                  {weekOffset === 0 ? "Week of Oct 21 – Oct 27, 2024" : `Offset: ${weekOffset > 0 ? "+" : ""}${weekOffset} Weeks`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="px-2 py-0.5 ml-1 text-label-badge font-label-badge bg-surface-container-high text-on-surface rounded"
              >
                Current
              </button>
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
              <button
                type="button"
                onClick={() => setSelectedGroup("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-label-code ${
                  selectedGroup === "all" ? "bg-surface-container-high text-on-surface font-medium" : "text-outline"
                }`}
              >
                All Squads (4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup("core")}
                className={`px-2 py-0.5 rounded text-[11px] font-label-code ${
                  selectedGroup === "core" ? "bg-surface-container-high text-on-surface font-medium" : "text-outline"
                }`}
              >
                Core Eng (3)
              </button>
            </div>
          </div>

          {/* Right: Capacity Metric & Booking Action */}
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <div className="flex flex-col text-right">
                <span className="font-headline-sm text-body-sm text-on-surface font-semibold tracking-tight">
                  {totalAssigned}h / {totalCapacity}h
                </span>
                <span className="font-body-sm text-[10px] text-outline">Cluster Allocation</span>
              </div>
              <span
                className={`font-label-badge text-label-badge px-1.5 py-0.5 rounded ${
                  clusterPercentage > 100
                    ? "bg-red-500/20 text-red-400"
                    : clusterPercentage > 85
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-primary-container/20 text-primary"
                }`}
              >
                {clusterPercentage}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Book Capacity</span>
            </button>
          </div>
        </div>

        {/* Modal: Book Capacity */}
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Book Squad Capacity</h3>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleBooking} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Squad Member</label>
                  <select
                    value={bookingMemberId}
                    onChange={(e) => setBookingMemberId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Hours to Reserve</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="40"
                    value={bookingHours}
                    onChange={(e) => setBookingHours(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Task / Objective</label>
                  <input
                    type="text"
                    placeholder="e.g. Memory profiling session"
                    value={bookingTask}
                    onChange={(e) => setBookingTask(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                  >
                    Reserve Hours
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Capacity Deck */}
        <div className="flex flex-col gap-3">
          {members.map((member) => {
            const usagePercent = Math.round((member.assignedHours / member.totalCapacity) * 100);
            return (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 shadow-xs hover:border-outline-variant transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
                    />
                    <div>
                      <div className="font-headline-sm text-body-md text-on-surface font-semibold">{member.name}</div>
                      <div className="text-[11px] text-outline">{member.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1 font-label-code">
                      <span className="text-body-md font-semibold text-on-surface">{member.assignedHours}h</span>
                      <span className="text-[11px] text-outline">/ {member.totalCapacity}h</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-label-code ${
                        usagePercent > 100
                          ? "bg-red-500/20 text-red-400"
                          : usagePercent > 90
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      {usagePercent}%
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                  {member.allocations.map((alloc, idx) => {
                    const widthPct = (alloc.hours / member.totalCapacity) * 100;
                    return (
                      <div
                        key={idx}
                        className={`h-full ${alloc.color} border-r border-surface-container-low last:border-0`}
                        style={{ width: `${Math.min(widthPct, 100)}%` }}
                        title={`${alloc.task}: ${alloc.hours}h`}
                      ></div>
                    );
                  })}
                </div>

                {/* Allocation Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {member.allocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-[11px] text-on-surface-variant"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span className="text-outline font-label-code">{alloc.project}:</span>
                      <span>{alloc.task}</span>
                      <span className="font-label-code text-outline">({alloc.hours}h)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
