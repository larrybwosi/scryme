"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Plus,
  Clock,
  Trash2,
  Edit,
  Search,
  Calendar,
  AlertTriangle,
  Coffee,
  X,
  User,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import {
  createStaffShift,
  updateStaffShift,
  deleteStaffShift,
  addStaffBreak,
  deleteStaffBreak,
} from "../../app/actions/shifts";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface ShiftBreak {
  id: string;
  shiftId: string;
  startTime: string;
  endTime: string;
  description: string | null;
}

interface StaffShift {
  id: string;
  memberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  breaks: ShiftBreak[];
  member: {
    id: string;
    role: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

interface ShiftsManagerProps {
  initialShifts: StaffShift[];
  allMembers: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  canManage: boolean;
}

export function ShiftsManager({
  initialShifts,
  allMembers,
  canManage,
}: ShiftsManagerProps) {
  const [shifts, setShifts] = useState<StaffShift[]>(initialShifts);
  const [filterMemberId, setFilterMemberId] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [shiftFormData, setShiftFormData] = useState({
    memberId: "",
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "17:00",
    isActive: true,
  });

  // Breaks Modal State
  const [isBreaksModalOpen, setIsBreaksModalOpen] = useState(false);
  const [activeShiftForBreaks, setActiveShiftForBreaks] = useState<StaffShift | null>(null);
  const [breakFormData, setBreakFormData] = useState({
    startTime: "12:00",
    endTime: "13:00",
    description: "Lunch Break",
  });

  // Filter logic
  const filteredShifts = shifts.filter((shift) => {
    const matchesMember =
      filterMemberId === "all" || shift.memberId === filterMemberId;
    const matchesDay =
      filterDay === "all" || shift.dayOfWeek.toString() === filterDay;
    const matchesSearch =
      !searchQuery ||
      shift.member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMember && matchesDay && matchesSearch;
  });

  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftFormData({
      memberId: allMembers[0]?.id || "",
      dayOfWeek: "1",
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    });
    setError(null);
    setIsShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: StaffShift) => {
    setEditingShift(shift);
    setShiftFormData({
      memberId: shift.memberId,
      dayOfWeek: shift.dayOfWeek.toString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      isActive: shift.isActive,
    });
    setError(null);
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let result: any;
      if (editingShift) {
        result = await updateStaffShift(editingShift.id, {
          dayOfWeek: parseInt(shiftFormData.dayOfWeek),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          isActive: shiftFormData.isActive,
        });
      } else {
        result = await createStaffShift({
          memberId: shiftFormData.memberId,
          dayOfWeek: parseInt(shiftFormData.dayOfWeek),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          isActive: shiftFormData.isActive,
        });
      }

      if (result.success) {
        // Optimistically update or fetch again.
        // We can reconstruct the client state cleanly
        if (editingShift) {
          setShifts((prev) =>
            prev.map((s) =>
              s.id === editingShift.id
                ? {
                    ...s,
                    dayOfWeek: parseInt(shiftFormData.dayOfWeek),
                    startTime: shiftFormData.startTime,
                    endTime: shiftFormData.endTime,
                    isActive: shiftFormData.isActive,
                  }
                : s
            )
          );
        } else {
          const addedShift = result.data as any;
          // Hydrate member details
          const memberDetails = allMembers.find((m) => m.id === shiftFormData.memberId);
          const newShift: StaffShift = {
            ...addedShift,
            breaks: [],
            member: {
              id: shiftFormData.memberId,
              role: memberDetails?.role || "EMPLOYEE",
              user: {
                name: memberDetails?.user.name || null,
                email: memberDetails?.user.email || "",
                image: memberDetails?.user.image || null,
              },
            },
          };
          setShifts((prev) => [...prev, newShift]);
        }
        setIsShiftModalOpen(false);
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    startTransition(async () => {
      const result = await deleteStaffShift(shiftId);
      if (result.success) {
        setShifts((prev) => prev.filter((s) => s.id !== shiftId));
      } else {
        alert(result.error || "Failed to delete shift");
      }
    });
  };

  const handleOpenBreaks = (shift: StaffShift) => {
    setActiveShiftForBreaks(shift);
    setBreakFormData({
      startTime: "12:00",
      endTime: "13:00",
      description: "Lunch Break",
    });
    setError(null);
    setIsBreaksModalOpen(true);
  };

  const handleAddBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftForBreaks) return;
    setError(null);

    startTransition(async () => {
      const result = await addStaffBreak(activeShiftForBreaks.id, {
        startTime: breakFormData.startTime,
        endTime: breakFormData.endTime,
        description: breakFormData.description,
      }) as any;

      if (result.success) {
        const newBreak = result.data as ShiftBreak;
        // Update local state
        setShifts((prev) =>
          prev.map((s) =>
            s.id === activeShiftForBreaks.id
              ? { ...s, breaks: [...s.breaks, newBreak] }
              : s
          )
        );
        // Update modal state to show immediate result
        setActiveShiftForBreaks((prev) =>
          prev ? { ...prev, breaks: [...prev.breaks, newBreak] } : null
        );
      } else {
        setError(result.error || "Failed to add break");
      }
    });
  };

  const handleDeleteBreak = async (breakId: string) => {
    if (!activeShiftForBreaks) return;

    startTransition(async () => {
      const result = await deleteStaffBreak(breakId);
      if (result.success) {
        setShifts((prev) =>
          prev.map((s) =>
            s.id === activeShiftForBreaks.id
              ? { ...s, breaks: s.breaks.filter((b) => b.id !== breakId) }
              : s
          )
        );
        setActiveShiftForBreaks((prev) =>
          prev
            ? { ...prev, breaks: prev.breaks.filter((b) => b.id !== breakId) }
            : null
        );
      } else {
        alert(result.error || "Failed to delete break");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200"
                />
              </div>

              {/* Filter Member */}
              <Select value={filterMemberId} onValueChange={setFilterMemberId}>
                <SelectTrigger className="h-10 border-gray-200">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {allMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Day */}
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="h-10 border-gray-200">
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canManage && (
              <Button
                onClick={handleOpenAddShift}
                className="gap-2 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white h-10 w-full md:w-auto shrink-0"
              >
                <Plus size={16} />
                <span>Add Staff Shift</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shifts Views */}
      <Tabs defaultValue="list" className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="bg-white border p-1 h-auto gap-1">
            <TabsTrigger
              value="list"
              className="gap-2 px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-[#1D1D1F]"
            >
              <Activity size={16} />
              List By Staff
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="gap-2 px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-[#1D1D1F]"
            >
              <Calendar size={16} />
              Schedule Grid
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="text-xs text-gray-500 font-normal py-1 px-3">
            Showing {filteredShifts.length} Shift{filteredShifts.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* LIST VIEW */}
        <TabsContent value="list">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[240px]">Staff Member</TableHead>
                  <TableHead>Day of Week</TableHead>
                  <TableHead>Shift Hours</TableHead>
                  <TableHead>Breaks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="h-8 w-8 text-gray-300" />
                        <span>No shifts assigned matching filters.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift) => (
                    <TableRow key={shift.id} className="group hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#1D1D1F]">
                            {shift.member.user.name || "Unnamed User"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {shift.member.user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium bg-zinc-100">
                          {DAYS_OF_WEEK.find((d) => d.value === shift.dayOfWeek)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {shift.startTime} – {shift.endTime}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 items-center">
                          {shift.breaks.map((b) => (
                            <Badge
                              key={b.id}
                              variant="outline"
                              className="bg-orange-50/50 text-orange-700 border-orange-200/60 text-[10px] py-0 px-2 flex items-center gap-1"
                            >
                              <Coffee className="h-2.5 w-2.5" />
                              <span>
                                {b.startTime}-{b.endTime}
                              </span>
                            </Badge>
                          ))}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenBreaks(shift)}
                              className="h-6 px-1.5 text-[10px] text-zinc-500 hover:text-orange-600 gap-0.5 hover:bg-orange-50"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Manage</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            shift.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                          }
                        >
                          {shift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canManage ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditShift(shift)}
                                className="h-8 w-8 p-0 hover:bg-zinc-100"
                              >
                                <Edit className="h-4 w-4 text-zinc-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteShift(shift.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* CALENDAR/GRID VIEW */}
        <TabsContent value="calendar">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayShifts = filteredShifts.filter((s) => s.dayOfWeek === day.value);
              return (
                <Card key={day.value} className="border-none shadow-sm bg-white min-h-[300px] flex flex-col">
                  <CardHeader className="bg-zinc-50/80 p-3 border-b border-zinc-100 flex flex-row justify-between items-center">
                    <CardTitle className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                      {day.label}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-200">
                      {dayShifts.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 flex-1 flex flex-col gap-2.5">
                    {dayShifts.length === 0 ? (
                      <div className="text-center py-10 text-xs text-gray-400 my-auto">
                        No shifts scheduled
                      </div>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={`p-2.5 rounded-lg border text-xs relative group/item transition-all ${
                            shift.isActive
                              ? "bg-blue-50/50 border-blue-100 hover:border-blue-300"
                              : "bg-zinc-50/40 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="font-semibold text-zinc-800 leading-tight">
                            {shift.member.user.name || "Unnamed"}
                          </div>
                          <div className="text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            <span>
                              {shift.startTime}–{shift.endTime}
                            </span>
                          </div>

                          {shift.breaks.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-0.5">
                              {shift.breaks.map((b) => (
                                <span
                                  key={b.id}
                                  className="bg-orange-100/60 text-orange-800 text-[8px] px-1 rounded flex items-center gap-0.5"
                                  title={`Break: ${b.startTime}-${b.endTime} ${b.description || ""}`}
                                >
                                  <Coffee className="h-2 w-2" />
                                  {b.startTime}
                                </span>
                              ))}
                            </div>
                          )}

                          {canManage && (
                            <div className="absolute right-1 top-1 flex opacity-0 group-hover/item:opacity-100 transition-opacity gap-0.5 bg-white/90 p-0.5 rounded shadow-sm border border-zinc-100">
                              <button
                                onClick={() => handleOpenEditShift(shift)}
                                className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* SHIFT MODAL */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingShift ? "Edit Staff Shift" : "Add New Staff Shift"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Set up a recurring weekly shift. Shifttimes must not overlap.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveShift} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!editingShift && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Staff Member</label>
                <Select
                  value={shiftFormData.memberId}
                  onValueChange={(val) => setShiftFormData((prev) => ({ ...prev, memberId: val }))}
                >
                  <SelectTrigger className="border-zinc-200">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user.name || m.user.email} ({m.role.toLowerCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Day of Week</label>
                <Select
                  value={shiftFormData.dayOfWeek}
                  onValueChange={(val) => setShiftFormData((prev) => ({ ...prev, dayOfWeek: val }))}
                >
                  <SelectTrigger className="border-zinc-200">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6 px-1">
                <span className="text-xs font-semibold text-zinc-700">Active Status</span>
                <Switch
                  checked={shiftFormData.isActive}
                  onCheckedChange={(val) => setShiftFormData((prev) => ({ ...prev, isActive: val }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Start Time</label>
                <Input
                  type="time"
                  value={shiftFormData.startTime}
                  onChange={(e) => setShiftFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="border-zinc-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">End Time</label>
                <Input
                  type="time"
                  value={shiftFormData.endTime}
                  onChange={(e) => setShiftFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="border-zinc-200"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsShiftModalOpen(false)}
                className="border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white"
              >
                {isPending ? "Saving..." : "Save Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* BREAKS MODAL */}
      <Dialog open={isBreaksModalOpen} onOpenChange={setIsBreaksModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Coffee className="h-5 w-5 text-orange-600" />
              <span>Manage Shift Breaks</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Configure scheduled breaks during this shift (
              {activeShiftForBreaks?.startTime} – {activeShiftForBreaks?.endTime}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* List of Breaks */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700">Current Breaks</span>
              {activeShiftForBreaks?.breaks.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 bg-zinc-50 rounded-lg border border-dashed">
                  No breaks added yet
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {activeShiftForBreaks?.breaks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-800">
                          {b.startTime} – {b.endTime}
                        </span>
                        {b.description && (
                          <span className="text-[10px] text-zinc-500">{b.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBreak(b.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-full"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Break Form */}
            <form onSubmit={handleAddBreak} className="border-t border-zinc-100 pt-4 space-y-3.5">
              <span className="text-xs font-bold text-zinc-700">Add New Break</span>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-600">Start Time</label>
                  <Input
                    type="time"
                    value={breakFormData.startTime}
                    onChange={(e) => setBreakFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="border-zinc-200 h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-600">End Time</label>
                  <Input
                    type="time"
                    value={breakFormData.endTime}
                    onChange={(e) => setBreakFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="border-zinc-200 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-600">Description</label>
                <Input
                  placeholder="e.g. Lunch Break, Coffee Break"
                  value={breakFormData.description}
                  onChange={(e) => setBreakFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="border-zinc-200 h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white h-9 text-xs mt-1"
              >
                {isPending ? "Adding..." : "Add Break"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
