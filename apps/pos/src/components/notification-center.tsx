'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  Package,
  ShoppingCart,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { notificationService, type AppNotification, type NotificationType } from '@/lib/notification-service';
import { listen } from '@tauri-apps/api/event';
import { isToday, isYesterday, parseISO, format } from 'date-fns';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNotifications();

    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });

    const badgeListener = listen<number>('notification-badge-update', event => {
      setUnreadCount(event.payload);
    });

    return () => {
      unsubscribe();
      badgeListener.then(unlisten => unlisten());
    };
  }, []);

  const loadNotifications = async () => {
    const history = await notificationService.getHistory();
    setNotifications(history);
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const markAsRead = async (id: string) => {
    await notificationService.markRead(id);
    loadNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllRead();
    loadNotifications();
  };

  const deleteNotification = async (id: string) => {
    await notificationService.delete(id);
    loadNotifications();
  };

  const clearAll = async () => {
    await notificationService.clearAll();
    loadNotifications();
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.body.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'unread' && !notification.read) ||
        (activeTab === 'sales' && notification.notificationType === 'sale') ||
        (activeTab === 'alerts' && ['warning', 'error'].includes(notification.notificationType));

      return matchesSearch && matchesTab;
    });
  }, [notifications, searchQuery, activeTab]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredNotifications.forEach(notification => {
      const date = parseISO(notification.timestamp);
      if (isToday(date)) {
        groups['Today'].push(notification);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(notification);
      } else {
        groups['Earlier'].push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = 'h-3.5 w-3.5';
    switch (type) {
      case 'sale':
        return <ShoppingCart className={cn(iconClass, 'text-blue-500')} />;
      case 'sync':
        return <Package className={cn(iconClass, 'text-violet-500')} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, 'text-amber-500')} />;
      case 'error':
        return <XCircle className={cn(iconClass, 'text-red-500')} />;
      case 'success':
        return <CheckCircle className={cn(iconClass, 'text-emerald-500')} />;
      case 'system':
        return <AlertCircle className={cn(iconClass, 'text-slate-400')} />;
      default:
        return <Info className={cn(iconClass, 'text-blue-400')} />;
    }
  };

  const getIconContainerClass = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 ring-1 ring-red-100 dark:ring-red-900/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-100 dark:ring-amber-900/30';
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-100 dark:ring-emerald-900/30';
      case 'sale':
        return 'bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-100 dark:ring-blue-900/30';
      case 'sync':
        return 'bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-100 dark:ring-violet-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-900/50 ring-1 ring-slate-100 dark:ring-slate-800/50';
    }
  };

  const getUnreadIndicatorClass = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'success':
        return 'bg-emerald-500';
      case 'sale':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    return format(date, 'h:mm a');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl sm:max-w-3xl h-[72vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg shadow-2xl border-border/60">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight leading-none">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="default" className="ml-2 h-5 px-1.5 text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Sales, alerts, and system updates
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-destructive gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3 mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
              <TabsList className="h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="all" className="h-7 px-3 text-xs font-medium">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="h-7 px-3 text-xs font-medium">
                  Unread
                </TabsTrigger>
                <TabsTrigger value="sales" className="h-7 px-3 text-xs font-medium">
                  Sales
                </TabsTrigger>
                <TabsTrigger value="alerts" className="h-7 px-3 text-xs font-medium">
                  Alerts
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="h-8 pl-8 text-xs bg-muted/40 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 opacity-30" />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : "You're all caught up"}
              </p>
              {(searchQuery || activeTab !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  className="mt-2 h-auto p-0 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedNotifications).map(([group, groupNotifications]) =>
                groupNotifications.length > 0 ? (
                  <div key={group}>
                    {/* Group Label */}
                    <div className="flex items-center gap-2 px-6 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                        {group}
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>

                    {/* Notification Items */}
                    {groupNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div
                          className={cn(
                            'group relative flex items-start gap-3 px-6 py-3 cursor-pointer transition-colors duration-150',
                            !notification.read ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-muted/40'
                          )}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <span
                              className={cn(
                                'absolute left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full',
                                getUnreadIndicatorClass(notification.notificationType)
                              )}
                            />
                          )}

                          {/* Icon */}
                          <div
                            className={cn(
                              'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center mt-0.5',
                              getIconContainerClass(notification.notificationType)
                            )}
                          >
                            {getNotificationIcon(notification.notificationType)}
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    'text-sm leading-snug truncate',
                                    !notification.read
                                      ? 'font-semibold text-foreground'
                                      : 'font-medium text-foreground/80'
                                  )}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-1">
                                  {notification.body}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums whitespace-nowrap">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                                  onClick={e => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-3 mt-2 text-xs font-medium rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                                onClick={e => {
                                  e.stopPropagation();
                                  console.log('Action clicked:', notification.action);
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                        {index < groupNotifications.length - 1 && <Separator className="mx-6 w-auto opacity-40" />}
                      </div>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-border/40 bg-muted/20 shrink-0">
          <p className="text-[11px] text-muted-foreground/60 text-center">
            {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
