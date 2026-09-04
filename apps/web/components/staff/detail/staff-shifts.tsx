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
  Clock,
  Plus,
  Edit,
  Trash2,
  Coffee,
  AlertTriangle,
} from "lucide-react";
import {
  createStaffShift,
  updateStaffShift,
  deleteStaffShift,
  addStaffBreak,
  deleteStaffBreak,
} from "../../../app/actions/shifts";

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
}

interface StaffMemberShiftsTabProps {
  member: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  };
  shifts: StaffShift[];
  canManage: boolean;
}

export function StaffMemberShiftsTab({
  member,
  shifts: initialShifts,
  canManage,
}: StaffMemberShiftsTabProps) {
  const [shifts, setShifts] = useState<StaffShift[]>(initialShifts);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [shiftFormData, setShiftFormData] = useState({
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

  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftFormData({
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
          memberId: member.id,
          dayOfWeek: parseInt(shiftFormData.dayOfWeek),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          isActive: shiftFormData.isActive,
        });
      }

      if (result.success) {
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
          setShifts((prev) => [...prev, { ...addedShift, breaks: [] }]);
        }
        setIsShiftModalOpen(false);
      } else {
        setError(result.error || "Failed to save shift");
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
        setShifts((prev) =>
          prev.map((s) =>
            s.id === activeShiftForBreaks.id
              ? { ...s, breaks: [...s.breaks, newBreak] }
              : s
          )
        );
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

  // Sort shifts by day of the week, then start time
  const sortedShifts = [...shifts].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Weekly Shifts Schedule</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Manage weekly recurring shifts and break allocations for {member.user.name || "this member"}.
            </CardDescription>
          </div>
          {canManage && (
            <Button
              onClick={handleOpenAddShift}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9"
            >
              <Plus size={14} />
              <span>Add Shift</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 border-t border-border">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-muted-foreground">Day of Week</TableHead>
                <TableHead className="text-muted-foreground">Shift Hours</TableHead>
                <TableHead className="text-muted-foreground">Breaks</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                {canManage && <TableHead className="text-right w-[150px] text-muted-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No shifts assigned to this staff member yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedShifts.map((shift) => (
                  <TableRow key={shift.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold bg-muted text-foreground">
                        {DAYS_OF_WEEK.find((d) => d.value === shift.dayOfWeek)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
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
                            className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px] py-0 px-2 flex items-center gap-1"
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
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 gap-0.5 hover:bg-orange-500/10"
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
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {shift.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditShift(shift)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShift(shift.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD/EDIT SHIFT DIALOG */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingShift ? "Edit Staff Shift" : "Add New Staff Shift"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set up recurring weekly shifts. Times must not overlap.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveShift} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Day of Week</label>
                <Select
                  value={shiftFormData.dayOfWeek}
                  onValueChange={(val) => setShiftFormData((prev) => ({ ...prev, dayOfWeek: val }))}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
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
                <span className="text-xs font-semibold text-foreground">Active Status</span>
                <Switch
                  checked={shiftFormData.isActive}
                  onCheckedChange={(val) => setShiftFormData((prev) => ({ ...prev, isActive: val }))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={shiftFormData.startTime}
                  onChange={(e) => setShiftFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="border-border bg-background text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">End Time</label>
                <Input
                  type="time"
                  value={shiftFormData.endTime}
                  onChange={(e) => setShiftFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="border-border bg-background text-foreground"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsShiftModalOpen(false)}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending ? "Saving..." : "Save Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE BREAKS DIALOG */}
      <Dialog open={isBreaksModalOpen} onOpenChange={setIsBreaksModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Coffee className="h-5 w-5 text-orange-500" />
              <span>Manage Shift Breaks</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure scheduled break slots within this shift (
              {activeShiftForBreaks?.startTime} – {activeShiftForBreaks?.endTime}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">Current Breaks</span>
              {activeShiftForBreaks?.breaks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                  No breaks scheduled
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {activeShiftForBreaks?.breaks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          {b.startTime} – {b.endTime}
                        </span>
                        {b.description && (
                          <span className="text-[10px] text-muted-foreground">{b.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBreak(b.id)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-full"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Break */}
            <form onSubmit={handleAddBreak} className="border-t border-border pt-4 space-y-3">
              <span className="text-xs font-bold text-foreground">Add New Break</span>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Start Time</label>
                  <Input
                    type="time"
                    value={breakFormData.startTime}
                    onChange={(e) => setBreakFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="border-border bg-background text-foreground h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">End Time</label>
                  <Input
                    type="time"
                    value={breakFormData.endTime}
                    onChange={(e) => setBreakFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="border-border bg-background text-foreground h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Description</label>
                <Input
                  placeholder="e.g. Lunch break, coffee time"
                  value={breakFormData.description}
                  onChange={(e) => setBreakFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="border-border bg-background text-foreground h-9 text-xs placeholder:text-muted-foreground/60"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs mt-1"
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
