import React, { useEffect, useMemo, useState } from 'react';
import { CalendarOff, Plus, Loader2, AlertCircle, X } from 'lucide-react';
import { useTaskStore, taskStore } from '../lib/store';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

function toLocalDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function TimeOffPage() {
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const overrides = useTaskStore((state) => state.overrides);
  const isLoading = useTaskStore((state) => state.isScheduleLoading);
  const error = useTaskStore((state) => state.scheduleError);

  const leaveRequests = useMemo(
    () => overrides.filter((o) => o.type === 'LEAVE').sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [overrides],
  );

  const rangeStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);
  const rangeEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d;
  }, []);

  useEffect(() => {
    taskStore.fetchSchedule(rangeStart, rangeEnd);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [reasonLabel, setReasonLabel] = useState('Paid Time Off');
  const [startDate, setStartDate] = useState(toLocalDateInput(new Date()));
  const [endDate, setEndDate] = useState(toLocalDateInput(new Date()));

  useEffect(() => {
    if (!memberId && teamMembers.length > 0) {
      setMemberId(teamMembers[0].id);
    }
  }, [teamMembers, memberId]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    setIsSubmitting(true);
    try {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
      await taskStore.requestTimeOff({
        memberId,
        type: 'LEAVE',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: reasonLabel,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('[v0] Failed to submit time off request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    await taskStore.cancelOverride(id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team Time Off & Leave
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track upcoming team vacations, sick leave, and PTO requests.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs" disabled={teamMembers.length === 0}>
              <Plus className="h-4 w-4" />
              <span>Request Time Off</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Team Member</Label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Leave Type</Label>
                <select
                  value={reasonLabel}
                  onChange={(e) => setReasonLabel(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Paid Time Off">Paid Time Off (PTO)</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Parental Leave">Parental Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs" disabled={isSubmitting || !memberId}>
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to load live leave data: {error}</span>
        </div>
      )}

      {/* Requests Table Card */}
      <Card className="p-0 overflow-hidden border-border">
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-foreground">Scheduled Leave Requests</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leaveRequests.length} Total Requests
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading leave requests…</span>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground italic">
            No leave requests scheduled in this period.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaveRequests.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={req.memberAvatar} />
                    <AvatarFallback className="text-xs font-bold">
                      {req.memberName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="font-bold text-foreground">{req.memberName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {req.reason || 'Leave'} • {new Date(req.startTime).toLocaleDateString()} - {new Date(req.endTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {daysBetween(req.startTime, req.endTime)} {daysBetween(req.startTime, req.endTime) === 1 ? 'Day' : 'Days'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                    title="Cancel request"
                    onClick={() => handleCancel(req.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
