"use client";

import React, { useState } from "react";
import { bulkUpdateOrgUnitsStatus } from "../../actions/units";
import { fixMissingUnits } from "../../actions/inventory";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  Settings2,
  ArrowLeftRight,
  Database,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ChevronDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { UnitDialog } from "../../../components/inventory/units/unit-dialog";
import { ConversionDialog } from "../../../components/inventory/units/conversion-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { UnitType } from "@repo/db/client";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

interface UnitsPageContentProps {
  systemUnits: any[];
  orgUnits: any[];
  conversions: any[];
}

const StatusDot = ({ active }: { active: boolean }) => (
  <span className="flex items-center gap-1.5">
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        active ? "bg-emerald-500" : "bg-slate-300",
      )}
    />
    <span
      className={cn(
        "text-xs font-medium",
        active ? "text-emerald-700" : "text-slate-400",
      )}>
      {active ? "Active" : "Inactive"}
    </span>
  </span>
);

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) => (
  <div className="flex flex-col gap-0.5 px-6 py-4 border-r border-slate-100 last:border-r-0">
    <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
      {label}
    </span>
    <span className="text-2xl font-semibold text-slate-900 tabular-nums">
      {value}
    </span>
    {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
  </div>
);

export function UnitsPageContent({
  systemUnits,
  orgUnits,
  conversions,
}: UnitsPageContentProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const filterItems = (items: any[]) =>
    items.filter(item => {
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        item.fromUnit?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.toUnit?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        typeFilter === "all" ||
        item.type === typeFilter ||
        item.fromUnit?.type === typeFilter;
      return matchesSearch && matchesType;
    });

  const filteredOrgUnits = filterItems(orgUnits);
  const filteredConversions = filterItems(conversions);
  const filteredSystemUnits = filterItems(systemUnits);

  const activeOrgUnits = orgUnits.filter(u => u.isActive).length;
  const activeConversions = conversions.filter(c => c.isActive).length;

  const toggleSelectAll = () => {
    setSelectedUnitIds(
      selectedUnitIds.length === filteredOrgUnits.length
        ? []
        : filteredOrgUnits.map(u => u.id),
    );
  };

  const toggleSelectUnit = (id: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const [isFixingUnits, setIsFixingUnits] = useState(false);
  const handleFixMissingUnits = async () => {
    setIsFixingUnits(true);
    try {
      const result = await fixMissingUnits();
      toast.success(
        `Fixed units for ${result.updated} variants out of ${result.processed} processed`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to fix units");
    } finally {
      setIsFixingUnits(false);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedUnitIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkUpdateOrgUnitsStatus(selectedUnitIds, isActive);
      toast.success(
        `${selectedUnitIds.length} unit${selectedUnitIds.length > 1 ? "s" : ""} ${isActive ? "activated" : "deactivated"}`,
      );
      setSelectedUnitIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to update units");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const unitTypeOptions = Object.values(UnitType);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-8 pt-8 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Inventory Configuration
            </p>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Unit Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isFixingUnits}
              onClick={handleFixMissingUnits}
              className="gap-2 h-8 px-3 text-xs font-medium">
              <Settings2 size={13} />
              {isFixingUnits ? "Fixing..." : "Fix Missing Units"}
            </Button>
            <UnitDialog systemUnits={systemUnits}>
              <Button
                size="sm"
                className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-none rounded-md h-8 px-3 text-xs font-medium">
                <Plus size={13} />
                Add Unit
              </Button>
            </UnitDialog>
          </div>
        </div>

        {/* Stat bar */}
        <div className="flex border border-slate-100 rounded-t-lg overflow-hidden bg-slate-50/60 -mx-px">
          <StatCard
            label="Org Units"
            value={orgUnits.length}
            sub={`${activeOrgUnits} active`}
          />
          <StatCard
            label="System Units"
            value={systemUnits.length}
            sub="read-only"
          />
          <StatCard
            label="Conversions"
            value={conversions.length}
            sub={`${activeConversions} active`}
          />
          <StatCard
            label="Unit Types"
            value={unitTypeOptions.length}
            sub="available"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search name or symbol…"
              className="pl-9 h-8 text-sm border-slate-200 bg-white shadow-none rounded-md placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-sm border-slate-200 bg-white shadow-none rounded-md gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {unitTypeOptions.map(type => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedUnitIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2 duration-150">
              <span className="text-xs text-slate-500 font-medium">
                {selectedUnitIds.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBulkLoading}
                    className="h-8 px-3 gap-1.5 text-xs border-slate-200 bg-white shadow-none">
                    Bulk Actions
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-slate-500">
                    Apply to {selectedUnitIds.length} unit
                    {selectedUnitIds.length > 1 ? "s" : ""}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusUpdate(true)}
                    className="gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusUpdate(false)}
                    className="gap-2 text-sm">
                    <XCircle size={14} className="text-slate-400" />
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="org" className="w-full">
          <TabsList className="h-9 bg-white border border-slate-200 rounded-md p-1 gap-1 w-auto inline-flex shadow-none">
            <TabsTrigger
              value="org"
              className="gap-1.5 px-3 h-7 text-xs font-medium rounded data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-none text-slate-500 hover:text-slate-700">
              <Settings2 size={13} />
              Organization
              <span className="ml-1 tabular-nums text-[10px] opacity-60">
                {filteredOrgUnits.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="conversions"
              className="gap-1.5 px-3 h-7 text-xs font-medium rounded data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-none text-slate-500 hover:text-slate-700">
              <ArrowLeftRight size={13} />
              Conversions
              <span className="ml-1 tabular-nums text-[10px] opacity-60">
                {filteredConversions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="gap-1.5 px-3 h-7 text-xs font-medium rounded data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-none text-slate-500 hover:text-slate-700">
              <Database size={13} />
              System
              <span className="ml-1 tabular-nums text-[10px] opacity-60">
                {filteredSystemUnits.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ── Org Units ── */}
          <TabsContent value="org" className="mt-4">
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={
                          selectedUnitIds.length === filteredOrgUnits.length &&
                          filteredOrgUnits.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className="border-slate-300"
                      />
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Symbol
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Base Mapping
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgUnits.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-sm text-slate-400">
                        No units match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrgUnits.map(unit => (
                      <TableRow
                        key={unit.id}
                        className={cn(
                          "border-slate-100 transition-colors",
                          selectedUnitIds.includes(unit.id)
                            ? "bg-blue-50/60"
                            : "hover:bg-slate-50/60",
                        )}>
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedUnitIds.includes(unit.id)}
                            onCheckedChange={() => toggleSelectUnit(unit.id)}
                            aria-label={`Select ${unit.name}`}
                            className="border-slate-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm text-slate-800">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {unit.symbol}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                            {unit.type.toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {unit.baseSystemUnit ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700">
                                {unit.baseSystemUnit.name}
                              </span>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                ×{Number(unit.conversionFactor)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusDot active={unit.isActive} />
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <UnitDialog unit={unit} systemUnits={systemUnits}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                              Edit
                            </Button>
                          </UnitDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Conversions ── */}
          <TabsContent value="conversions" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <ConversionDialog orgUnits={orgUnits} systemUnits={systemUnits}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs border-slate-200 bg-white shadow-none">
                  <Plus size={13} />
                  New Conversion
                </Button>
              </ConversionDialog>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 pl-4">
                      From
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      To
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Factor
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-sm text-slate-400">
                        No conversions match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConversions.map(conv => (
                      <TableRow
                        key={conv.id}
                        className="border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <TableCell className="pl-4">
                          <span className="text-sm font-medium text-slate-800">
                            {conv.fromUnit.name}
                          </span>
                          <code className="ml-1.5 bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono">
                            {conv.fromUnit.symbol}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-800">
                            {conv.toUnit?.name ?? "Unknown"}
                          </span>
                          <code className="ml-1.5 bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono">
                            {conv.toUnit?.symbol ?? "???"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm tabular-nums text-slate-700">
                              {Number(conv.factor)}
                            </span>
                            {conv.isApproximate && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                ~approx
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusDot active={conv.isActive} />
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <ConversionDialog
                            conversion={conv}
                            orgUnits={orgUnits}
                            systemUnits={systemUnits}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                              Edit
                            </Button>
                          </ConversionDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── System Units ── */}
          <TabsContent value="system" className="mt-4">
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <Activity size={12} className="text-slate-400" />
                <span className="text-[11px] text-slate-400 font-medium">
                  Read-only — managed by the platform
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 pl-4">
                      Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Symbol
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Category
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Flags
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSystemUnits.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-sm text-slate-400">
                        No system units match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSystemUnits.map(unit => (
                      <TableRow
                        key={unit.id}
                        className="border-slate-100 hover:bg-slate-50/40 transition-colors">
                        <TableCell className="font-medium text-sm text-slate-800 pl-4">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-mono">
                            {unit.symbol}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                            {unit.type.toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {unit.category}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {unit.isBaseUnit && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wide">
                                SI Base
                              </span>
                            )}
                            {unit.isMetric && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                                Metric
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
