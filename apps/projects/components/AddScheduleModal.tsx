"use client";

import React, { useState } from "react";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import {
  CalendarDays,
  Clock,
  Briefcase,
  Users,
  X,
} from "lucide-react";
import {
  useCreateStaffShift,
  useCreateTask,
} from "@/lib/hooks/use-projects";
import {
  OrganizationMember,
  Project,
  StaffShiftItem,
} from "@/lib/api";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export type ScheduleModalType = "shift" | "booking" | "service";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: OrganizationMember[];
  projects: Project[];
  existingShifts?: StaffShiftItem[];
  defaultType?: ScheduleModalType;
  onSuccess?: () => void;
}

export function AddScheduleModal({
  isOpen,
  onClose,
  members,
  projects,
  existingShifts = [],
  defaultType = "shift",
  onSuccess,
}: AddScheduleModalProps) {
  const [modalType, setModalType] = useState<ScheduleModalType>(defaultType);

  // Shift Form State
  const [shiftMemberId, setShiftMemberId] = useState<string>("");
  const [shiftDayOfWeek, setShiftDayOfWeek] = useState<number>(1);
  const [shiftStartTime, setShiftStartTime] = useState<string>("09:00");
  const [shiftEndTime, setShiftEndTime] = useState<string>("17:00");

  // Capacity Reservation Form State
  const [bookProjectId, setBookProjectId] = useState<string>("");
  const [bookMemberId, setBookMemberId] = useState<string>("");
  const [bookHours, setBookHours] = useState<string>("4");
  const [bookTaskTitle, setBookTaskTitle] = useState<string>("");
  const [bookDueDate, setBookDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  // Scheduled Service Booking State
  const [serviceCustomerName, setServiceCustomerName] = useState<string>("");
  const [serviceCustomerPhone, setServiceCustomerPhone] = useState<string>("");
  const [serviceCustomerEmail, setServiceCustomerEmail] = useState<string>("");
  const [serviceMemberId, setServiceMemberId] = useState<string>("");
  const [serviceDate, setServiceDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [serviceStartTime, setServiceStartTime] = useState<string>("10:00");
  const [serviceNotes, setServiceNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createShiftMutation = useCreateStaffShift();
  const createTaskMutation = useCreateTask();

  if (!isOpen) return null;

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = shiftMemberId || members[0]?.id;
    if (!targetMember) {
      toast.error("Please select a squad member");
      return;
    }

    const [h1, m1] = shiftStartTime.split(":").map(Number);
    const [h2, m2] = shiftEndTime.split(":").map(Number);
    const newStart = h1 * 60 + m1;
    const newEnd = h2 * 60 + m2;

    if (newEnd <= newStart) {
      toast.error("Shift end time must be later than start time");
      return;
    }

    const hasConflict = existingShifts.some((s) => {
      if (!s.isActive) return false;
      if (s.memberId === targetMember && s.dayOfWeek === shiftDayOfWeek) {
        const [s1, sm1] = s.startTime.split(":").map(Number);
        const [s2, sm2] = s.endTime.split(":").map(Number);
        return Math.max(newStart, s1 * 60 + sm1) < Math.min(newEnd, s2 * 60 + sm2);
      }
      return false;
    });

    if (hasConflict) {
      const proceed = window.confirm(
        "Warning: This shift overlaps with an existing shift for this member on that day. Save anyway?"
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      await createShiftMutation.mutateAsync({
        memberId: targetMember,
        dayOfWeek: shiftDayOfWeek,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        isActive: true,
      });

      toast.success("Staff shift scheduled successfully");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to schedule shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCapacityBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = bookProjectId || projects[0]?.id;
    const targetMember = bookMemberId || members[0]?.id;

    if (!targetProject) {
      toast.error("Please select a project");
      return;
    }
    if (!bookTaskTitle.trim()) {
      toast.error("Please specify a task or booking objective");
      return;
    }

    setIsSubmitting(true);
    try {
      const hours = parseFloat(bookHours) || 4;
      await createTaskMutation.mutateAsync({
        projectId: targetProject,
        title: bookTaskTitle.trim(),
        assignees: targetMember ? [{ memberId: targetMember, isPrimary: true, allocatedHours: hours }] : undefined,
        estimatedHours: hours,
        dueDate: bookDueDate ? new Date(bookDueDate).toISOString() : undefined,
        status: "TODO",
        priority: "MEDIUM",
      });

      toast.success("Capacity hours reserved and task scheduled");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reserve capacity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveServiceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = serviceMemberId || members[0]?.id;

    if (!targetMember) {
      toast.error("Please select an assigned staff member");
      return;
    }

    const startDateTime = new Date(`${serviceDate}T${serviceStartTime}:00`);

    setIsSubmitting(true);
    try {
      await apiClient.post("/v3/scheduling/bookings", {
        memberId: targetMember,
        serviceId: "srv-standard",
        scheduledStartTime: startDateTime.toISOString(),
        customerName: serviceCustomerName.trim() || undefined,
        customerPhone: serviceCustomerPhone.trim() || undefined,
        customerEmail: serviceCustomerEmail.trim() || undefined,
        notes: serviceNotes.trim() || undefined,
      });

      toast.success("Service appointment scheduled");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to schedule service appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface-container border border-outline-variant/50 p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-surface-container-high text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Add to Schedule
              </h2>
              <p className="text-xs text-outline">
                Configure shifts, reserve squad hours, or schedule client service bookings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Schedule Type Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setModalType("shift")}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              modalType === "shift"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Staff Shift</span>
          </button>
          <button
            type="button"
            onClick={() => setModalType("booking")}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              modalType === "booking"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Book Capacity</span>
          </button>
          <button
            type="button"
            onClick={() => setModalType("service")}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              modalType === "service"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Service Booking</span>
          </button>
        </div>

        {/* Tab 1: Staff Shift Form */}
        {modalType === "shift" && (
          <form onSubmit={handleSaveShift} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Squad Member</label>
              <Select
                value={shiftMemberId || (members[0]?.id || "")}
                onValueChange={(val) => setShiftMemberId(val)}
              >
                <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Day of Week</label>
              <Select
                value={shiftDayOfWeek.toString()}
                onValueChange={(val) => setShiftDayOfWeek(parseInt(val, 10))}
              >
                <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                  <SelectValue placeholder="Select Day" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Start Time</label>
                <Input
                  type="time"
                  required
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">End Time</label>
                <Input
                  type="time"
                  required
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createShiftMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
              >
                {isSubmitting || createShiftMutation.isPending ? "Scheduling..." : "Schedule Shift"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Capacity Reservation Form */}
        {modalType === "booking" && (
          <form onSubmit={handleSaveCapacityBooking} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Project</label>
              <Select
                value={bookProjectId || (projects[0]?.id || "")}
                onValueChange={(val) => setBookProjectId(val)}
              >
                <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Squad Member</label>
              <Select
                value={bookMemberId || (members[0]?.id || "")}
                onValueChange={(val) => setBookMemberId(val)}
              >
                <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Hours to Reserve</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="40"
                  value={bookHours}
                  onChange={(e) => setBookHours(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Due / Target Date</label>
                <Input
                  type="date"
                  value={bookDueDate}
                  onChange={(e) => setBookDueDate(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Task / Objective</label>
              <Input
                type="text"
                required
                placeholder="e.g. Production staging, API security hardening"
                value={bookTaskTitle}
                onChange={(e) => setBookTaskTitle(e.target.value)}
                className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createTaskMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
              >
                {isSubmitting || createTaskMutation.isPending ? "Reserving..." : "Reserve Hours"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Service Booking Form */}
        {modalType === "service" && (
          <form onSubmit={handleSaveServiceBooking} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Assigned Personnel</label>
              <Select
                value={serviceMemberId || (members[0]?.id || "")}
                onValueChange={(val) => setServiceMemberId(val)}
              >
                <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Booking Date</label>
                <Input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Start Time</label>
                <Input
                  type="time"
                  required
                  value={serviceStartTime}
                  onChange={(e) => setServiceStartTime(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Customer Name</label>
              <Input
                type="text"
                placeholder="e.g. Jane Doe"
                value={serviceCustomerName}
                onChange={(e) => setServiceCustomerName(e.target.value)}
                className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Customer Phone</label>
                <Input
                  type="tel"
                  placeholder="+254 700 000000"
                  value={serviceCustomerPhone}
                  onChange={(e) => setServiceCustomerPhone(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Customer Email</label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={serviceCustomerEmail}
                  onChange={(e) => setServiceCustomerEmail(e.target.value)}
                  className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1">Notes / Instructions</label>
              <Input
                type="text"
                placeholder="Client instructions or service scope"
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
