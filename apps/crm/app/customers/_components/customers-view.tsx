'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Globe,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
<<<<<<< HEAD
import { getCustomers, deleteCustomer } from '../../actions/customers';
=======
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Button } from '@repo/ui/components/ui/button';
import { customers as initialCustomers, getCustomerStats, formatCurrency, type CustomerStatus, type CustomerType, type Customer } from '../../../lib/mock-data';
>>>>>>> nextgen
import { StatCard } from '../../../components/ui/stat-card';
import { useOrg } from '../../../components/org-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/ui/sheet';
import { CustomerForm } from './customer-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Button } from '@repo/ui/components/ui/button';

const PAGE_SIZE = 10;

export function CustomersView() {
<<<<<<< HEAD
  const { organizationId } = useOrg();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
=======
  const stats = getCustomerStats();

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
>>>>>>> nextgen
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [page, setPage] = useState(1);
<<<<<<< HEAD
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(organizationId);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [organizationId]);
=======
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    type: 'B2B' as CustomerType,
    status: 'Lead' as CustomerStatus,
    city: '',
    country: '',
  });
>>>>>>> nextgen

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && c.isActive) ||
        (statusFilter === 'Inactive' && !c.isActive);

      return matchesSearch && matchesStatus;
    });
<<<<<<< HEAD
  }, [search, statusFilter, customers]);
=======
  }, [customers, search, statusFilter, typeFilter]);
>>>>>>> nextgen

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

<<<<<<< HEAD
  const startItem = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const handleDelete = async (id: string) => {
    if (typeof window !== 'undefined' && global.confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
      fetchCustomers();
    }
=======
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  const startItem = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const handleAddCustomer = () => {
    const customer: Customer = {
      ...newCustomer,
      id: `cust-${Date.now()}`,
      totalRevenue: 0,
      totalOrders: 0,
      openInvoices: 0,
      healthScore: 100,
      loyaltyPoints: 0,
      accountManager: 'Marcus Reid',
      accountManagerInitials: 'MR',
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      phone: '',
      tags: [],
      address: '',
      conversations: [],
      orders: [],
      invoices: [],
      deliveries: [],
      notes: [],
      followUps: [],
    };
    setCustomers([customer, ...customers]);
    setIsAddDialogOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      company: '',
      industry: '',
      type: 'B2B',
      status: 'Lead',
      city: '',
      country: '',
    });
>>>>>>> nextgen
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Customers</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage and track all your customer relationships.
            </p>
          </div>
<<<<<<< HEAD
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={15} />
                Add Customer
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Customer</SheetTitle>
              </SheetHeader>
              <CustomerForm
                onSuccess={() => {
                  setIsCreateOpen(false);
                  fetchCustomers();
                }}
              />
            </SheetContent>
          </Sheet>
=======

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={15} />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="John Doe"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="john@example.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Acme Inc"
                      value={newCustomer.company}
                      onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Technology"
                      value={newCustomer.industry}
                      onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newCustomer.type}
                      onValueChange={(v) => setNewCustomer({ ...newCustomer, type: v as CustomerType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.filter(o => o !== 'All').map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={newCustomer.status}
                      onValueChange={(v) => setNewCustomer({ ...newCustomer, status: v as CustomerStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(o => o !== 'All').map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCustomer}>Add Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
>>>>>>> nextgen
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Customers"
            value={customers.length}
            sub={`${customers.filter(c => c.isActive).length} active`}
            icon={Users}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
<<<<<<< HEAD
            <div className="flex items-center gap-1.5">
              {['All', 'Active', 'Inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {s}
                </button>
              ))}
=======

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o === 'All' ? 'All Statuses' : o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o === 'All' ? 'All Types' : o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
>>>>>>> nextgen
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-[13px] text-muted-foreground">
                      Loading customers...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-[13px] text-muted-foreground">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paged.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground">
                              {customer.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">{customer.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-foreground font-medium">
                        {customer.company || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {customer.customerType || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                           customer.isActive ? "bg-status-success/10 text-status-success" : "bg-muted text-muted-foreground"
                         )}>
                           {customer.isActive ? 'Active' : 'Inactive'}
                         </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {customer.phone || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet
                            open={editingCustomer?.id === customer.id}
                            onOpenChange={(open: boolean) => !open && setEditingCustomer(null)}
                          >
<<<<<<< HEAD
                            <button
                              onClick={() => setEditingCustomer(customer)}
                              className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors"
                            >
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Edit Customer</SheetTitle>
                              </SheetHeader>
                              <CustomerForm
                                initialData={customer}
                                onSuccess={() => {
                                  setEditingCustomer(null);
                                  fetchCustomers();
                                }}
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
=======
                            View
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
>>>>>>> nextgen
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
<<<<<<< HEAD
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(customer.id)}
                              >
                                Delete
                              </DropdownMenuItem>
=======
                              <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                              <DropdownMenuItem>Send Email</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
>>>>>>> nextgen
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <p className="text-[12.5px] text-muted-foreground">
              Showing {startItem}–{endItem} of {filtered.length} customers
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="w-8 h-8"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="w-8 h-8"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
