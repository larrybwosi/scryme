import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Label } from '@repo/ui/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/ui/tooltip';
import {
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  User,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  Copy,
  ClipboardList,
  Tag,
  Printer
} from 'lucide-react';
import { BatchStatus, FormattedBatch } from '@/types/bakery';
import { useFormattedCurrency } from '@/lib/utils';

interface BatchCardProps {
  batch: FormattedBatch;
  onStart: (id: string) => void;
  onComplete: (batch: FormattedBatch) => void;
  onCancel: (id: string) => void;
  onView: (batch: FormattedBatch) => void;
  onEdit: (batch: FormattedBatch) => void;
  onDuplicate: (id: string) => void;
  onPrint: (batch: FormattedBatch) => void;
  onSaveTemplate: (batch: FormattedBatch) => void;
  isStarting: boolean;
  isCompleting: boolean;
  isCancelling: boolean;
  isDuplicating: boolean;
}

export const getStatusColor = (status: BatchStatus): string => {
  switch (status) {
    case BatchStatus.PLANNED:
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case BatchStatus.IN_PROGRESS:
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    case BatchStatus.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    case BatchStatus.CANCELLED:
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getStatusIcon = (status: BatchStatus) => {
  switch (status) {
    case BatchStatus.PLANNED:
      return <Calendar className="h-3.5 w-3.5" />;
    case BatchStatus.IN_PROGRESS:
      return <Play className="h-3.5 w-3.5" />;
    case BatchStatus.COMPLETED:
      return <CheckCircle className="h-3.5 w-3.5" />;
    case BatchStatus.CANCELLED:
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
};

export function BatchCard({
  batch,
  onStart,
  onComplete,
  onCancel,
  onView,
  onEdit,
  onDuplicate,
  onPrint,
  onSaveTemplate,
  isStarting,
  isCompleting,
  isCancelling,
  isDuplicating
}: BatchCardProps) {
  const formattedCurrency = useFormattedCurrency();

  const formatDate = (date: Date) => new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-border/40 hover:border-primary/30 bg-card/40 backdrop-blur-md flex flex-col h-full rounded-2xl">
      {/* Quick Actions Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-xl"
          onClick={() => onDuplicate(batch.id)}
          disabled={isDuplicating}
          title="Duplicate Batch"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-xl"
          onClick={() => onSaveTemplate(batch)}
          title="Save as Template"
        >
          <ClipboardList className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-xl"
          onClick={() => onPrint(batch)}
          title="Print Label"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-5 pt-7 px-7">
        <div className="flex justify-between items-start pr-10">
          <div className="space-y-2">
            <CardTitle className="text-xl flex items-center gap-2 font-bold tracking-tight text-foreground/90">
              {batch.name}
              {batch.calculationError && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cost calculation incomplete</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] bg-primary/5 text-primary/70 font-bold px-2 py-0.5 rounded-full border border-primary/10 tracking-widest uppercase">
                {batch.batchNumber}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-tight">{batch.recipe.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Badge className={`border flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${getStatusColor(batch.status)}`} variant="outline">
            {getStatusIcon(batch.status)}
            <span className="leading-none">{(batch.status || '').replace('_', ' ')}</span>
          </Badge>
        </div>
        {batch.tags && batch.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {batch.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 bg-muted/60 text-muted-foreground/80 font-bold uppercase tracking-tighter border-none rounded-md">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 px-7 pb-7 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 border border-border/20">
            <Label className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-[0.1em] cursor-default">Target</Label>
            <div className="font-bold text-sm text-foreground/80">
              {batch.plannedQuantity} <span className="text-[10px] opacity-60 lowercase font-medium">{batch.unit.symbol}</span>
            </div>
          </div>
          <div className="bg-muted/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 border border-border/20">
            <Label className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-[0.1em] cursor-default">Window</Label>
            <div className="font-bold text-sm text-foreground/80">
              {formatDate(batch.scheduledStartAt)}
            </div>
          </div>
          <div className="bg-muted/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 border border-border/20">
            <Label className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-[0.1em] cursor-default">Operator</Label>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-foreground/80">
                <span className="truncate max-w-[60px]">{batch.baker?.split(' ')[0] || '-'}</span>
              </div>
              {batch.assistantBakers && batch.assistantBakers.length > 0 && (
                <span className="text-[10px] text-muted-foreground/40 font-bold">
                  +{batch.assistantBakers.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 gap-4">
          <div className="flex gap-2 flex-1">
            {batch.status === BatchStatus.PLANNED && (
              <Button
                size="lg"
                onClick={() => onStart(batch.id)}
                disabled={isStarting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 font-bold text-xs uppercase tracking-widest h-11 rounded-xl"
              >
                <Play className="h-3.5 w-3.5 mr-2" />
                {isStarting ? 'Starting' : 'Initialize'}
              </Button>
            )}
            {batch.status === BatchStatus.IN_PROGRESS && (
              <Button
                size="lg"
                onClick={() => onComplete(batch)}
                disabled={isCompleting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-bold text-xs uppercase tracking-widest h-11 rounded-xl"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-2" />
                {isCompleting ? 'Finalizing' : 'Complete'}
              </Button>
            )}
            {(batch.status === BatchStatus.COMPLETED || batch.status === BatchStatus.CANCELLED) && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-dashed text-muted-foreground/50 cursor-default h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-muted/5"
                disabled
              >
                {batch.status === BatchStatus.COMPLETED ? 'Batch Archive' : 'Terminated'}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onView(batch)} className="h-10 w-10 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors">
                    <Eye className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Full Specs</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(batch.status === BatchStatus.PLANNED || batch.status === BatchStatus.IN_PROGRESS) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(batch)} className="h-10 w-10 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors">
                        <Edit className="h-4.5 w-4.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Parameters</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                        onClick={() => onCancel(batch.id)}
                        disabled={isCancelling}
                      >
                        <XCircle className="h-4.5 w-4.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Terminate Run</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}