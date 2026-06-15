"use client";

import React, { useState } from 'react';
import { Activity, Circle, Clock, CheckCircle2, Mail, Phone, StickyNote, UserPlus, TrendingUp, Plus, X, Video, Users } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from "@/lib/utils";
import { createActivity } from '@/app/actions/activities';
import { toast } from 'sonner';

interface ActivitiesTabProps {
  customer: any;
}

const ACTIVITY_ICONS: Record<string, any> = {
  CREATION: UserPlus,
  UPDATE: Activity,
  EMAIL: Mail,
  CALL: Phone,
  NOTE: StickyNote,
  DEAL_MOVE: TrendingUp,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CREATION: 'text-blue-600 bg-blue-50',
  UPDATE: 'text-amber-600 bg-amber-50',
  EMAIL: 'text-purple-600 bg-purple-50',
  CALL: 'text-green-600 bg-green-50',
  NOTE: 'text-orange-600 bg-orange-50',
  DEAL_MOVE: 'text-indigo-600 bg-indigo-50',
};

export function ActivitiesTab({ customer }: ActivitiesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('CALL');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const activities = customer.crmRecord?.activities || [];

  const handleAdd = async () => {
    if (!description.trim() || !customer.crmRecordId) return;

    setLoading(true);
    try {
      await createActivity({
        type,
        description: description.trim(),
        recordId: customer.crmRecordId,
      }, customer.organizationId);

      toast.success('Activity logged');
      setDescription('');
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Activity Timeline</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            History of all interactions and updates
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg border transition-colors',
            showForm
              ? 'bg-muted text-muted-foreground border-border'
              : 'bg-primary text-white border-primary hover:bg-primary/90'
          )}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Log Activity'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-card border border-primary/30 rounded-xl p-5 shadow-sm">
           <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'CALL', icon: Phone, label: 'Call' },
                { id: 'EMAIL', icon: Mail, label: 'Email' },
                { id: 'MEETING', icon: Users, label: 'Meeting' },
                { id: 'VIDEO', icon: Video, label: 'Video' },
                { id: 'NOTE', icon: StickyNote, label: 'Note' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border",
                    type === t.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
           </div>
           <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the interaction…"
              rows={3}
              className="w-full bg-background border border-border rounded-lg p-3 text-[13.5px] text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-none"
           />
           <div className="flex justify-end mt-3">
              <button
                onClick={handleAdd}
                disabled={loading || !description.trim()}
                className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Activity'}
              </button>
           </div>
        </div>
      )}

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          description="Activity will appear here as you interact with this customer."
        />
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
          {activities.map((activity: any, idx: number) => {
            const Icon = ACTIVITY_ICONS[activity.type] || Activity;
            const colorClass = ACTIVITY_COLORS[activity.type] || 'text-muted-foreground bg-muted';

            return (
              <div key={activity.id} className="relative flex items-start gap-4">
                <div className={cn(
                  "relative z-10 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center flex-shrink-0 shadow-sm",
                  colorClass
                )}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[13.5px] font-semibold text-foreground">
                      {activity.description}
                    </p>
                    <time className="text-[11.5px] text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.createdAt)}
                    </time>
                  </div>
                  {activity.member && (
                    <p className="text-[12px] text-muted-foreground">
                      by <span className="font-medium text-foreground">{activity.member.user?.name || activity.member.email}</span>
                    </p>
                  )}
                  {activity.metadata && (
                    <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border/50">
                        {/* We could render detailed changes here */}
                        <pre className="text-[11px] text-muted-foreground overflow-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
