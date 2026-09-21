"use client";

import { useMemo, useState, useTransition } from "react";
import { format, isSameDay } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  List,
  Pencil,
  Plus,
  ArrowLeftRight,
  CheckSquare,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Separator } from "@repo/ui/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@repo/ui/components/ui/sheet";
import { Switch } from "@repo/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import {
  addStaffBreak,
  createScheduleOverride,
  createScheduledBooking,
  createStaffShift,
  deleteStaffBreak,
  deleteStaffShift,
  getSchedulingWorkspace,
  processShiftTrade,
  requestShiftTrade,
  transitionScheduledBooking,
  updateStaffShift,
} from "../../app/actions/shifts";
import { createStaffTask, updateStaffTask, deleteStaffTask } from "../../app/actions/tasks";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NOSHOW: "No-show",
};

type Member = {
  id: string;
  role?: string;
  user: { id?: string; name: string | null; email: string; image: string | null };
};
type Shift = {
  id: string;
  memberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  breaks: { id: string; startTime: string; endTime: string; description: string | null }[];
  member: Member;
};
type Booking = {
  id: string;
  serviceName: string;
  status: string;
  revision: number;
  locationId: string | null;
  scheduledStartTime: string | Date;
  scheduledEndTime: string | Date | null;
  notes: string | null;
  customer: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  staff: { memberId: string; status: string; member: Member }[];
  resources: { resource: { id: string; name: string; type: string | null } }[];
};
type Override = {
  id: string;
  memberId: string;
  type: string;
  startTime: string | Date;
  endTime: string | Date;
  reason: string | null;
  member: Member;
};
type ShiftTrade = {
  id: string;
  requesterMemberId: string;
  targetMemberId: string | null;
  shiftId: string;
  offeredShiftId: string | null;
  type: string;
  status: string;
  reason: string | null;
  requesterMember: Member;
  targetMember: Member | null;
  shift: { id: string; dayOfWeek: number; startTime: string; endTime: string };
  offeredShift?: { id: string; dayOfWeek: number; startTime: string; endTime: string } | null;
};
type StaffTaskItem = {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: string | Date | null;
  memberId: string | null;
  shiftId: string | null;
  locationId: string | null;
  notes: string | null;
  member: Member | null;
  location: { id: string; name: string } | null;
};
type Workspace = {
  bookings: Booking[];
  overrides: Override[];
  services: { id: string; name: string; estimatedDuration: number | null; price: string }[];
  locations: { id: string; name: string }[];
  timezone: string;
  tradeRequests?: ShiftTrade[];
  tasks?: StaffTaskItem[];
  departments?: { id: string; name: string }[];
};

interface ShiftsManagerProps {
  initialShifts: Shift[];
  allMembers: Member[];
  canManage: boolean;
  initialWorkspace?: Workspace;
  initialWeekStart: string;
}

function initials(name: string | null, email: string) {
  return (name || email).split(/\s|@/).filter(Boolean).slice(0, 2).map(value => value[0]?.toUpperCase()).join("");
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "CANCELLED" || status === "NOSHOW") return "destructive";
  if (status === "COMPLETED") return "secondary";
  if (status === "REQUESTED") return "outline";
  return "default";
}

export function ShiftsManager({
  initialShifts,
  allMembers,
  canManage,
  initialWorkspace,
  initialWeekStart,
}: ShiftsManagerProps) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace || {
    bookings: [], overrides: [], services: [], locations: [], timezone: "UTC",
  });
  const [shifts, setShifts] = useState(initialShifts);
  const [weekStart, setWeekStart] = useState(new Date(initialWeekStart));
  const [view, setView] = useState("week");
  const [memberFilter, setMemberFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [pendingTransition, setPendingTransition] = useState<"CANCELLED" | "NOSHOW" | null>(null);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [breaksDialogOpen, setBreaksDialogOpen] = useState(false);
  const [activeShiftForBreaks, setActiveShiftForBreaks] = useState<Shift | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shiftForm, setShiftForm] = useState({ memberId: allMembers[0]?.id || "", dayOfWeek: "1", startTime: "09:00", endTime: "17:00", isActive: true });
  const [breakForm, setBreakForm] = useState({ startTime: "12:00", endTime: "13:00", description: "Break" });
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    memberId: allMembers[0]?.id || "",
    locationId: "none",
    dueDate: "",
  });
  const [tradeForm, setTradeForm] = useState({
    shiftId: "",
    offeredShiftId: "none",
    targetMemberId: "none",
    reason: "",
  });
  const [leaveForm, setLeaveForm] = useState({ memberId: allMembers[0]?.id || "", type: "LEAVE", startTime: "", endTime: "", reason: "" });
  const [bookingForm, setBookingForm] = useState({
    memberId: allMembers[0]?.id || "",
    serviceId: workspace.services[0]?.id || "",
    scheduledStartTime: "",
    scheduledEndTime: "",
    locationId: "none",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + index);
    return date;
  }), [weekStart]);

  const filteredBookings = useMemo(() => workspace.bookings.filter(booking => {
    const matchesMember = memberFilter === "all" || booking.staff.some(item => item.memberId === memberFilter);
    const matchesLocation = locationFilter === "all" || booking.locationId === locationFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" ? ["REQUESTED", "SCHEDULED", "IN_PROGRESS"].includes(booking.status) : booking.status === statusFilter);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || booking.serviceName.toLowerCase().includes(query) ||
      booking.customer?.name?.toLowerCase().includes(query) || booking.customer?.email?.toLowerCase().includes(query);
    return matchesMember && matchesLocation && matchesStatus && matchesSearch;
  }), [locationFilter, memberFilter, search, statusFilter, workspace.bookings]);

  const activeStaff = useMemo(() => allMembers.filter(member =>
    memberFilter === "all" || member.id === memberFilter,
  ), [allMembers, memberFilter]);
  const conflicts = workspace.bookings.filter(booking => booking.staff.length === 0 && ["REQUESTED", "SCHEDULED"].includes(booking.status)).length;
  const todayBookings = workspace.bookings.filter(booking => isSameDay(new Date(booking.scheduledStartTime), new Date())).length;
  const pendingAssignments = workspace.bookings.reduce((count, booking) => count + booking.staff.filter(item => item.status === "PENDING").length, 0);
  const onLeave = workspace.overrides.filter(item => ["LEAVE", "BLACKOUT", "UNAVAILABLE"].includes(item.type)).length;
  const pendingTrades = useMemo(() => (workspace.tradeRequests || []).filter(item => item.status === "PENDING"), [workspace.tradeRequests]);
  const activeTasks = useMemo(() => (workspace.tasks || []).filter(item => item.status !== "COMPLETED" && item.status !== "CANCELLED"), [workspace.tasks]);

  const loadWeek = (start: Date) => {
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    startTransition(async () => {
      const result = await getSchedulingWorkspace(start.toISOString(), end.toISOString());
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not load this week");
        return;
      }
      setWorkspace(result.data as unknown as Workspace);
      setWeekStart(start);
    });
  };

  const moveWeek = (direction: number) => {
    const next = new Date(weekStart);
    next.setUTCDate(next.getUTCDate() + direction * 7);
    loadWeek(next);
  };

  const runBookingTransition = (status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NOSHOW") => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const result = await transitionScheduledBooking(selectedBooking.id, selectedBooking.revision, status);
      if (!result.success) {
        toast.error(result.error || "Booking update failed");
        return;
      }
      setWorkspace(current => ({
        ...current,
        bookings: current.bookings.map(item => item.id === selectedBooking.id
          ? { ...item, status, revision: item.revision + 1 }
          : item),
      }));
      setSelectedBooking(current => current ? { ...current, status, revision: current.revision + 1 } : current);
      setPendingTransition(null);
      toast.success(`Booking marked ${STATUS_LABELS[status].toLowerCase()}`);
    });
  };

  const openNewShiftModal = (memberId?: string, dayOfWeek?: number) => {
    setEditingShift(null);
    setShiftForm({
      memberId: memberId || allMembers[0]?.id || "",
      dayOfWeek: dayOfWeek !== undefined ? String(dayOfWeek) : "1",
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    });
    setShiftDialogOpen(true);
  };

  const openEditShiftModal = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      memberId: shift.memberId,
      dayOfWeek: String(shift.dayOfWeek),
      startTime: shift.startTime,
      endTime: shift.endTime,
      isActive: shift.isActive,
    });
    setShiftDialogOpen(true);
  };

  const submitShift = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      let result: any;
      if (editingShift) {
        result = await updateStaffShift(editingShift.id, {
          dayOfWeek: Number(shiftForm.dayOfWeek),
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          isActive: shiftForm.isActive,
        });
      } else {
        result = await createStaffShift({
          memberId: shiftForm.memberId,
          dayOfWeek: Number(shiftForm.dayOfWeek),
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          isActive: shiftForm.isActive,
        });
      }

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not save shift");
        return;
      }

      if (editingShift) {
        const updated = result.data as any;
        setShifts(current => current.map(s => s.id === editingShift.id ? { ...s, ...updated } : s));
        toast.success("Shift updated");
      } else {
        const member = allMembers.find(item => item.id === shiftForm.memberId);
        if (member) setShifts(current => [...current, { ...(result.data as any), breaks: [], member }]);
        toast.success("Recurring shift added");
      }
      setShiftDialogOpen(false);
    });
  };

  const toggleShiftActive = (shift: Shift) => {
    startTransition(async () => {
      const nextActive = !shift.isActive;
      const result = await updateStaffShift(shift.id, { isActive: nextActive });
      if (!result.success) {
        toast.error(result.error || "Could not update shift status");
        return;
      }
      setShifts(current => current.map(s => s.id === shift.id ? { ...s, isActive: nextActive } : s));
      toast.success(nextActive ? "Shift activated" : "Shift deactivated");
    });
  };

  const removeShift = (shiftId: string) => {
    startTransition(async () => {
      const result = await deleteStaffShift(shiftId);
      if (!result.success) {
        toast.error(result.error || "Could not delete shift");
        return;
      }
      setShifts(current => current.filter(item => item.id !== shiftId));
      toast.success("Shift removed");
    });
  };

  const openBreaksModal = (shift: Shift) => {
    setActiveShiftForBreaks(shift);
    setBreakForm({ startTime: "12:00", endTime: "13:00", description: "Lunch Break" });
    setBreaksDialogOpen(true);
  };

  const submitBreak = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeShiftForBreaks) return;
    startTransition(async () => {
      const result: any = await addStaffBreak(activeShiftForBreaks.id, {
        startTime: breakForm.startTime,
        endTime: breakForm.endTime,
        description: breakForm.description || undefined,
      });
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not add break");
        return;
      }
      const newBreak = result.data;
      setShifts(current => current.map(s => s.id === activeShiftForBreaks.id ? { ...s, breaks: [...s.breaks, newBreak] } : s));
      setActiveShiftForBreaks(current => current ? { ...current, breaks: [...current.breaks, newBreak] } : null);
      toast.success("Break added");
    });
  };

  const removeBreak = (breakId: string) => {
    if (!activeShiftForBreaks) return;
    startTransition(async () => {
      const result = await deleteStaffBreak(breakId);
      if (!result.success) {
        toast.error(result.error || "Could not remove break");
        return;
      }
      setShifts(current => current.map(s => s.id === activeShiftForBreaks.id ? { ...s, breaks: s.breaks.filter(b => b.id !== breakId) } : s));
      setActiveShiftForBreaks(current => current ? { ...current, breaks: current.breaks.filter(b => b.id !== breakId) } : null);
      toast.success("Break removed");
    });
  };

  const submitLeave = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result: any = await createScheduleOverride({
        memberId: leaveForm.memberId,
        type: leaveForm.type as "WORKING" | "UNAVAILABLE" | "LEAVE" | "BLACKOUT",
        startTime: new Date(leaveForm.startTime).toISOString(),
        endTime: new Date(leaveForm.endTime).toISOString(),
        reason: leaveForm.reason,
      });
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not save override");
        return;
      }
      const member = allMembers.find(item => item.id === leaveForm.memberId);
      if (member) setWorkspace(current => ({ ...current, overrides: [...current.overrides, { ...(result.data as any), member }] }));
      setLeaveDialogOpen(false);
      toast.success("Schedule override created");
    });
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result: any = await createStaffTask({
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        memberId: taskForm.memberId || undefined,
        locationId: taskForm.locationId !== "none" ? taskForm.locationId : undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
      });
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create task");
        return;
      }
      setWorkspace(current => ({
        ...current,
        tasks: [result.data, ...(current.tasks || [])],
      }));
      setTaskDialogOpen(false);
      setTaskForm({ title: "", description: "", priority: "MEDIUM", memberId: allMembers[0]?.id || "", locationId: "none", dueDate: "" });
      toast.success("Task created");
    });
  };

  const handleTaskStatusToggle = (task: StaffTaskItem) => {
    startTransition(async () => {
      const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      const result = await updateStaffTask(task.id, { status: nextStatus });
      if (!result.success) {
        toast.error(result.error || "Could not update task");
        return;
      }
      setWorkspace(current => ({
        ...current,
        tasks: (current.tasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus } : t),
      }));
      toast.success(nextStatus === "COMPLETED" ? "Task completed" : "Task reopened");
    });
  };

  const submitTradeRequest = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result: any = await requestShiftTrade({
        shiftId: tradeForm.shiftId,
        offeredShiftId: tradeForm.offeredShiftId !== "none" ? tradeForm.offeredShiftId : undefined,
        targetMemberId: tradeForm.targetMemberId !== "none" ? tradeForm.targetMemberId : undefined,
        reason: tradeForm.reason || undefined,
      });
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not submit trade request");
        return;
      }
      setWorkspace(current => ({
        ...current,
        tradeRequests: [result.data, ...(current.tradeRequests || [])],
      }));
      setTradeDialogOpen(false);
      toast.success("Shift trade request submitted");
    });
  };

  const handleProcessTrade = (tradeId: string, action: "APPROVE" | "REJECT" | "CANCEL") => {
    startTransition(async () => {
      const result = await processShiftTrade(tradeId, action);
      if (!result.success) {
        toast.error(result.error || "Could not process trade request");
        return;
      }
      setWorkspace(current => ({
        ...current,
        tradeRequests: (current.tradeRequests || []).map(tr => tr.id === tradeId ? { ...tr, status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "CANCELLED" } : tr),
      }));
      toast.success(`Trade request ${action.toLowerCase()}d`);
    });
  };

  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result: any = await createScheduledBooking({
        memberId: bookingForm.memberId,
        serviceId: bookingForm.serviceId,
        scheduledStartTime: new Date(bookingForm.scheduledStartTime).toISOString(),
        scheduledEndTime: bookingForm.scheduledEndTime ? new Date(bookingForm.scheduledEndTime).toISOString() : undefined,
        locationId: bookingForm.locationId !== "none" ? bookingForm.locationId : undefined,
        customerName: bookingForm.customerName || undefined,
        customerEmail: bookingForm.customerEmail || undefined,
        customerPhone: bookingForm.customerPhone || undefined,
        notes: bookingForm.notes || undefined,
      });
      if (!result.success || !result.data) {
        toast.error(result.error || "Could not schedule appointment");
        return;
      }
      setWorkspace(current => ({
        ...current,
        bookings: [result.data as Booking, ...current.bookings],
      }));
      setBookingDialogOpen(false);
      toast.success("Schedule created successfully");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Scheduling summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today", value: todayBookings, detail: "bookings", icon: CalendarDays },
          { label: "Awaiting response", value: pendingAssignments, detail: "assignments", icon: Clock3 },
          { label: "Coverage alerts", value: conflicts, detail: "unassigned", icon: ShieldAlert },
          { label: "Unavailable", value: onLeave, detail: "staff overrides", icon: Users },
        ].map(metric => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <metric.icon className="text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="flex items-end gap-2">
              <strong className="font-mono text-3xl font-semibold">{metric.value}</strong>
              <span className="pb-1 text-sm text-muted-foreground">{metric.detail}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      {conflicts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Coverage needs attention</AlertTitle>
          <AlertDescription>{conflicts} active booking{conflicts === 1 ? " is" : "s are"} not assigned to a staff member.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="calendar">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
          <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <TabsList>
              <TabsTrigger value="calendar"><CalendarDays data-icon="inline-start" />Calendar</TabsTrigger>
              <TabsTrigger value="roster"><Users data-icon="inline-start" />Roster</TabsTrigger>
              <TabsTrigger value="tasks"><CheckSquare data-icon="inline-start" />Tasks ({activeTasks.length})</TabsTrigger>
              <TabsTrigger value="trades"><ArrowLeftRight data-icon="inline-start" />Shift Trades ({pendingTrades.length})</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setTaskDialogOpen(true)} variant="outline">
                <Plus data-icon="inline-start" />Add Task
              </Button>
              <Button onClick={() => setTradeDialogOpen(true)} variant="outline">
                <ArrowLeftRight data-icon="inline-start" />Trade Shift
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => moveWeek(-1)} disabled={isPending} aria-label="Previous week"><ChevronLeft /></Button>
              <Button variant="outline" onClick={() => {
                const start = new Date();
                start.setUTCDate(start.getUTCDate() - start.getUTCDay());
                start.setUTCHours(0, 0, 0, 0);
                loadWeek(start);
              }} disabled={isPending}>Today</Button>
              <Button variant="outline" size="icon" onClick={() => moveWeek(1)} disabled={isPending} aria-label="Next week"><ChevronRight /></Button>
              <span className="min-w-48 text-center text-sm font-medium">{format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}</span>
              <Badge variant="outline">{workspace.timezone}</Badge>
              {canManage && (
                <>
                  <Button onClick={() => openNewShiftModal()}>
                    <Plus data-icon="inline-start" />Add Shift
                  </Button>
                  <Button onClick={() => {
                    setBookingForm(current => ({
                      ...current,
                      memberId: current.memberId || allMembers[0]?.id || "",
                      serviceId: current.serviceId || workspace.services[0]?.id || "",
                    }));
                    setBookingDialogOpen(true);
                  }} variant="outline">
                    <Plus data-icon="inline-start" />Add Schedule
                  </Button>
                  <Button onClick={() => setLeaveDialogOpen(true)} variant="outline"><Plus data-icon="inline-start" />Override</Button>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input className="pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search bookings or customers" aria-label="Search schedule" />
            </div>
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-full xl:w-52"><SelectValue placeholder="All staff" /></SelectTrigger>
              <SelectContent><SelectGroup><SelectItem value="all">All staff</SelectItem>{allMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.user.name || member.user.email}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full xl:w-48"><SelectValue placeholder="All locations" /></SelectTrigger>
              <SelectContent><SelectGroup><SelectItem value="all">All locations</SelectItem>{workspace.locations.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full xl:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectGroup><SelectItem value="active">Active work</SelectItem><SelectItem value="all">All statuses</SelectItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
            <div className="flex rounded-lg border p-1">
              <Button variant={view === "week" ? "secondary" : "ghost"} size="sm" onClick={() => setView("week")}><CalendarDays data-icon="inline-start" />Week</Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}><List data-icon="inline-start" />List</Button>
            </div>
          </div>
        </div>

        <TabsContent value="calendar">
          {view === "week" ? (
            <Card className="overflow-hidden">
              <ScrollArea className="w-full">
                <div className="min-w-[1100px]">
                  <div className="grid grid-cols-[200px_repeat(7,minmax(128px,1fr))] border-b bg-muted/30">
                    <div className="p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Staff coverage</div>
                    {weekDays.map(day => <div key={day.toISOString()} className="border-l p-3 text-center"><div className="text-xs text-muted-foreground">{format(day, "EEE")}</div><div className="font-mono text-lg font-semibold">{format(day, "d")}</div></div>)}
                  </div>
                  {activeStaff.map(member => (
                    <div key={member.id} className="grid min-h-32 grid-cols-[200px_repeat(7,minmax(128px,1fr))] border-b last:border-b-0">
                      <div className="flex items-start gap-3 p-3">
                        <Avatar className="size-9"><AvatarImage src={member.user.image || undefined} alt="" /><AvatarFallback>{initials(member.user.name, member.user.email)}</AvatarFallback></Avatar>
                        <div className="min-w-0"><div className="truncate text-sm font-medium">{member.user.name || member.user.email}</div><div className="truncate text-xs text-muted-foreground">{member.role}</div></div>
                      </div>
                      {weekDays.map(day => {
                        const dayBookings = filteredBookings.filter(booking => isSameDay(new Date(booking.scheduledStartTime), day) && booking.staff.some(item => item.memberId === member.id));
                        const dayOverride = workspace.overrides.find(item => item.memberId === member.id && isSameDay(new Date(item.startTime), day));
                        const shift = shifts.find(item => item.memberId === member.id && item.dayOfWeek === day.getUTCDay() && item.isActive);
                        return <div key={day.toISOString()} className="flex flex-col gap-2 border-l p-2">
                          <div className="flex min-h-5 items-center justify-between gap-1 text-xs text-muted-foreground group/shift">
                            <span className="font-medium">{shift ? `${shift.startTime}–${shift.endTime}` : "Off"}</span>
                            <div className="flex items-center gap-1">
                              {dayOverride && <Badge variant="destructive">{dayOverride.type}</Badge>}
                              {canManage && (
                                shift ? (
                                  <button
                                    type="button"
                                    onClick={() => openEditShiftModal(shift)}
                                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    title="Edit shift"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openNewShiftModal(member.id, day.getUTCDay())}
                                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    title="Add shift"
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                          {dayBookings.map(booking => <button key={booking.id} type="button" onClick={() => setSelectedBooking(booking)} className="flex flex-col gap-1 rounded-lg border bg-background p-2 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span className="text-xs font-semibold">{format(new Date(booking.scheduledStartTime), "HH:mm")} {booking.serviceName}</span>
                            <span className="truncate text-xs text-muted-foreground">{booking.customer?.name || "Walk-in customer"}</span>
                            <Badge variant={statusVariant(booking.status)}>{STATUS_LABELS[booking.status]}</Badge>
                          </button>)}
                        </div>;
                      })}
                    </div>
                  ))}
                  {!activeStaff.length && <div className="p-12 text-center text-sm text-muted-foreground">No staff match the selected filters.</div>}
                </div>
              </ScrollArea>
            </Card>
          ) : (
            <Card><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>Staff</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
              {filteredBookings.map(booking => <TableRow key={booking.id} className="cursor-pointer" onClick={() => setSelectedBooking(booking)}><TableCell className="font-mono text-xs">{format(new Date(booking.scheduledStartTime), "EEE MMM d, HH:mm")}</TableCell><TableCell className="font-medium">{booking.serviceName}</TableCell><TableCell>{booking.customer?.name || "Walk-in"}</TableCell><TableCell>{booking.staff.map(item => item.member.user.name || item.member.user.email).join(", ") || "Unassigned"}</TableCell><TableCell><Badge variant={statusVariant(booking.status)}>{STATUS_LABELS[booking.status]}</Badge></TableCell></TableRow>)}
              {!filteredBookings.length && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No bookings match this view.</TableCell></TableRow>}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Staff Tasks & Operational Checklists</CardTitle>
                <CardDescription>Assign and track daily operational duties across shift members.</CardDescription>
              </div>
              <Button onClick={() => setTaskDialogOpen(true)}>
                <Plus data-icon="inline-start" />Create Task
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(workspace.tasks || []).map(task => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <span className={`font-medium ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.member ? (task.member.user.name || task.member.user.email) : "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.priority === "URGENT" || task.priority === "HIGH" ? "destructive" : "outline"}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.location?.name || "All Locations"}</TableCell>
                      <TableCell>
                        <Badge variant={task.status === "COMPLETED" ? "secondary" : "default"}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskStatusToggle(task)}
                          disabled={isPending}
                        >
                          {task.status === "COMPLETED" ? "Reopen" : "Mark Done"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(workspace.tasks || []).length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        No operational tasks created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Shift Swaps & Trade Requests</CardTitle>
                <CardDescription>Manage open shift biddings and peer-to-peer shift trade approvals.</CardDescription>
              </div>
              <Button onClick={() => setTradeDialogOpen(true)}>
                <ArrowLeftRight data-icon="inline-start" />Request Trade
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Target Member</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(workspace.tradeRequests || []).map(trade => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.requesterMember.user.name || trade.requesterMember.user.email}</TableCell>
                      <TableCell className="font-mono text-xs">{DAYS[trade.shift.dayOfWeek]} {trade.shift.startTime}–{trade.shift.endTime}</TableCell>
                      <TableCell>{trade.targetMember ? (trade.targetMember.user.name || trade.targetMember.user.email) : "Open Shift (Any)"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{trade.reason || "No reason specified"}</TableCell>
                      <TableCell>
                        <Badge variant={trade.status === "APPROVED" ? "secondary" : trade.status === "PENDING" ? "outline" : "destructive"}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.status === "PENDING" && canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" onClick={() => handleProcessTrade(trade.id, "APPROVE")} disabled={isPending}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleProcessTrade(trade.id, "REJECT")} disabled={isPending}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(workspace.tradeRequests || []).length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        No shift trade requests submitted.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Recurring roster</CardTitle>
                <CardDescription>Weekly working hours are interpreted in {workspace.timezone}.</CardDescription>
              </div>
              {canManage && (
                <Button onClick={() => openNewShiftModal()}>
                  <Plus data-icon="inline-start" />Add shift
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff member</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Breaks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map(shift => (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage src={shift.member.user.image || undefined} alt="" />
                            <AvatarFallback>{initials(shift.member.user.name, shift.member.user.email)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{shift.member.user.name || shift.member.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{DAYS[shift.dayOfWeek]}</TableCell>
                      <TableCell className="font-mono text-xs">{shift.startTime}–{shift.endTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {shift.breaks.length > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-mono">
                              <Coffee className="size-3.5 text-muted-foreground" aria-hidden="true" />
                              {shift.breaks.length} break{shift.breaks.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px]"
                              onClick={() => openBreaksModal(shift)}
                            >
                              Manage
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canManage && (
                            <Switch
                              checked={shift.isActive}
                              onCheckedChange={() => toggleShiftActive(shift)}
                              disabled={isPending}
                            />
                          )}
                          <Badge variant={shift.isActive ? "default" : "secondary"}>
                            {shift.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditShiftModal(shift)}
                            >
                              <Pencil className="size-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeShift(shift.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!shifts.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        No recurring shifts configured.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(selectedBooking)} onOpenChange={open => !open && setSelectedBooking(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedBooking && <div className="flex h-full flex-col gap-6">
            <SheetHeader><div className="flex items-center gap-2"><Badge variant={statusVariant(selectedBooking.status)}>{STATUS_LABELS[selectedBooking.status]}</Badge><span className="font-mono text-xs text-muted-foreground">rev {selectedBooking.revision}</span></div><SheetTitle className="text-balance">{selectedBooking.serviceName}</SheetTitle><SheetDescription>{format(new Date(selectedBooking.scheduledStartTime), "EEEE, MMMM d 'at' HH:mm")} · {workspace.timezone}</SheetDescription></SheetHeader>
            <div className="flex flex-col gap-5 px-4">
              <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</div><div className="mt-1 font-medium">{selectedBooking.customer?.name || "Walk-in customer"}</div><div className="text-sm text-muted-foreground">{selectedBooking.customer?.email || selectedBooking.customer?.phone || "No contact details"}</div></div>
              <Separator />
              <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned team</div><div className="mt-2 flex flex-col gap-2">{selectedBooking.staff.map(item => <div key={item.memberId} className="flex items-center justify-between gap-3"><span className="text-sm">{item.member.user.name || item.member.user.email}</span><Badge variant={item.status === "DECLINED" ? "destructive" : "outline"}>{item.status}</Badge></div>)}{!selectedBooking.staff.length && <span className="text-sm text-destructive">Unassigned</span>}</div></div>
              {selectedBooking.resources.length > 0 && <><Separator /><div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resources</div><div className="mt-2 flex flex-wrap gap-2">{selectedBooking.resources.map(item => <Badge key={item.resource.id} variant="secondary">{item.resource.name}</Badge>)}</div></div></>}
              {selectedBooking.notes && <><Separator /><div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</div><p className="mt-1 text-sm leading-relaxed">{selectedBooking.notes}</p></div></>}
              {canManage && <div className="flex flex-wrap gap-2 pt-2">{selectedBooking.status === "SCHEDULED" && <Button onClick={() => runBookingTransition("IN_PROGRESS")} disabled={isPending}><Clock3 data-icon="inline-start" />Start</Button>}{selectedBooking.status === "IN_PROGRESS" && <Button onClick={() => runBookingTransition("COMPLETED")} disabled={isPending}><CheckCircle2 data-icon="inline-start" />Complete</Button>}{["REQUESTED", "SCHEDULED"].includes(selectedBooking.status) && <Button variant="outline" onClick={() => setPendingTransition("NOSHOW")} disabled={isPending}>No-show</Button>}{["REQUESTED", "SCHEDULED", "IN_PROGRESS"].includes(selectedBooking.status) && <Button variant="destructive" onClick={() => setPendingTransition("CANCELLED")} disabled={isPending}>Cancel booking</Button>}</div>}
            </div>
          </div>}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingTransition)} onOpenChange={open => !open && setPendingTransition(null)}><DialogContent><DialogHeader><DialogTitle>{pendingTransition === "CANCELLED" ? "Cancel this booking?" : "Mark as no-show?"}</DialogTitle><DialogDescription>This change is recorded in the booking audit history and immediately invalidates stale notification actions.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPendingTransition(null)}>Keep booking</Button><Button variant="destructive" onClick={() => pendingTransition && runBookingTransition(pendingTransition)} disabled={isPending}>Confirm</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent>
          <form onSubmit={submitShift}>
            <DialogHeader>
              <DialogTitle>{editingShift ? "Edit recurring shift" : "Add recurring shift"}</DialogTitle>
              <DialogDescription>Set regular working hours in the organization timezone.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-5">
              <Field>
                <FieldLabel>Staff member</FieldLabel>
                <Select
                  value={shiftForm.memberId}
                  onValueChange={memberId => setShiftForm(current => ({ ...current, memberId }))}
                  disabled={Boolean(editingShift)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {allMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user.name || member.user.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Day</FieldLabel>
                <Select
                  value={shiftForm.dayOfWeek}
                  onValueChange={dayOfWeek => setShiftForm(current => ({ ...current, dayOfWeek }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DAYS.map((day, index) => (
                        <SelectItem key={day} value={String(index)}>{day}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="shift-start">Starts</FieldLabel>
                  <Input
                    id="shift-start"
                    type="time"
                    value={shiftForm.startTime}
                    onChange={event => setShiftForm(current => ({ ...current, startTime: event.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="shift-end">Ends</FieldLabel>
                  <Input
                    id="shift-end"
                    type="time"
                    value={shiftForm.endTime}
                    onChange={event => setShiftForm(current => ({ ...current, endTime: event.target.value }))}
                    required
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between pt-2">
                <FieldLabel htmlFor="shift-active">Active Shift</FieldLabel>
                <Switch
                  id="shift-active"
                  checked={shiftForm.isActive}
                  onCheckedChange={isActive => setShiftForm(current => ({ ...current, isActive }))}
                />
              </div>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShiftDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Save shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={breaksDialogOpen} onOpenChange={setBreaksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="size-5 text-orange-500" />
              <span>Manage Shift Breaks</span>
            </DialogTitle>
            <DialogDescription>
              Configure breaks for {activeShiftForBreaks?.member.user.name || activeShiftForBreaks?.member.user.email} ({activeShiftForBreaks?.startTime} – {activeShiftForBreaks?.endTime}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Scheduled Breaks</span>
              {!activeShiftForBreaks?.breaks.length ? (
                <p className="text-xs text-muted-foreground italic py-2">No breaks configured for this shift.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeShiftForBreaks.breaks.map(b => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                      <div>
                        <span className="font-semibold font-mono">{b.startTime} – {b.endTime}</span>
                        {b.description && <span className="ml-2 text-muted-foreground">({b.description})</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => removeBreak(b.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={submitBreak} className="border-t pt-4 space-y-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Add New Break</span>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="break-start">Start Time</FieldLabel>
                  <Input
                    id="break-start"
                    type="time"
                    value={breakForm.startTime}
                    onChange={e => setBreakForm(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="break-end">End Time</FieldLabel>
                  <Input
                    id="break-end"
                    type="time"
                    value={breakForm.endTime}
                    onChange={e => setBreakForm(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="break-desc">Description</FieldLabel>
                <Input
                  id="break-desc"
                  value={breakForm.description}
                  onChange={e => setBreakForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Lunch break"
                />
              </Field>
              <Button type="submit" disabled={isPending} className="w-full">Add Break</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <form onSubmit={submitTask}>
            <DialogHeader>
              <DialogTitle>Create Staff Task</DialogTitle>
              <DialogDescription>Assign operational tasks and checklists to staff or shifts.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-5">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input value={taskForm.title} onChange={e => setTaskForm(c => ({ ...c, title: e.target.value }))} placeholder="Task title" required />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input value={taskForm.description} onChange={e => setTaskForm(c => ({ ...c, description: e.target.value }))} placeholder="Task details" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={taskForm.priority} onValueChange={p => setTaskForm(c => ({ ...c, priority: p as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Assignee</FieldLabel>
                  <Select value={taskForm.memberId} onValueChange={m => setTaskForm(c => ({ ...c, memberId: m }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.user.name || m.user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || !taskForm.title.trim()}>Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent>
          <form onSubmit={submitTradeRequest}>
            <DialogHeader>
              <DialogTitle>Request Shift Trade / Swap</DialogTitle>
              <DialogDescription>Trade or swap your scheduled shift with another team member.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-5">
              <Field>
                <FieldLabel>Your Shift to Trade</FieldLabel>
                <Select value={tradeForm.shiftId} onValueChange={s => setTradeForm(c => ({ ...c, shiftId: s }))}>
                  <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime} ({s.member.user.name || s.member.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Target Member (Optional)</FieldLabel>
                <Select value={tradeForm.targetMemberId} onValueChange={m => setTradeForm(c => ({ ...c, targetMemberId: m }))}>
                  <SelectTrigger><SelectValue placeholder="Any team member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Open to Anyone</SelectItem>
                    {allMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.user.name || m.user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Reason</FieldLabel>
                <Input value={tradeForm.reason} onChange={e => setTradeForm(c => ({ ...c, reason: e.target.value }))} placeholder="Reason for trade request" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTradeDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || !tradeForm.shiftId}>Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}><DialogContent><form onSubmit={submitLeave}><DialogHeader><DialogTitle>Create schedule override</DialogTitle><DialogDescription>Block leave and unavailable time, or add a one-off working window.</DialogDescription></DialogHeader><FieldGroup className="py-5"><Field><FieldLabel>Staff member</FieldLabel><Select value={leaveForm.memberId} onValueChange={memberId => setLeaveForm(current => ({ ...current, memberId }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{allMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.user.name || member.user.email}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>Override type</FieldLabel><Select value={leaveForm.type} onValueChange={type => setLeaveForm(current => ({ ...current, type }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="LEAVE">Leave</SelectItem><SelectItem value="UNAVAILABLE">Unavailable</SelectItem><SelectItem value="BLACKOUT">Blackout</SelectItem><SelectItem value="WORKING">One-off working time</SelectItem></SelectGroup></SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="leave-start">Starts</FieldLabel><Input id="leave-start" type="datetime-local" value={leaveForm.startTime} onChange={event => setLeaveForm(current => ({ ...current, startTime: event.target.value }))} required /></Field><Field><FieldLabel htmlFor="leave-end">Ends</FieldLabel><Input id="leave-end" type="datetime-local" value={leaveForm.endTime} onChange={event => setLeaveForm(current => ({ ...current, endTime: event.target.value }))} required /></Field></div><Field><FieldLabel htmlFor="leave-reason">Reason</FieldLabel><Input id="leave-reason" value={leaveForm.reason} onChange={event => setLeaveForm(current => ({ ...current, reason: event.target.value }))} placeholder="Optional operational note" /></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={isPending}>Create override</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}><DialogContent className="max-w-lg"><form onSubmit={submitBooking}><DialogHeader><DialogTitle>Add member schedule</DialogTitle><DialogDescription>Schedule a service booking appointment for a staff member.</DialogDescription></DialogHeader><FieldGroup className="py-5"><Field><FieldLabel>Staff member</FieldLabel><Select value={bookingForm.memberId} onValueChange={memberId => setBookingForm(current => ({ ...current, memberId }))}><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent><SelectGroup>{allMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.user.name || member.user.email}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>Service</FieldLabel><Select value={bookingForm.serviceId} onValueChange={serviceId => setBookingForm(current => ({ ...current, serviceId }))}><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent><SelectGroup>{workspace.services.map(service => <SelectItem key={service.id} value={service.id}>{service.name} ({service.estimatedDuration ? `${service.estimatedDuration} mins` : "Fixed"})</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="booking-start">Scheduled Start</FieldLabel><Input id="booking-start" type="datetime-local" value={bookingForm.scheduledStartTime} onChange={event => setBookingForm(current => ({ ...current, scheduledStartTime: event.target.value }))} required /></Field><Field><FieldLabel htmlFor="booking-end">Scheduled End (Optional)</FieldLabel><Input id="booking-end" type="datetime-local" value={bookingForm.scheduledEndTime} onChange={event => setBookingForm(current => ({ ...current, scheduledEndTime: event.target.value }))} placeholder="Auto-calculated if blank" /></Field></div><Field><FieldLabel>Location (Optional)</FieldLabel><Select value={bookingForm.locationId} onValueChange={locationId => setBookingForm(current => ({ ...current, locationId }))}><SelectTrigger><SelectValue placeholder="All locations / Default" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="none">No location / Default</SelectItem>{workspace.locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid grid-cols-3 gap-3"><Field><FieldLabel htmlFor="customer-name">Customer Name</FieldLabel><Input id="customer-name" value={bookingForm.customerName} onChange={event => setBookingForm(current => ({ ...current, customerName: event.target.value }))} placeholder="Walk-in Customer" /></Field><Field><FieldLabel htmlFor="customer-email">Email</FieldLabel><Input id="customer-email" type="email" value={bookingForm.customerEmail} onChange={event => setBookingForm(current => ({ ...current, customerEmail: event.target.value }))} placeholder="optional@email.com" /></Field><Field><FieldLabel htmlFor="customer-phone">Phone</FieldLabel><Input id="customer-phone" value={bookingForm.customerPhone} onChange={event => setBookingForm(current => ({ ...current, customerPhone: event.target.value }))} placeholder="+123..." /></Field></div><Field><FieldLabel htmlFor="booking-notes">Notes</FieldLabel><Input id="booking-notes" value={bookingForm.notes} onChange={event => setBookingForm(current => ({ ...current, notes: event.target.value }))} placeholder="Optional appointment instructions or details" /></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={isPending || !bookingForm.serviceId || !bookingForm.memberId}>Save Schedule</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}
