import { useKdsStore } from '@/store/kds-store';
import { Badge } from '@repo/ui/components/ui/badge';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

export function NetworkStatusBadge() {
  const status = useKdsStore(state => state.connectionStatus);
  const role = localStorage.getItem('DEVICE_ROLE');

  if (role === 'MAIN_HUB' && status === 'disconnected') {
    // Hub doesn't need to show disconnected unless it's supposed to be running
    // We could check HUB_WS_URL to see if it's supposed to be active
    const isSupposedToBeActive = !!localStorage.getItem('HUB_WS_URL');
    if (!isSupposedToBeActive) return null;
  }

  if (role !== 'MAIN_HUB' && role !== 'TABLET' && role !== 'KDS') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Hub Online',
          icon: <Wifi className="w-3 h-3" />,
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white'
        };
      case 'connecting':
        return {
          label: 'Connecting...',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          variant: 'outline' as const,
          className: 'text-blue-500 border-blue-200'
        };
      case 'error':
        return {
          label: 'Hub Error',
          icon: <AlertCircle className="w-3 h-3" />,
          variant: 'destructive' as const,
          className: ''
        };
      case 'disconnected':
      default:
        return {
          label: 'Hub Offline',
          icon: <WifiOff className="w-3 h-3" />,
          variant: 'secondary' as const,
          className: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={cn("gap-1.5 px-2 py-0.5 uppercase text-[10px] font-bold tracking-wider rounded-full cursor-help transition-all duration-300", config.className)}
          >
            {config.icon}
             {typeof config.label === "string" ? config.label : ""}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {status === 'connected' ? 'Successfully connected to the Local POS Hub.' :
             status === 'connecting' ? 'Attempting to establish connection with the Hub...' :
             status === 'error' ? 'A connection error occurred. Check your network.' :
             'Disconnected from the Hub. Orders will be queued locally.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
