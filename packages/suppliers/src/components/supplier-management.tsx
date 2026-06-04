"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import SheduleDeliveryModal from './create-edit-delivery';
import {
  Plus,
  Edit,
  Package,
  Truck,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import { SupplierUI as Supplier } from '../types/index';
import { SupplierLoadingState } from './supplier-loading-state';
import { SupplierEmptyState } from './supplier-empty-state';
import CreateEditSupplierModal from './supplier-create-modal';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import Link from 'next/link';

import { useListSuppliers } from '../lib/api/suppliers';

interface SupplierRowProps {
  supplier: any;
  onView: (id: string) => void;
  onEdit: (supplier: any) => void;
  onDelete: (id: string) => void;
  onReceive: (id: string) => void;
  onSchedule: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}

const SupplierRow: React.FC<SupplierRowProps> = ({
  supplier,
  onView,
  onEdit,
  onDelete,
  onReceive,
  onSchedule,
  isSelected,
  onSelect
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 group transition-colors">
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(supplier.id, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <Link
             href={`/suppliers/${supplier.id}`}
            className="font-medium hover:underline text-primary transition-colors"
          >
            {supplier.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{supplier.code}</span>
            <span>•</span>
            <span className="capitalize">{supplier.type.replace('_', ' ')}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {supplier.contact.phone}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate max-w-[200px]">
            <Mail className="h-3.5 w-3.5" />
            {supplier.contact.email}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {supplier.categories.slice(0, 2).map((cat: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
              {cat}
            </Badge>
          ))}
          {supplier.categories.length > 2 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              +{supplier.categories.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${supplier.performance.qualityScore}%` }}
              />
            </div>
            <span className="text-xs font-medium">{supplier.performance.qualityScore}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {supplier.performance.totalOrders} orders total
          </div>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(supplier.id)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Supplier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSchedule(supplier.id)}>
                <Truck className="mr-2 h-4 w-4" /> Schedule Delivery
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReceive(supplier.id)}>
              <Package className="mr-2 h-4 w-4" /> Receive Delivery
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(supplier.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Supplier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function SupplierManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [isScheduleDeliveryOpen, setIsScheduleDeliveryOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useListSuppliers();

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.contact.primaryContact.toLowerCase().includes(query) ||
        s.contact.email.toLowerCase().includes(query)
      );
    }

    if (activeTab !== 'all') {
      result = result.filter(s => s.status === activeTab);
    }

    return result;
  }, [suppliers, searchQuery, activeTab]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectSupplier = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(prev => [...prev, id]);
    } else {
      setSelectedSuppliers(prev => prev.filter(sId => sId !== id));
    }
  };

  const handleDelete = (id: string) => {
    console.log('Delete supplier', id);
  };

  const handleReceive = (id: string) => {
    console.log('Receive delivery from', id);
  };

  const handleSchedule = (id: string) => {
    setSelectedSupplierId(id);
    setIsScheduleDeliveryOpen(true);
  };

  if (isLoading) return <SupplierLoadingState />;
  if (suppliers.length === 0 && !isLoading) return <SupplierEmptyState />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your relationships with vendors, manufacturers and distributors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-primary/20 hover:border-primary/40 transition-colors">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => {
              setEditingSupplier(undefined);
              setIsCreateModalOpen(true);
            }}
            className="shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/10 hover:border-primary/20 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <div className="bg-primary/10 p-2 rounded-lg">
                <Briefcase className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-muted/60">
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-background border h-9 p-0.5">
                <TabsTrigger value="all" className="px-4 py-1 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                <TabsTrigger value="active" className="px-4 py-1 text-sm">Active</TabsTrigger>
                <TabsTrigger value="pending" className="px-4 py-1 text-sm">Pending</TabsTrigger>
                <TabsTrigger value="suspended" className="px-4 py-1 text-sm">Suspended</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  className="h-9 w-full md:w-64 pl-9 pr-4 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Supplier <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Contact</TableHead>
                  <TableHead className="font-semibold text-foreground">Categories</TableHead>
                  <TableHead className="font-semibold text-foreground">Performance</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    onView={(id) => console.log('View', id)}
                    onEdit={(s) => {
                      setEditingSupplier(s);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onReceive={handleReceive}
                    onSchedule={handleSchedule}
                    isSelected={selectedSuppliers.includes(supplier.id)}
                    onSelect={handleSelectSupplier}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateEditSupplierModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode={editingSupplier ? "edit" : "create"}
        supplierId={editingSupplier?.id}
      />

      {isScheduleDeliveryOpen && selectedSupplierId && (
        <SheduleDeliveryModal
          isOpen={isScheduleDeliveryOpen}
          onClose={() => setIsScheduleDeliveryOpen(false)}
          onSave={() => {}}
          delivery={null}
        />
      )}
    </div>
  );
}
