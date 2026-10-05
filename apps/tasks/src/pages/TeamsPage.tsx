import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Mail, Shield, Plus } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

export default function TeamsPage() {
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Senior Software Engineer');

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newMember = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      assignedTasksCount: 0,
      completedTasksCount: 0,
      weeklyCapacityHours: 40,
      loggedHoursThisWeek: 0,
      status: 'ONLINE' as const,
    };

    useTaskStore.setState((state) => ({
      teamMembers: [...state.teamMembers, newMember],
    }));

    setIsInviteModalOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Team Workspace Roster
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization team members, assign workspace roles, and inspect active access.
          </p>
        </div>

        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Invite Team Member</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Invite Member to Workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteMember} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Role Title</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Product Designer / Backend Dev"
                  className="text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Member Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="p-4 hover:shadow-xs transition-shadow flex items-start gap-3.5">
            <Avatar className="h-11 w-11 border border-border shrink-0">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="text-xs font-bold">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs text-foreground truncate">{member.name}</h3>
                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                  {member.status || 'Active'}
                </Badge>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                <Shield className="h-3 w-3 text-indigo-500 shrink-0" />
                <span className="truncate">{member.role}</span>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate pt-1 border-t border-border/60">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{member.email || `${member.name.toLowerCase().replace(' ', '.')}@scryme.tech`}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
