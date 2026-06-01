import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog';
import { Badge } from '@repo/ui/components/ui/badge';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Plus, Edit, Eye, File, Clock, Layers, Copy, Rocket, Loader2, Search, Filter, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { CreateEditTemplate } from '@/components/bakery/CreateEditTemplate';
import { Separator } from '@repo/ui/components/ui/separator';
import { Sheet, SheetHeader, SheetTitle, SheetTrigger, SheetContent } from '@repo/ui/components/ui/sheet';
import { useDeleteTemplate, useTemplates, useDuplicateTemplate, useCreateBatchFromTemplate } from '@/hooks/bakery';
import { Template, TemplateSchedule } from '@/types/bakery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';

export default function TemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const { data: templates, isLoading: loadingTemplates, error } = useTemplates();
  const { mutateAsync: deleteTemplate } = useDeleteTemplate();
  const { mutate: duplicateTemplate, isPending: isDuplicating } = useDuplicateTemplate();
  const { mutate: createBatchFromTemplate, isPending: isCreatingBatch } = useCreateBatchFromTemplate();

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Delete this production template?')) {
      try {
        await deleteTemplate(templateId);
        toast.success('Template removed');
      } catch (error) {
        toast.error('Failed to remove template');
      }
    }
  };

  const handleDuplicate = (templateId: string) => {
    duplicateTemplate(templateId, {
      onSuccess: () => toast.success('Template duplicated'),
      onError: () => toast.error('Failed to duplicate'),
    });
  };

  const handleQuickLaunch = (templateId: string) => {
    createBatchFromTemplate(templateId, {
      onSuccess: () => toast.success('Production run launched!'),
      onError: (err: any) => toast.error(err?.message || 'Launch failed'),
    });
  };

  const formatScheduleSummary = (schedules?: TemplateSchedule[]) => {
    if (!schedules || schedules.length === 0) return 'Manual Launch Only';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = schedules.map(s => dayNames[s.dayOfWeek]);
    const uniqueDays = [...new Set(days)];
    const time = schedules[0].time;
    return `${uniqueDays.join(', ')} @ ${time}`;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-border/60 focus-visible:ring-primary/20 transition-all"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 border-border/60">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="h-10 gap-2 text-xs border-border/60 font-medium"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          >
            <Layers className="h-4 w-4" />
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>

          <Button
            className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm px-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-4 px-6">
                  Template Name
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Master Formula
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">
                  Standard Qty
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Routine Schedule
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTemplates
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredTemplates.map(template => (
                    <TableRow key={template.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4 px-6">
                        <span className="font-bold text-foreground text-sm tracking-tight">{template.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {template.recipe.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm">
                        {template.quantity}{' '}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {template.recipe.yieldUnit as any}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 opacity-40" />
                          {formatScheduleSummary(template.schedules)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? 'outline' : 'secondary'}
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5',
                            template.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {template.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleQuickLaunch(template.id)}
                              className="text-primary font-bold"
                            >
                              <Rocket className="mr-2 h-4 w-4" /> Launch Batch
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold tracking-tight text-foreground">
                      {template.name}
                    </CardTitle>
                    <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                      {template.recipe.name}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] font-black uppercase border-none',
                      template.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {template.isActive ? 'Active' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-black text-muted-foreground/50 tracking-widest">
                      Base Yield
                    </span>
                    <span className="text-xl font-black text-foreground tabular-nums">
                      {template.quantity}{' '}
                      <span className="text-xs text-muted-foreground font-bold">
                        {template.recipe.yieldUnit as any}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase font-black text-muted-foreground/50 tracking-widest">
                      Frequency
                    </span>
                    <span className="text-xs font-bold text-foreground text-right">
                      {template.schedules?.length || 0} Runs / Wk
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80">
                    <Clock className="h-3 w-3 opacity-50" />
                    {formatScheduleSummary(template.schedules)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 p-3 border-t border-border/30 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase tracking-widest hover:text-red-600"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Decommission
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDuplicate(template.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-4"
                    onClick={() => handleQuickLaunch(template.id)}
                  >
                    Launch Order
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Overlays */}
      <CreateEditTemplate isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} template={null} />

      {selectedTemplate && (
        <CreateEditTemplate isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} template={selectedTemplate} />
      )}
    </div>
  );
}
