"use client";

import React, { useState } from "react";
import {
  getSystemUnits,
  getOrganizationUnits,
  getOrgUnitConversions,
  bulkUpdateOrgUnitsStatus,
} from "../../actions/units";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Settings2, ArrowLeftRight, Database, Search, Filter, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { UnitDialog } from "../../../components/inventory/units/unit-dialog";
import { ConversionDialog } from "../../../components/inventory/units/conversion-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
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

interface UnitsPageContentProps {
  systemUnits: any[];
  orgUnits: any[];
  conversions: any[];
}

export function UnitsPageContent({
  systemUnits,
  orgUnits,
  conversions,
}: UnitsPageContentProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        (item.fromUnit?.name?.toLowerCase().includes(search.toLowerCase())) ||
        (item.toUnit?.name?.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === "all" || item.type === typeFilter || item.fromUnit?.type === typeFilter;

      return matchesSearch && matchesType;
    });
  };

  const filteredOrgUnits = filterItems(orgUnits);
  const filteredConversions = filterItems(conversions);
  const filteredSystemUnits = filterItems(systemUnits);

  const toggleSelectAll = () => {
    if (selectedUnitIds.length === filteredOrgUnits.length) {
      setSelectedUnitIds([]);
    } else {
      setSelectedUnitIds(filteredOrgUnits.map(u => u.id));
    }
  };

  const toggleSelectUnit = (id: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedUnitIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkUpdateOrgUnitsStatus(selectedUnitIds, isActive);
      toast.success(`Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedUnitIds.length} units`);
      setSelectedUnitIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to update units");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Unit Management</h1>
          <p className="text-sm text-gray-500">Manage system and custom organization units</p>
        </div>
        <div className="flex items-center gap-3">
          <UnitDialog systemUnits={systemUnits}>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add Custom Unit</span>
            </Button>
          </UnitDialog>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search units or symbols..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(UnitType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="org" className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="bg-transparent border-none p-0 h-11">
            <TabsTrigger
              value="org"
              className="gap-2 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Settings2 size={16} />
              Organization Units
            </TabsTrigger>
            <TabsTrigger
              value="conversions"
              className="gap-2 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <ArrowLeftRight size={16} />
              Conversions
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="gap-2 px-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Database size={16} />
              System Units
            </TabsTrigger>
          </TabsList>

          {selectedUnitIds.length > 0 && (
            <div className="flex items-center gap-2 pr-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-medium text-gray-500 mr-2">{selectedUnitIds.length} selected</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Bulk Actions
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate(true)} className="gap-2">
                    <CheckCircle size={14} className="text-green-600" />
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate(false)} className="gap-2">
                    <XCircle size={14} className="text-red-600" />
                    Deactivate Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <TabsContent value="org" className="mt-6">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedUnitIds.length === filteredOrgUnits.length && filteredOrgUnits.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base Mapping</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No units found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgUnits.map((unit) => (
                    <TableRow key={unit.id} className={selectedUnitIds.includes(unit.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUnitIds.includes(unit.id)}
                          onCheckedChange={() => toggleSelectUnit(unit.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                          {unit.symbol}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {unit.type.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {unit.baseSystemUnit ? (
                          <div className="flex flex-col">
                            <span>{unit.baseSystemUnit.name}</span>
                            <span className="text-[10px]">Factor: {Number(unit.conversionFactor)}</span>
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={unit.isActive ? "default" : "secondary"}>
                          {unit.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <UnitDialog unit={unit} systemUnits={systemUnits}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </UnitDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <ConversionDialog orgUnits={orgUnits} systemUnits={systemUnits}>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus size={14} />
                New Conversion
              </Button>
            </ConversionDialog>
          </div>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Factor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No conversions found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversions.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">
                        {conv.fromUnit.name} ({conv.fromUnit.symbol})
                      </TableCell>
                      <TableCell className="font-medium">
                        {conv.toUnit?.name || "Unknown"} ({conv.toUnit?.symbol || "???"})
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{Number(conv.factor)}</span>
                          {conv.isApproximate && (
                            <Badge variant="outline" className="text-[10px] px-1 h-4 border-yellow-500 text-yellow-700 bg-yellow-50">Approx</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={conv.isActive ? "default" : "secondary"}>
                          {conv.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConversionDialog conversion={conv} orgUnits={orgUnits} systemUnits={systemUnits}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </ConversionDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>System</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystemUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        {unit.symbol}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {unit.type.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {unit.category}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {unit.isBaseUnit && <Badge variant="secondary" className="text-[10px]">SI Base</Badge>}
                        {unit.isMetric && <Badge variant="secondary" className="text-[10px]">Metric</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
