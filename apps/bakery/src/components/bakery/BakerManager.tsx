import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import { BakeryBaker, BatchStatus } from "@/types/bakery";
import {
  Plus,
  Edit,
  Mail,
  User,
  CheckCircle,
  Clock,
  Calendar,
  Star,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useBakerySettingsManagement } from "@/hooks/bakery";
import OperatorFormDialog from "@/components/bakery/BakerForm";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BakerManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBaker, setSelectedBaker] = useState<BakeryBaker | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    bakers,
    isLoading: settingsLoading,
    error: settingsError,
    removeBaker,
  } = useBakerySettingsManagement();

  const filteredBakers = bakers?.filter(
    (baker) =>
      baker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      baker?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      baker?.specialties?.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
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
    const completedBatches = bakerBatches.filter(
      (b: any) => b.status === BatchStatus.COMPLETED,
    ).length;
    const activeBatches = bakerBatches.filter(
      (b: any) => b.status === BatchStatus.IN_PROGRESS,
    ).length;
    const plannedBatches = bakerBatches.filter(
      (b: any) => b.status === BatchStatus.PLANNED,
    ).length;

    return { totalBatches, completedBatches, activeBatches, plannedBatches };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            System Error
          </h3>
          <p className="text-slate-500 text-center mb-6">
            {settingsError.message || "Failed to load operator matrix."}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Subsystem
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
            Operator Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage production staff, shift assignments, and routing specialties.
          </p>
        </div>
        <Button
          onClick={handleCreateBaker}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Provision Operator
        </Button>
      </div>

      <OperatorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        baker={selectedBaker}
      />

      {/* Toolbar */}
      <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search operators by name, email, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBakers?.map((baker) => {
          const stats = getBakerStats(baker);
          const isDefault = (baker as any).isDefault; // Type coercion if schema not fully updated yet

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

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm">
                        {getInitials(baker?.name || "Unknown")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          {baker.name}
                        </CardTitle>
                        {isDefault && (
                          <div
                            title="Default Operator"
                            className="flex items-center justify-center bg-amber-100 text-amber-600 rounded-full h-5 w-5"
                          >
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">
                          {baker.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Specialties */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    Qualified Specialties
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
                      <span className="text-xs text-slate-400">
                        Unspecified routing
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        Run Volume
                      </span>
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {stats.totalBatches}
                      </span>
                    </div>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-md border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-500">
                        Yielded
                      </span>
                      <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
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
                      "px-2 py-0.5 font-medium border-transparent",
                      baker.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {baker.isActive ? "Active Status" : "Inactive"}
                  </Badge>

                  {stats.activeBatches > 0 ? (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500 font-medium">
                      <Clock className="h-3.5 w-3.5 animate-pulse" />
                      <span>
                        {stats.activeBatches} active run
                        {stats.activeBatches > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Idle Capacity</span>
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No Operators Found
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              {searchTerm
                ? "No staff matching your query parameters."
                : "Your operator matrix is empty. Provision staff to assign production runs."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
