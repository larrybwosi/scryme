import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';

export default function ActivityPage() {
  const activities = [
    {
      id: 'act-1',
      user: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      action: 'completed task',
      target: 'Fix SSL certificate auto-renewal issue on staging',
      timestamp: '10 minutes ago',
      type: 'COMPLETED',
    },
    {
      id: 'act-2',
      user: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      action: 'created new project',
      target: 'Mobile App Redesign v2',
      timestamp: '45 minutes ago',
      type: 'CREATED',
    },
    {
      id: 'act-3',
      user: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      action: 'added comment to',
      target: 'Implement OAuth2 PKCE Flow for Mobile App',
      timestamp: '2 hours ago',
      type: 'COMMENT',
    },
    {
      id: 'act-4',
      user: 'Rachel Adams',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      action: 'updated status on',
      target: 'Database Migration to Postgres 17',
      timestamp: '4 hours ago',
      type: 'UPDATED',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Workspace Activity Stream
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Audit log and live updates across tasks, projects, and team members.
        </p>
      </div>

      {/* Activity Timeline Card */}
      <Card className="p-0 overflow-hidden border-border">
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-foreground">Recent Activity Logs</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {activities.length} Recent Events
          </Badge>
        </div>

        <div className="divide-y divide-border">
          {activities.map((act) => (
            <div key={act.id} className="p-4 flex items-start gap-3.5 hover:bg-muted/30 transition-colors text-xs">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={act.avatar} />
                <AvatarFallback className="text-xs font-bold">
                  {act.user.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="text-foreground leading-tight">
                  <span className="font-bold">{act.user}</span>{' '}
                  <span className="text-muted-foreground">{act.action}</span>{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{act.target}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{act.timestamp}</span>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[9px] uppercase shrink-0 ${
                  act.type === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : act.type === 'CREATED'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {act.type}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
