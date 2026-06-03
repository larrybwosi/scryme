'use client';

import { useState } from 'react';
import { usePosStore, type Table } from '@/store/store';
import { Card, CardContent, CardHeader, CardDescription } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@repo/ui/components/ui/dropdown-menu';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Plus, Edit2, Trash2, Users, MapPin, CheckCircle2, Clock, Ban, Search, MoreHorizontal, LayoutGrid, SlidersHorizontal, History as HistoryIcon, UserCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { invoke } from '@tauri-apps/api/core';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

export default function ManageTablesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTableForHistory, setSelectedTableForHistory] = useState<Table | null>(null);
  const [tableHistory, setTableHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const tables = usePosStore(state => state.tables);
  const addTable = usePosStore(state => state.addTable);
  const updateTable = usePosStore(state => state.updateTable);
  const deleteTable = usePosStore(state => state.deleteTable);
  const setTableStatus = usePosStore(state => state.setTableStatus);

  const [formData, setFormData] = useState<Omit<Table, 'id'>>({
    number: '',
    capacity: 4,
    status: 'available',
    section: 'Main Hall',
    notes: '',
  });

  const defaultSections = ['Main Hall', 'Patio', 'VIP', 'Bar Area'];
  const sections = [...new Set(tables.map(t => t.section).filter(Boolean))];
  const uniqueSections = [...new Set([...defaultSections, ...sections])];

  const filteredTables = tables.filter(table => {
    const sectionMatch = filterSection === 'all' || table.section === filterSection;
    const statusMatch = filterStatus === 'all' || table.status === filterStatus;
    const searchMatch = !searchQuery || 
      table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.notes && table.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return sectionMatch && statusMatch && searchMatch;
  });

  const handleSubmit = () => {
    if (!formData.number || formData.capacity < 1) return;

    if (editingTable) {
      updateTable(editingTable.id, formData);
    } else {
      addTable(formData);
    }

    resetForm();
    setDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      number: '',
      capacity: 4,
      status: 'available',
      section: 'Main Hall',
      notes: '',
    });
    setEditingTable(null);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      section: table.section || '',
      notes: table.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      deleteTable(id);
    }
  };

  const getStatusConfig = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return { icon: CheckCircle2, label: 'Available', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500', bar: 'bg-emerald-500' };
      case 'occupied':
        return { icon: Ban, label: 'Occupied', color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500', bar: 'bg-rose-500' };
      case 'reserved':
        return { icon: Clock, label: 'Reserved', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500', bar: 'bg-amber-500' };
    }
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const fetchHistory = async (table: Table) => {
    setSelectedTableForHistory(table);
    setLoadingHistory(true);
    setHistoryDialogOpen(true);
    try {
      const history = await invoke<any[]>('get_table_history_command', { tableId: table.id });
      setTableHistory(history);
    } catch (error) {
      console.error('Failed to fetch table history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 bg-background/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Floor Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor availability, organize sections, and manage table configurations.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingTable ? 'Edit Table Configuration' : 'Create New Table'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Identifier *</Label>
                  <Input
                    id="number"
                    placeholder="e.g., T-01, VIP-A"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Capacity *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      className="pl-9"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Floor Section</Label>
                  <Select
                    value={formData.section}
                    onValueChange={value => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign section" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSections.map(section => (
                        <SelectItem key={section} value={section || ''}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Table['status']) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operational Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., Window seat, requires high chair..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 border-border/50">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.number}>
                {editingTable ? 'Save Configuration' : 'Create Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: stats.total, icon: LayoutGrid, color: 'text-foreground' },
          { label: 'Ready to Seat', value: stats.available, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Currently Occupied', value: stats.occupied, icon: Ban, color: 'text-rose-600' },
          { label: 'Reserved', value: stats.reserved, icon: Clock, color: 'text-amber-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border border-border/40 shadow-sm bg-card transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                </div>
                <div className="p-2.5 bg-muted/40 rounded-lg">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unified Command Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-2 rounded-lg border border-border/40 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search table number or notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-none bg-transparent shadow-none focus-visible:ring-0 w-full"
          />
        </div>
        <div className="hidden sm:block w-px h-6 bg-border/50 mx-2" />
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex items-center gap-2 pl-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground font-medium shrink-0">Filter:</span>
          </div>
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-border/50 bg-muted/20">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {uniqueSections.map(section => (
                <SelectItem key={section} value={section || ''}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-border/50 bg-muted/20">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map(table => {
            const config = getStatusConfig(table.status);
            const StatusIcon = config.icon;

            return (
              <Card key={table.id} className="relative group overflow-hidden border border-border/40 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 bg-card">
                {/* Status Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} />
                
                <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between space-y-0 pl-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-foreground font-mono tracking-tight">{table.number}</h3>
                    </div>
                    {table.section && (
                      <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <MapPin className="w-3 h-3 mr-1 opacity-70" />
                        {table.section}
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs uppercase text-muted-foreground tracking-wider">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(table)} className="cursor-pointer">
                        <Edit2 className="w-4 h-4 mr-2 text-muted-foreground" /> Edit Configuration
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fetchHistory(table)} className="cursor-pointer">
                        <HistoryIcon className="w-4 h-4 mr-2 text-muted-foreground" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(table.id)} className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                
                <CardContent className="p-4 pt-0 pl-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4 opacity-70" />
                      <span>{table.capacity} Seats</span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs font-medium border ${config.bg} ${config.color} ${config.border} hover:${config.bg} hover:opacity-80 transition-opacity`}>
                          <StatusIcon className="w-3 h-3 mr-1.5" />
                          {config.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTableStatus(table.id, 'available')}>Set Available</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTableStatus(table.id, 'occupied')}>Set Occupied</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTableStatus(table.id, 'reserved')}>Set Reserved</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {table.status === 'occupied' && (
                    <div className="flex flex-col gap-1.5 bg-muted/30 p-2.5 rounded-md border border-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <UserCircle className="w-3.5 h-3.5" />
                          Guests
                        </span>
                        <span className="font-medium text-foreground">{table.guestsCount || '--'}</span>
                      </div>
                      {table.occupiedAt && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Elapsed
                          </span>
                          <span className="font-medium text-foreground">{formatDistanceToNow(parseISO(table.occupiedAt))}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {table.notes && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {table.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-transparent shadow-none">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-5 border border-border/50">
            <LayoutGrid className="w-8 h-8 text-muted-foreground opacity-60" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No tables found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {searchQuery || filterSection !== 'all' || filterStatus !== 'all' 
              ? "We couldn't find any tables matching your current filters. Try adjusting your search parameters."
              : "Your floor plan is currently empty. Configure your first table to start managing occupancy."}
          </p>
          {searchQuery || filterSection !== 'all' || filterStatus !== 'all' ? (
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilterSection('all');
              setFilterStatus('all');
            }}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => setDialogOpen(true)} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add First Table
            </Button>
          )}
        </Card>
      )}

      {/* Enterprise Timeline History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border/50 bg-muted/10">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HistoryIcon className="w-5 h-5 text-muted-foreground" />
              History: {selectedTableForHistory?.number}
            </DialogTitle>
            <CardDescription>Recent occupancy records and metrics.</CardDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : tableHistory.length > 0 ? (
              <div className="relative border-l border-border ml-3 space-y-6 pb-4">
                {tableHistory.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    {/* Timeline Node */}
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-background bg-muted-foreground" />
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {format(new Date(entry.startedAt), 'MMM d, yyyy')}
                        </span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {entry.durationMinutes} min
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {format(new Date(entry.startedAt), 'h:mm a')} - {format(new Date(entry.endedAt), 'h:mm a')}
                          </div>
                          <div className="flex items-center text-foreground font-medium">
                            <Users className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            {entry.guestsCount}
                          </div>
                        </div>
                        {entry.orderId && (
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Order Reference</span>
                            <span className="text-xs font-mono font-medium text-foreground bg-background px-1.5 py-0.5 rounded border border-border/40">
                              {entry.orderId.substring(0, 8)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <HistoryIcon className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm">No recorded occupancy history yet.</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/50 bg-muted/10">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}