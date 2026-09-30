import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Separator } from '@repo/ui/components/ui/separator';
import { Avatar, AvatarFallback } from '@repo/ui/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { BakeryBaker, BatchStatus } from '@/types/bakery';
import { Plus, Edit, Mail, User, CheckCircle, Clock, Calendar, Star, ShieldCheck, Search, Crown, Award, UserCheck, CalendarDays, ArrowRightLeft, Users } from 'lucide-react';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import OperatorFormDialog, { BAKER_ROLES } from '@/components/bakery/BakerForm';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function BakerManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBaker, setSelectedBaker] = useState<BakeryBaker | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState('directory');

  const { bakers, isLoading: settingsLoading, error: settingsError } = useBakerySettingsManagement();

  const filteredBakers = bakers?.filter(
    baker => {
      const matchesSearch =
        baker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baker?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baker?.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || baker?.role === roleFilter;

      return matchesSearch && matchesRole;
    }
  );

  const handleEditBaker = (baker: BakeryBaker) => {
    setSelectedBaker(baker);
    setIsFormOpen(true);
  };

  const handleCreateBaker = () => {
    setSelectedBaker(null);
    setIsFormOpen(true);
  };

  const getBakerStats = (baker: BakeryBaker) => {
    const bakerBatches = (baker as any).batches || [];
    const totalBatches = bakerBatches.length;
    const completedBatches = bakerBatches.filter((b: any) => b.status === BatchStatus.COMPLETED).length;
    const activeBatches = bakerBatches.filter((b: any) => b.status === BatchStatus.IN_PROGRESS).length;
    const plannedBatches = bakerBatches.filter((b: any) => b.status === BatchStatus.PLANNED).length;

    return { totalBatches, completedBatches, activeBatches, plannedBatches };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role?: string) => {
    const roleConfig = BAKER_ROLES.find(r => r.value === role) || {
      label: role || 'Lead Baker',
      icon: Crown,
      color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    };

    const Icon = roleConfig.icon;

    return (
      <Badge
        variant="outline"
        className={cn('px-2 py-0.5 text-[10px] font-semibold border flex items-center gap-1', roleConfig.color)}
      >
        <Icon className="h-3 w-3" />
        <span>{roleConfig.label}</span>
      </Badge>
    );
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <Card className="bg-white dark:bg-slate-950 shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-full">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">System Error</h3>
          <p className="text-slate-500 text-center mb-6">
            {settingsError.message || 'Failed to load staff & schedules subsystem.'}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Subsystem
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sample Shift Schedules for Overview
  const sampleShifts = [
    { id: '1', title: 'Early Morning Bake (Sourdough & Breads)', time: '04:00 AM - 12:00 PM', leadBaker: bakers?.[0]?.name || 'Lead Baker', status: 'In Progress', activeBakers: 3 },
    { id: '2', title: 'Mid-Day Pastry & Lamination', time: '09:00 AM - 05:00 PM', leadBaker: bakers?.[1]?.name || 'Head Pastry Chef', status: 'Scheduled', activeBakers: 2 },
    { id: '3', title: 'Evening Prep & Proofing', time: '04:00 PM - 12:00 AM', leadBaker: bakers?.[2]?.name || 'Line Baker', status: 'Scheduled', activeBakers: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Staff & Schedules
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage member baker provisioning, configure roles (e.g. Lead Baker), and oversee shift schedules.
          </p>
        </div>
        <Button onClick={handleCreateBaker} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Authorize Member as Baker
        </Button>
      </div>

      <OperatorFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} baker={selectedBaker} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
          <TabsTrigger value="directory" className="flex items-center gap-2 text-xs font-semibold px-4 py-2">
            <ShieldCheck className="h-4 w-4" /> Staff Directory & Roles
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2 text-xs font-semibold px-4 py-2">
            <CalendarDays className="h-4 w-4" /> Shift Schedules Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search staff by name, email, or specialty..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Filter Role:</span>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-44 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {BAKER_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBakers?.map(baker => {
              const stats = getBakerStats(baker);
              const isDefault = (baker as any).isDefault;

              return (
                <Card
                  key={baker.id}
                  className="group relative overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => handleEditBaker(baker)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {getInitials(baker?.name || 'Baker')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                              {baker.name}
                            </CardTitle>
                            {isDefault && (
                              <div
                                title="Lead / Default Shift Operator"
                                className="flex items-center justify-center bg-amber-100 text-amber-600 rounded-full h-5 w-5"
                              >
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(baker.role)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Contact */}
                    <div className="flex items-center text-xs text-slate-500 gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-md border border-slate-100 dark:border-slate-800/80">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{baker.email || 'No email attached'}</span>
                    </div>

                    {/* Specialties */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                        Specialties & Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                        {baker?.specialties?.length ? (
                          baker.specialties.map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="px-2 py-0 h-5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-none"
                            >
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No specialties specified</span>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-500">Batch Volume</span>
                          <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {stats.totalBatches}
                          </span>
                        </div>
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-md border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-500">
                            Yielded
                          </span>
                          <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {stats.completedBatches}
                          </span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'px-2 py-0.5 font-medium border-transparent text-[10px]',
                          baker.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {baker.isActive ? 'Active Status' : 'Inactive'}
                      </Badge>

                      {stats.activeBatches > 0 ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500 font-medium text-xs">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          <span>
                            {stats.activeBatches} active run{stats.activeBatches > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Idle Capacity</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredBakers?.length === 0 && (
            <Card className="bg-white dark:bg-slate-950 shadow-sm border-dashed border-slate-300 dark:border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">No Staff Found</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  {searchTerm || roleFilter !== 'ALL'
                    ? 'No staff members match your filter criteria.'
                    : 'Your staff directory is empty. Authorize organization members as bakers to get started.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-950 border-blue-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" /> Active Shift Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">3 Active Shifts</div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  All production slots assigned with Lead Bakers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-950 border-amber-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600" /> Lead Baker Roster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {bakers?.filter(b => b.role === 'LEAD_BAKER' || (b as any).isDefault).length || 1} Lead Bakers
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Authorized to lead batch execution and recipe scaling.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-slate-900 dark:to-slate-950 border-purple-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" /> Total Provisioned Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {bakers?.length || 0} Staff Members
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Active bakery operators ready for assignment.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Production Shift Roster & Schedule
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily shift coverage, assigned Lead Bakers, and capacity indicators.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {sampleShifts.map(shift => (
                <div key={shift.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{shift.title}</span>
                      <Badge variant="secondary" className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {shift.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> {shift.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Crown className="h-3.5 w-3.5 text-amber-500" /> Lead: <strong className="text-slate-700 dark:text-slate-200">{shift.leadBaker}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {shift.activeBakers} Bakers On Duty
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
