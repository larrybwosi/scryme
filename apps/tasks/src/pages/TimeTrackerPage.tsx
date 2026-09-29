import React, { useEffect, useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Play, Square } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function TimeTrackerPage() {
  const { timeEntries, activeTimer } = useTaskStore();
  const [descriptionInput, setDescriptionInput] = useState(activeTimer.description);
  const [selectedProject, setSelectedProject] = useState(activeTimer.project || 'AI-Powered Learning Platform');

  // Timer ticker hook
  useEffect(() => {
    let interval: any = null;
    if (activeTimer.isRunning) {
      interval = setInterval(() => {
        taskStore.updateTimerElapsed(activeTimer.elapsedSeconds + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer.isRunning, activeTimer.elapsedSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (activeTimer.isRunning) {
      taskStore.stopAndSaveTimer();
    } else {
      taskStore.startTimer(descriptionInput, selectedProject);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Time Tracker
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track billable hours, monitor active timers, and review productivity logs.
        </p>
      </div>

      {/* Active Timer Card */}
      <Card className="p-5 shadow-xs border-border bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
            <Input
              type="text"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="What are you working on right now?"
              className="text-xs h-10 flex-1"
            />

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full sm:w-56 bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="AI-Powered Learning Platform">AI-Powered Learning Platform</option>
              <option value="Mobile App Redesign">Mobile App Redesign</option>
              <option value="Client Portal Integration">Client Portal Integration</option>
            </select>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="font-mono text-2xl font-bold text-foreground">
              {formatTimer(activeTimer.elapsedSeconds)}
            </span>

            <Button
              onClick={handleToggleTimer}
              variant={activeTimer.isRunning ? 'destructive' : 'default'}
              className="gap-2 h-10 text-xs px-5 shadow-xs"
            >
              {activeTimer.isRunning ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Timer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Time Entries Table / List */}
      <Card className="p-0 overflow-hidden shadow-xs border-border">
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Logged Entries</h2>
          <Badge variant="secondary" className="text-xs">
            {timeEntries.length} entries
          </Badge>
        </div>

        <div className="divide-y divide-border">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">{entry.description}</div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{entry.project}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono font-bold text-foreground">
                    {formatTimer(entry.duration)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{entry.startTime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
