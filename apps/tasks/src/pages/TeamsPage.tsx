import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Plus, Mail, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function TeamsPage() {
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Product Designer');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    taskStore.addTeamMember({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@snazzy.studio`,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      department: 'Engineering',
      assignedTasksCount: 2,
      completedTasksCount: 5,
      weeklyCapacityHours: 40,
      loggedHoursThisWeek: 20,
      status: 'ONLINE'
    });
    setName('');
    setEmail('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team Members
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization members, roles, and resource workload allocation.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Member</span>
        </Button>
      </div>

      {/* Add Member Form */}
      {isAdding && (
        <Card className="p-5 shadow-xs border-border bg-muted/20">
          <form onSubmit={handleAddMember} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Invite New Team Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                type="text"
                required
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
              <Input
                type="text"
                placeholder="Role (e.g. Frontend Engineer)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Save Member
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="p-5 border-border shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground truncate">{member.name}</h3>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {member.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{member.role}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Capacity</span>
                <span className="font-bold text-foreground">{member.loggedHoursThisWeek} / {member.weeklyCapacityHours} hrs</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assigned Tasks</span>
                <span className="font-bold text-foreground">{member.assignedTasksCount} tasks</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
