"use client";

import React, { useState, useEffect } from "react";
import { LifecycleActions, BookingStatus } from "@/components/bookings/LifecycleActions";
import { ConflictBadge } from "@/components/bookings/ConflictBadge";
import { ChecklistInspector, BookingTaskItem } from "@/components/bookings/ChecklistInspector";

interface BookingRecord {
  id: string;
  serviceName: string;
  status: BookingStatus;
  scheduledStartTime: string;
  scheduledEndTime?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
  staff?: {
    member?: {
      id: string;
      user?: {
        name?: string | null;
      } | null;
    } | null;
  }[];
  tasks?: BookingTaskItem[];
}

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    // Initial dummy data / mock state for robust UI preview and testing
    const sampleBookings: BookingRecord[] = [
      {
        id: "bkg-101",
        serviceName: "Full Vehicle Detail & Ceramic Coat",
        status: "CONFIRMED",
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString(),
        scheduledEndTime: new Date(Date.now() + 10800000).toISOString(),
        customer: {
          name: "John Miller",
          email: "john@example.com",
          phoneNumber: "+254712345678",
        },
        location: {
          id: "loc-1",
          name: "Main Workshop - Bay 2",
        },
        staff: [
          { member: { id: "mem-1", user: { name: "David Kim" } } },
        ],
        tasks: [
          {
            id: "task-1",
            title: "Pre-Service Vehicle Inspection",
            status: "IN_PROGRESS",
            stage: "PRE_SERVICE",
            assignedTo: { user: { name: "David Kim" } },
            checklistItems: [
              {
                id: "chk-1",
                title: "Inspect vehicle exterior for preexisting dents & scratches",
                stage: "PRE_SERVICE",
                isRequired: true,
                isCompleted: true,
                completedBy: { user: { name: "David Kim" } },
              },
              {
                id: "chk-2",
                title: "Measure paint thickness with gauge",
                stage: "PRE_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
            ],
          },
          {
            id: "task-2",
            title: "Decontamination & Ceramic Application",
            status: "TODO",
            stage: "IN_SERVICE",
            assignedTo: { user: { name: "David Kim" } },
            checklistItems: [
              {
                id: "chk-3",
                title: "Apply iron remover & clay bar treatment",
                stage: "IN_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
              {
                id: "chk-4",
                title: "Apply 2 coats of ceramic protection",
                stage: "IN_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
            ],
          },
          {
            id: "task-3",
            title: "Curing & Final Handover Inspection",
            status: "TODO",
            stage: "POST_SERVICE",
            assignedTo: { user: { name: "David Kim" } },
            checklistItems: [
              {
                id: "chk-5",
                title: "IR lamp cure for 30 minutes",
                stage: "POST_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
              {
                id: "chk-6",
                title: "Final walkaround inspection with customer",
                stage: "POST_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
            ],
          },
        ],
      },
      {
        id: "bkg-102",
        serviceName: "VIP Beard Sculpt & Hair Treatment",
        status: "PENDING",
        scheduledStartTime: new Date(Date.now() + 7200000).toISOString(),
        scheduledEndTime: new Date(Date.now() + 10800000).toISOString(),
        customer: {
          name: "Marcus Vance",
          email: "marcus@example.com",
          phoneNumber: "+254798765432",
        },
        location: {
          id: "loc-2",
          name: "Executive Lounge - Station 4",
        },
        staff: [
          { member: { id: "mem-2", user: { name: "Sarah Jenkins" } } },
        ],
        tasks: [],
      },
    ];

    setBookings(sampleBookings);
    setSelectedBooking(sampleBookings[0]);
  }, []);

  const handleTransition = async (targetStatus: BookingStatus, reason?: string) => {
    if (!selectedBooking) return;
    setIsLoading(true);
    try {
      // In production calls POST /v3/bookings/:id/lifecycle/transition
      const updated = {
        ...selectedBooking,
        status: targetStatus,
      };

      // Automatically mock generating tasks if confirmed
      if (targetStatus === "CONFIRMED" && (!selectedBooking.tasks || selectedBooking.tasks.length === 0)) {
        updated.tasks = [
          {
            id: `task-${Date.now()}`,
            title: `Pre-Service Setup: ${selectedBooking.serviceName}`,
            status: "TODO",
            stage: "PRE_SERVICE",
            assignedTo: selectedBooking.staff?.[0]?.member || null,
            checklistItems: [
              {
                id: `chk-${Date.now()}-1`,
                title: "Sanitize tools and verify workstation readiness",
                stage: "PRE_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
              {
                id: `chk-${Date.now()}-2`,
                title: "Confirm appointment preferences with customer",
                stage: "PRE_SERVICE",
                isRequired: true,
                isCompleted: false,
              },
            ],
          },
        ];
      }

      setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? updated : b)));
      setSelectedBooking(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecklist = async (itemId: string, currentVal: boolean) => {
    if (!selectedBooking) return;

    const updatedTasks = (selectedBooking.tasks || []).map((task) => ({
      ...task,
      checklistItems: task.checklistItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isCompleted: !currentVal,
              completedAt: !currentVal ? new Date().toISOString() : null,
              completedBy: !currentVal ? { user: { name: "Current User" } } : null,
            }
          : item,
      ),
    }));

    const updatedBooking = {
      ...selectedBooking,
      tasks: updatedTasks,
    };

    setSelectedBooking(updatedBooking);
    setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));
  };

  const handleGenerateTasks = async () => {
    if (!selectedBooking) return;
    setIsLoading(true);
    try {
      const generatedTasks: BookingTaskItem[] = [
        {
          id: `task-${Date.now()}-pre`,
          title: `Pre-Service: ${selectedBooking.serviceName}`,
          status: "TODO",
          stage: "PRE_SERVICE",
          assignedTo: selectedBooking.staff?.[0]?.member || null,
          checklistItems: [
            {
              id: `chk-1-${Date.now()}`,
              title: "Sanitize tools & check workstation",
              stage: "PRE_SERVICE",
              isRequired: true,
              isCompleted: false,
            },
          ],
        },
        {
          id: `task-${Date.now()}-in`,
          title: `Execution: ${selectedBooking.serviceName}`,
          status: "TODO",
          stage: "IN_SERVICE",
          assignedTo: selectedBooking.staff?.[0]?.member || null,
          checklistItems: [
            {
              id: `chk-2-${Date.now()}`,
              title: "Perform main service protocol",
              stage: "IN_SERVICE",
              isRequired: true,
              isCompleted: false,
            },
          ],
        },
        {
          id: `task-${Date.now()}-post`,
          title: `Post-Service: ${selectedBooking.serviceName}`,
          status: "TODO",
          stage: "POST_SERVICE",
          assignedTo: selectedBooking.staff?.[0]?.member || null,
          checklistItems: [
            {
              id: `chk-3-${Date.now()}`,
              title: "Post-service client satisfaction & cleanup",
              stage: "POST_SERVICE",
              isRequired: true,
              isCompleted: false,
            },
          ],
        },
      ];

      const updated = { ...selectedBooking, tasks: generatedTasks };
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? updated : b)));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesSearch =
      b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event_available</span>
            Customer Bookings & Task Control
          </h1>
          <p className="text-xs text-on-surface-variant">
            Full lifecycle control, automated task assignment, and conflict detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Dual-pane View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Bookings list */}
        <div className="w-1/2 border-r border-outline-variant/30 overflow-y-auto p-4 space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-outline">No bookings found.</div>
          ) : (
            filteredBookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id;
              const startTimeStr = new Date(b.scheduledStartTime).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface-container border-primary shadow-md"
                      : "bg-surface-container-low border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-outline uppercase font-mono">{b.id}</span>
                      <h3 className="text-sm font-semibold text-on-surface">{b.serviceName}</h3>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium">{startTimeStr}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {b.customer?.name || "Guest Customer"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {b.location?.name || "Main Location"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <ConflictBadge />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                      {b.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right pane: Selected booking inspector */}
        <div className="w-1/2 overflow-y-auto p-6 space-y-6">
          {selectedBooking ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-outline font-mono uppercase">{selectedBooking.id}</span>
                    <h2 className="text-lg font-bold text-on-surface">{selectedBooking.serviceName}</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Client: {selectedBooking.customer?.name || "Guest"} ({selectedBooking.customer?.phoneNumber || "No phone"})
                    </p>
                  </div>
                  <ConflictBadge />
                </div>

                <div className="pt-2 border-t border-outline-variant/20">
                  <LifecycleActions
                    currentStatus={selectedBooking.status}
                    bookingId={selectedBooking.id}
                    onTransition={handleTransition}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {/* Tasks and Checklist Inspector */}
              <ChecklistInspector
                tasks={selectedBooking.tasks || []}
                bookingId={selectedBooking.id}
                onToggleItem={handleToggleChecklist}
                onGenerateTasks={handleGenerateTasks}
                isGenerating={isLoading}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-outline">
              Select a booking from the list to inspect details, manage lifecycle, and track checklists.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
