import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Shift, ScheduleOverride, ScheduleOverrideType } from '../lib/types';
import { Calendar as CalendarIcon, Clock, Plus, Users, ChevronLeft, ChevronRight, AlertCircle, Loader2, Repeat, CalendarClock, Trash2 } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OVERRIDE_LABELS: Record<ScheduleOverrideType, string> = {
  WORKING: 'Extra Shift',
  UNAVAILABLE: 'Unavailable',
  LEAVE: 'Leave',
  BLACKOUT: 'Blackout',
};

const OVERRIDE_STYLES: Record<ScheduleOverrideType, string> = {
  WORKING: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  UNAVAILABLE: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  LEAVE: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  BLACKOUT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatHours(startTime: string, endTime: string) {
  return Math.max(0, (toMinutes(endTime) - toMinutes(startTime)) / 60);
}

function startOfWeek(offset: number) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDates(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function toLocalDateTimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function SchedulePage() {
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const shifts = useTaskStore((state) => state.shifts);
  const overrides = useTaskStore((state) => state.overrides);
  const isScheduleLoading = useTaskStore((state) => state.isScheduleLoading);
  const scheduleError = useTaskStore((state) => state.scheduleError);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => startOfWeek(weekOffset), [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  useEffect(() => {
    taskStore.fetchSchedule(weekStart, weekEnd);
  }, [weekStart.getTime(), weekEnd.getTime()]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<
    | { kind: 'shift'; data: Shift }
    | { kind: 'override'; data: ScheduleOverride }
    | null
  >(null);

  // Form state
  const [entryKind, setEntryKind] = useState<'recurring' | 'oneoff'>('recurring');
  const [memberId, setMemberId] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [date, setDate] = useState(toLocalDateTimeInput(new Date()));
  const [overrideType, setOverrideType] = useState<ScheduleOverrideType>('WORKING');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!memberId && teamMembers.length > 0) {
      setMemberId(teamMembers[0].id);
    }
  }, [teamMembers, memberId]);

  const resetForm = () => {
    setEntryKind('recurring');
    setDayIndex(0);
    setDate(toLocalDateTimeInput(new Date()));
    setOverrideType('WORKING');
    setStartTime('09:00');
    setEndTime('17:00');
    setReason('');
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    setIsSubmitting(true);
    try {
      if (entryKind === 'recurring') {
        // Prisma's dayOfWeek is 0 = Sunday ... 6 = Saturday; our grid is Mon-first.
        const prismaDayOfWeek = (dayIndex + 1) % 7;
        await taskStore.createShift({ memberId, dayOfWeek: prismaDayOfWeek, startTime, endTime });
      } else {
        const start = new Date(`${date}T${startTime}:00`);
        const end = new Date(`${date}T${endTime}:00`);
        await taskStore.requestTimeOff({
          memberId,
          type: overrideType,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: reason.trim() || undefined,
        });
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('[v0] Failed to save schedule entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Array<{ kind: 'shift'; data: Shift } | { kind: 'override'; data: ScheduleOverride }>>();
    weekDates.forEach((d) => map.set(toDateKey(d), []));

    weekDates.forEach((d) => {
      const key = toDateKey(d);
      const dow = d.getDay();
      shifts
        .filter((s) => s.isActive && s.dayOfWeek === dow)
        .filter((s) => !s.effectiveFrom || new Date(s.effectiveFrom) <= d)
        .filter((s) => !s.effectiveUntil || new Date(s.effectiveUntil) >= d)
        .forEach((s) => map.get(key)!.push({ kind: 'shift', data: s }));
    });

    overrides.forEach((o) => {
      const start = new Date(o.startTime);
      const end = new Date(o.endTime);
      weekDates.forEach((d) => {
        const dayStart = new Date(d);
        const dayEnd = new Date(d);
        dayEnd.setDate(dayEnd.getDate() + 1);
        if (start < dayEnd && end > dayStart) {
          map.get(toDateKey(d))!.push({ kind: 'override', data: o });
        }
      });
    });

    return map;
  }, [weekDates, shifts, overrides]);

  const totalHours = useMemo(
    () => shifts.filter((s) => s.isActive).reduce((sum, s) => sum + formatHours(s.startTime, s.endTime), 0),
    [shifts],
  );

  const weekLabel = `${MONTH_LABELS[weekDates[0].getMonth()]} ${weekDates[0].getDate()} – ${MONTH_LABELS[weekDates[6].getMonth()]} ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`;
  const today = toDateKey(new Date());

  const handleDelete = async () => {
    if (!selectedEntry) return;
    if (selectedEntry.kind === 'shift') {
      await taskStore.deleteShift(selectedEntry.data.id);
    } else {
      await taskStore.cancelOverride(selectedEntry.data.id);
    }
    setSelectedEntry(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team Schedule & Shifts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage recurring shifts, one-off coverage, and leave across the workspace.
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs" disabled={teamMembers.length === 0}>
              <Plus className="h-4 w-4" />
              <span>Schedule Entry</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Schedule Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEntry} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryKind('recurring')}
                  className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    entryKind === 'recurring' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-input text-muted-foreground'
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5" /> Recurring Shift
                </button>
                <button
                  type="button"
                  onClick={() => setEntryKind('oneoff')}
                  className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    entryKind === 'oneoff' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-input text-muted-foreground'
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" /> One-off / Leave
                </button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Team Member</Label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {entryKind === 'recurring' ? (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Day of Week</Label>
                  <select
                    value={dayIndex}
                    onChange={(e) => setDayIndex(Number(e.target.value))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {weekDates.map((d, i) => (
                      <option key={i} value={i}>
                        {DAY_LABELS[i]} ({MONTH_LABELS[d.getMonth()]} {d.getDate()}) · repeats weekly
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type</Label>
                    <select
                      value={overrideType}
                      onChange={(e) => setOverrideType(e.target.value as ScheduleOverrideType)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="WORKING">Extra Shift</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="LEAVE">Leave / Time Off</option>
                      <option value="BLACKOUT">Blackout</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-xs" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">End Time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-xs" required />
                </div>
              </div>

              {entryKind === 'oneoff' && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reason (optional)</Label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Doctor's appointment" className="text-xs" />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs" disabled={isSubmitting || !memberId}>
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Entry'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {scheduleError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to load live schedule data: {scheduleError}</span>
        </div>
      )}

      {/* Week Controls & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Active Shifts</div>
            <div className="text-xl font-bold text-foreground">{shifts.filter((s) => s.isActive).length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Weekly Shift Hours</div>
            <div className="text-xl font-bold text-foreground">{totalHours.toFixed(1)} Hours</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Assigned Team</div>
            <div className="text-xl font-bold text-foreground">{teamMembers.length} Members</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">
              {weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? 'Upcoming Week' : 'Previous Week'}
            </div>
            <div className="text-sm font-bold text-foreground">{weekLabel}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setWeekOffset(0)}>
                Today
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {teamMembers.length === 0 && !isScheduleLoading && (
        <Card className="p-8 text-center">
          <p className="text-xs text-muted-foreground">
            No team members found yet. Add members to your workspace to start scheduling shifts.
          </p>
        </Card>
      )}

      {/* Weekly Schedule Grid */}
      {isScheduleLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading schedule…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDates.map((d, i) => {
            const key = toDateKey(d);
            const dayEntries = entriesByDay.get(key) || [];
            const isToday = key === today;

            return (
              <Card key={key} className={`p-3 min-h-[360px] flex flex-col gap-2 ${isToday ? 'ring-2 ring-indigo-500/30 bg-indigo-50/10' : ''}`}>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <Badge variant={isToday ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                    {MONTH_LABELS[d.getMonth()]} {d.getDate()}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pt-1">
                  {dayEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground italic text-center py-8">
                      No entries scheduled
                    </div>
                  ) : (
                    dayEntries.map((entry) => {
                      const isShift = entry.kind === 'shift';
                      const data: any = entry.data;
                      return (
                        <div
                          key={`${entry.kind}-${data.id}`}
                          onClick={() => setSelectedEntry(entry)}
                          className="p-2.5 rounded-lg border border-border bg-card hover:border-indigo-500/50 hover:shadow-xs transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-xs text-foreground leading-tight line-clamp-2">
                              {data.memberName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 uppercase shrink-0 ${
                                isShift ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : OVERRIDE_STYLES[data.type as ScheduleOverrideType]
                              }`}
                            >
                              {isShift ? 'Shift' : OVERRIDE_LABELS[data.type as ScheduleOverrideType]}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              {isShift
                                ? `${data.startTime} - ${data.endTime}`
                                : `${new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[90px]">
                              {isShift ? 'Recurring weekly' : data.reason || '—'}
                            </span>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={data.memberAvatar} />
                              <AvatarFallback className="text-[9px]">
                                {data.memberName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-[10px]">
                  {selectedEntry.kind === 'shift' ? 'Recurring Shift' : OVERRIDE_LABELS[selectedEntry.data.type]}
                </Badge>
                <DialogTitle className="text-base font-bold">{selectedEntry.data.memberName}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedEntry.data.memberAvatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {selectedEntry.data.memberName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedEntry.data.memberName}</div>
                  <div className="text-muted-foreground text-[11px]">
                    {selectedEntry.kind === 'shift' ? `Repeats every ${DAY_LABELS[(selectedEntry.data.dayOfWeek + 6) % 7]}` : 'One-off schedule entry'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Time Slot</div>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  {selectedEntry.kind === 'shift' ? (
                    <span>{selectedEntry.data.startTime} – {selectedEntry.data.endTime}</span>
                  ) : (
                    <span>
                      {new Date(selectedEntry.data.startTime).toLocaleString()} – {new Date(selectedEntry.data.endTime).toLocaleString()}
                    </span>
                  )}
                </div>
                {selectedEntry.kind === 'override' && selectedEntry.data.reason && (
                  <div className="text-muted-foreground pt-1">{selectedEntry.data.reason}</div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="destructive" className="text-xs gap-1.5" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                {selectedEntry.kind === 'shift' ? 'Remove Shift' : 'Cancel Entry'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedEntry(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
