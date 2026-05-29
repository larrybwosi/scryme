'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  History,
  RefreshCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuditEvent {
  id: string;
  timestamp: string;
  level: 'Info' | 'Warning' | 'Critical';
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  location_id: string | null;
  device_id: string | null;
  details: any;
}

export default function LogsTab() {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [systemLogs, setSystemLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await invoke<AuditEvent[]>('get_audit_logs', {
        action: actionFilter || null,
        level: levelFilter === 'ALL' ? null : levelFilter,
        limit: pageSize,
        offset: page * pageSize,
      });
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, levelFilter, page]);

  const fetchSystemLogs = useCallback(async () => {
    try {
      const logs = await invoke<string>('get_system_logs', { lines: 500 });
      setSystemLogs(logs);
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      toast.error('Failed to load system logs');
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchSystemLogs();
  }, [fetchSystemLogs]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Critical
          </Badge>
        );
      case 'Warning':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 gap-1 font-bold">
            <AlertTriangle className="h-3 w-3" /> Warning
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 gap-1">
            <Info className="h-3 w-3" /> Info
          </Badge>
        );
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };

  return (
    <TabsContent value="logs" className="space-y-6 focus-visible:outline-none">
      <Tabs defaultValue="audit" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" /> Audit Trails
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <FileText className="h-4 w-4" /> System Logs
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAuditLogs();
                fetchSystemLogs();
              }}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        <TabsContent value="audit" className="space-y-4">
          <Card className="p-4 border-muted/60">
            <div className="flex flex-wrap gap-4 items-end mb-6">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="action-filter">Action</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="action-filter"
                    placeholder="Filter by action (e.g. SALE_PROCESSED)..."
                    className="pl-9"
                    value={actionFilter}
                    onChange={e => {
                      setActionFilter(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 w-[150px]">
                <Label htmlFor="level-filter">Level</Label>
                <Select
                  value={levelFilter}
                  onValueChange={v => {
                    setLevelFilter(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="level-filter">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium">Level</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                      <th className="px-4 py-3 text-left font-medium">Actor</th>
                      <th className="px-4 py-3 text-left font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          {loading ? 'Loading logs...' : 'No audit events found matched your filters.'}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap">
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{getLevelBadge(log.level)}</td>
                          <td className="px-4 py-3 font-semibold text-primary">{log.action}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{log.actor_name || 'System'}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {log.actor_id || 'ID: N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[300px]">
                            <ScrollArea className="h-10 w-full rounded py-1 px-2 bg-muted/20 hover:h-auto min-h-[40px]">
                              <pre className="text-[10px] text-muted-foreground">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </ScrollArea>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">Showing {auditLogs.length} events</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || loading}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <span className="text-sm font-medium">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditLogs.length < pageSize || loading}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="p-4 border-muted/60 bg-zinc-950 text-zinc-50 font-mono shadow-inner overflow-hidden">
            <div className="flex items-center justify-between mb-4 text-zinc-400 text-xs border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Tail -n 500 (Live stream representation)</span>
              </div>
              <span>UTF-8 Encoding</span>
            </div>
            <ScrollArea className="h-[600px] w-full">
              {systemLogs ? (
                <pre className="text-[12px] leading-relaxed select-all">{systemLogs}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 italic">
                  No system logs available for the last session.
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
}
