import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Calendar as CalendarIcon, Clock, Plus, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';

interface ShiftEvent {
  id: string;
  title: string;
  assigneeName: string;
  assigneeAvatar?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  type: 'SHIFT' | 'EVENT' | 'MILESTONE';
}

export default function SchedulePage() {
  const teamMembers = useTaskStore((state) => state.teamMembers);

  const [shifts, setShifts] = useState<ShiftEvent[]>([
    {
      id: 'shift-1',
      title: 'Morning Development Shift',
      assigneeName: 'Sarah Jenkins',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      date: '2025-03-10',
      startTime: '09:00',
      endTime: '13:00',
      location: 'Main HQ / Remote',
      type: 'SHIFT',
    },
    {
      id: 'shift-2',
      title: 'Sprint Planning & Architecture Sync',
      assigneeName: 'Alex Rivera',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      date: '2025-03-10',
      startTime: '14:00',
      endTime: '16:00',
      location: 'Conference Room B',
      type: 'EVENT',
    },
    {
      id: 'shift-3',
      title: 'QA & Staging Release Deployment',
      assigneeName: 'Michael Chen',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      date: '2025-03-11',
      startTime: '10:00',
      endTime: '15:00',
      location: 'DevOps Lab',
      type: 'MILESTONE',
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [assigneeName, setAssigneeName] = useState(teamMembers[0]?.name || 'Sarah Jenkins');
  const [date, setDate] = useState('2025-03-10');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [location, setLocation] = useState('Office HQ');
  const [type, setType] = useState<'SHIFT' | 'EVENT' | 'MILESTONE'>('SHIFT');

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newShift: ShiftEvent = {
      id: `shift-${Date.now()}`,
      title,
      assigneeName,
      date,
      startTime,
      endTime,
      location,
      type,
    };

    setShifts([newShift, ...shifts]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDate('2025-03-10');
    setStartTime('09:00');
    setEndTime('17:00');
    setLocation('Office HQ');
    setType('SHIFT');
  };

  const daysOfWeek = [
    { day: 'Mon', date: 'Mar 10', fullDate: '2025-03-10' },
    { day: 'Tue', date: 'Mar 11', fullDate: '2025-03-11' },
    { day: 'Wed', date: 'Mar 12', fullDate: '2025-03-12' },
    { day: 'Thu', date: 'Mar 13', fullDate: '2025-03-13' },
    { day: 'Fri', date: 'Mar 14', fullDate: '2025-03-14' },
    { day: 'Sat', date: 'Mar 15', fullDate: '2025-03-15' },
    { day: 'Sun', date: 'Mar 16', fullDate: '2025-03-16' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team Schedule & Shifts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organize team shifts, meetings, and key release milestones across the workspace.
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Schedule Event / Shift</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Schedule Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateShift} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Title / Subject</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Backend On-Call Shift"
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Assignee</Label>
                  <select
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="Alex Rivera">Alex Rivera</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Type</Label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="SHIFT">Shift</option>
                    <option value="EVENT">Event / Sync</option>
                    <option value="MILESTONE">Milestone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location / Link</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Office B / Remote Google Meet"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Save Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Controls & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Scheduled Shifts</div>
            <div className="text-xl font-bold text-foreground">{shifts.length} Active</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Total Shift Hours</div>
            <div className="text-xl font-bold text-foreground">38.5 Hours</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Assigned Team</div>
            <div className="text-xl font-bold text-foreground">{teamMembers.length} Members</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Current Week</div>
            <div className="text-sm font-bold text-foreground">March 10 – March 16</div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((d) => {
          const dayShifts = shifts.filter((s) => s.date === d.fullDate);
          const isToday = d.fullDate === '2025-03-10';

          return (
            <Card key={d.fullDate} className={`p-3 min-h-[360px] flex flex-col gap-2 ${isToday ? 'ring-2 ring-indigo-500/30 bg-indigo-50/10' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
                  {d.day}
                </span>
                <Badge variant={isToday ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                  {d.date}
                </Badge>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pt-1">
                {dayShifts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground italic text-center py-8">
                    No shifts scheduled
                  </div>
                ) : (
                  dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className="p-2.5 rounded-lg border border-border bg-card hover:border-indigo-500/50 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground leading-tight line-clamp-2">
                          {shift.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 uppercase shrink-0 ${
                            shift.type === 'SHIFT'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : shift.type === 'EVENT'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {shift.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
                        <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[90px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{shift.location}</span>
                        </div>

                        <Avatar className="h-5 w-5">
                          <AvatarImage src={shift.assigneeAvatar} />
                          <AvatarFallback className="text-[9px]">
                            {shift.assigneeName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Shift Detail Modal */}
      {selectedShift && (
        <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-[10px]">
                  {selectedShift.type}
                </Badge>
                <DialogTitle className="text-base font-bold">{selectedShift.title}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedShift.assigneeAvatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {selectedShift.assigneeName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedShift.assigneeName}</div>
                  <div className="text-muted-foreground text-[11px]">Assigned Staff Member</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Time Slot</div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{selectedShift.startTime} – {selectedShift.endTime}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Location</div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{selectedShift.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                className="text-xs"
                onClick={() => {
                  setShifts(shifts.filter((s) => s.id !== selectedShift.id));
                  setSelectedShift(null);
                }}
              >
                Delete Entry
              </Button>
              <Button variant="outline" onClick={() => setSelectedShift(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
