'use client';

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import {
  RefreshCw,
  Download,
  AlertCircle,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@repo/ui/components/ui/badge';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  action: string;
  actor_name: string | null;
  details: any;
}

export default function LogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logs = await invoke<AuditEvent[]>('get_audit_logs', { limit: 100 });
      setAuditLogs(logs);
    } catch (error) {
      toast.error('Failed to fetch logs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const downloadLogs = () => {
    const content = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Monitor application activity and user action history.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.length === 0 && !isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No audit events found.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-lg border bg-white dark:bg-zinc-900 shadow-sm">
                  <div className={cn(
                    "mt-1 p-2 rounded-full h-fit",
                    log.level === 'CRITICAL' ? "bg-red-100 text-red-600" :
                    log.level === 'WARNING' ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {log.level === 'CRITICAL' ? <AlertCircle className="w-4 h-4" /> :
                     log.level === 'WARNING' ? <AlertCircle className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className="font-bold text-sm">{log.action}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.level}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.actor_name || 'System'}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-[10px] font-mono overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
