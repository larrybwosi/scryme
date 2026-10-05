import React, { useState } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

export default function TimeOffPage() {
  const [requests, setRequests] = useState([
    {
      id: 'pto-1',
      memberName: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      type: 'Paid Time Off',
      dates: 'Mar 24 - Mar 28, 2025',
      days: 5,
      status: 'APPROVED',
    },
    {
      id: 'pto-2',
      memberName: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      type: 'Sick Leave',
      dates: 'Apr 02 - Apr 03, 2025',
      days: 2,
      status: 'PENDING',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('Paid Time Off');
  const [startDate, setStartDate] = useState('2025-04-10');
  const [endDate, setEndDate] = useState('2025-04-12');

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq = {
      id: `pto-${Date.now()}`,
      memberName: 'Current User',
      avatar: '',
      type,
      dates: `${startDate} - ${endDate}`,
      days: 3,
      status: 'PENDING',
    };

    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
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
            <Button className="gap-2 text-xs shadow-xs">
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
                <Label className="text-xs font-semibold">Leave Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
                <Button type="submit" className="text-xs">
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table Card */}
      <Card className="p-0 overflow-hidden border-border">
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-foreground">Scheduled Leave Requests</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {requests.length} Total Requests
          </Badge>
        </div>

        <div className="divide-y divide-border">
          {requests.map((req) => (
            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={req.avatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {req.memberName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="font-bold text-foreground">{req.memberName}</div>
                  <div className="text-[11px] text-muted-foreground">{req.type} • {req.dates}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px]">
                  {req.days} {req.days === 1 ? 'Day' : 'Days'}
                </Badge>

                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {req.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
