import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function TimeOffPage() {
  const { timeOffRequests, teamMembers } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);
  const [memberId, setMemberId] = useState(teamMembers[0]?.id || 'm-1');
  const [type, setType] = useState<'VACATION' | 'SICK_LEAVE' | 'PERSONAL'>('VACATION');
  const [startDate, setStartDate] = useState('2024-03-20');
  const [endDate, setEndDate] = useState('2024-03-22');
  const [reason, setReason] = useState('');

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = teamMembers.find((m) => m.id === memberId);
    taskStore.addTimeOff({
      memberId,
      memberName: selectedMember ? selectedMember.name : 'Sarah Jenkins',
      memberAvatar: selectedMember?.avatar,
      type,
      startDate,
      endDate,
      daysCount: 3,
      status: 'PENDING',
      reason: reason.trim() || 'Scheduled leave'
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Time Off & Leave Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track team leave schedules, vacation balance, and project availability.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Request Leave</span>
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 border-border bg-muted/20">
          <form onSubmit={handleAddRequest} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Submit Leave Request</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="VACATION">Vacation</option>
                <option value="SICK_LEAVE">Sick Leave</option>
                <option value="PERSONAL">Personal Leave</option>
              </select>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason / Notes"
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Submit Request
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {timeOffRequests.map((req) => (
          <Card key={req.id} className="p-4 border-border shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              {req.memberAvatar && (
                <img src={req.memberAvatar} alt={req.memberName} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <h3 className="font-bold text-sm text-foreground">{req.memberName}</h3>
                <div className="text-xs text-muted-foreground">
                  {req.type} • {req.startDate} to {req.endDate} ({req.daysCount} days)
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}
            >
              {req.status}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
