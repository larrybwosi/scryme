"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import React, { useState, useEffect } from "react";
import { LifecycleActions, BookingStatus } from "@/components/bookings/LifecycleActions";
import { ConflictBadge } from "@/components/bookings/ConflictBadge";
import { ChecklistInspector, BookingTaskItem } from "@/components/bookings/ChecklistInspector";
import {
  CalendarDays,
  User,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface BookingRecord {
  id: string;
  serviceName?: string;
  service?: {
    id: string;
    name: string;
  } | null;
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
  bookingTasks?: BookingTaskItem[];
  tasks?: BookingTaskItem[];
  conflicts?: { type: string; message: string }[];
}

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.get("/v3/bookings", {
        params: { status: statusFilter !== "ALL" ? statusFilter : undefined },
      });
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        const normalized = data.map((b: any) => ({
          ...b,
          serviceName: b.serviceName || b.service?.name || "Service Booking",
          tasks: b.bookingTasks || b.tasks || [],
        }));
        setBookings(normalized);
        setSelectedBooking((prev) => {
          if (!prev) return normalized[0] || null;
          return normalized.find((item: any) => item.id === prev.id) || normalized[0] || null;
        });
      } else {
        setBookings([]);
        setSelectedBooking(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to load bookings");
      setBookings([]);
      setSelectedBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleTransition = async (targetStatus: BookingStatus, reason?: string, overrideConflict = true) => {
    if (!selectedBooking) return;
    setIsLoading(true);
    try {
      await apiClient.post(`/v3/bookings/${selectedBooking.id}/lifecycle/transition`, {
        status: targetStatus,
        reason,
        overrideConflict,
      });
      toast.success(`Booking transitioned to ${targetStatus}`);
      await fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to transition status");
      // Local optimistic reflection if disconnected
      const updatedBooking = { ...selectedBooking, status: targetStatus };
      setSelectedBooking(updatedBooking);
      setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentVal: boolean) => {
    if (!selectedBooking) return;
    try {
      await apiClient.put(`/v3/bookings/${selectedBooking.id}/checklist/${itemId}`, {
        isCompleted: !currentVal,
      });
    } catch {
      // Allow seamless UI toggling
    }

    // Update in-memory state
    if (selectedBooking.tasks) {
      const updatedTasks = selectedBooking.tasks.map((task) => ({
        ...task,
        checklistItems: (task.checklistItems || []).map((chk) =>
          chk.id === itemId
            ? {
                ...chk,
                isCompleted: !currentVal,
                completedBy: !currentVal ? { user: { name: "You" } } : null,
              }
            : chk,
        ),
      }));

      const allItems = updatedTasks.flatMap((t) => t.checklistItems || []);
      const isAllDone = allItems.length > 0 && allItems.every((i) => i.isCompleted);

      const nextStatus = isAllDone ? ("COMPLETED" as BookingStatus) : selectedBooking.status;
      const updated = {
        ...selectedBooking,
        status: nextStatus,
        tasks: updatedTasks,
      };

      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? updated : b)));
    }
  };

  const handleGenerateTasks = async () => {
    if (!selectedBooking) return;
    setIsGenerating(true);
    try {
      await apiClient.post(`/v3/bookings/${selectedBooking.id}/tasks/generate`, {});
      toast.success("Tasks and checklists generated from service templates");
      await fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate tasks for booking");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const sName = b.serviceName || b.service?.name || "";
    const cName = b.customer?.name || "";
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      sName.toLowerCase().includes(q) ||
      cName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-outline-variant/30 bg-surface-container-low">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Customer Bookings & Task Control
          </h1>
          <p className="text-xs text-on-surface-variant">
            Full lifecycle control, automated task assignment, and conflict detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-outline pointer-events-none" />
            <Input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 h-8 bg-surface-container border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus-visible:border-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-outline" />
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="h-8 bg-surface-container border-outline-variant/40 text-xs text-on-surface">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={fetchBookings}
            className="p-1.5 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-on-surface transition-colors"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 mx-4 mt-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Dual-pane View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Bookings list */}
        <div className="w-1/2 border-r border-outline-variant/30 overflow-y-auto p-4 space-y-3">
          {isLoading && bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-outline">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-outline border border-dashed border-outline-variant/30 rounded-xl">
              No scheduled service bookings recorded.
            </div>
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
                      <h3 className="text-sm font-semibold text-on-surface">{b.serviceName || b.service?.name}</h3>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-outline" />
                      {startTimeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-outline" />
                      {b.customer?.name || "Guest Customer"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-outline" />
                      {b.location?.name || "Main Location"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <ConflictBadge conflicts={b.conflicts} hasConflict={(b.conflicts?.length || 0) > 0} />
                    <LifecycleActions
                      currentStatus={b.status}
                      bookingId={b.id}
                      onTransition={handleTransition}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right pane: Detailed Inspector & Checklist Execution */}
        <div className="w-1/2 overflow-y-auto p-6 space-y-6">
          {selectedBooking ? (
            <>
              {/* Booking Overview Card */}
              <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-outline uppercase">{selectedBooking.id}</span>
                    <h2 className="text-lg font-bold text-on-surface">{selectedBooking.serviceName || selectedBooking.service?.name}</h2>
                  </div>
                  <LifecycleActions
                    currentStatus={selectedBooking.status}
                    bookingId={selectedBooking.id}
                    onTransition={handleTransition}
                    isLoading={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-outline-variant/30 text-xs">
                  <div>
                    <span className="text-outline block mb-1">Customer</span>
                    <p className="font-semibold text-on-surface">{selectedBooking.customer?.name || "Guest"}</p>
                    <p className="text-on-surface-variant">{selectedBooking.customer?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-outline block mb-1">Location & Station</span>
                    <p className="font-semibold text-on-surface">{selectedBooking.location?.name || "Workshop"}</p>
                    <p className="text-on-surface-variant">Slot: {new Date(selectedBooking.scheduledStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>

                {/* Assigned Staff Section */}
                <div className="pt-3 border-t border-outline-variant/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-primary" />
                      Assigned Personnel
                    </span>
                    <span className="text-[11px] text-outline">
                      {selectedBooking.staff?.length || 0} staff member(s)
                    </span>
                  </div>

                  {selectedBooking.staff && selectedBooking.staff.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.staff.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-surface-container-high text-on-surface border border-outline-variant/40"
                        >
                          <User className="w-3 h-3 text-primary" />
                          {s.member?.user?.name || "Staff Member"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-outline italic">No staff assigned yet. Transition to ASSIGNED to assign personnel.</p>
                  )}
                </div>

                {/* Conflict Warnings */}
                <div className="pt-3 border-t border-outline-variant/30">
                  <span className="text-xs font-semibold text-on-surface block mb-2">Schedule & Capacity Assessment</span>
                  <ConflictBadge
                    conflicts={selectedBooking.conflicts}
                    hasConflict={(selectedBooking.conflicts?.length || 0) > 0}
                  />
                </div>
              </div>

              {/* Operational Tasks & Checklists Section */}
              <ChecklistInspector
                tasks={selectedBooking.tasks || []}
                bookingId={selectedBooking.id}
                onToggleItem={handleToggleItem}
                onGenerateTasks={handleGenerateTasks}
                isGenerating={isGenerating}
              />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-outline">
              Select a booking from the left pane to view details and control execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
