'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { getCompanies, deleteCompany } from '../../actions/companies';
import { StatCard } from '../../../components/ui/stat-card';
import { useOrg } from '../../../components/org-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/ui/sheet';
import { CompanyForm } from './company-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Button } from '@repo/ui/components/ui/button';

const PAGE_SIZE = 10;

export function CompaniesView() {
  const { organizationId } = useOrg();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies(organizationId);
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [organizationId]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.taxId && c.taxId.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [search, companies]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const startItem = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const handleDelete = async (id: string) => {
    if (typeof window !== 'undefined' && global.confirm('Are you sure you want to delete this company?')) {
      await deleteCompany(id);
      fetchCompanies();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Companies</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage your business accounts and B2B relationships.
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={15} />
                Add Company
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px]">
              <SheetHeader>
                <SheetTitle>Add New Company</SheetTitle>
              </SheetHeader>
              <CompanyForm
                onSuccess={() => {
                  setIsCreateOpen(false);
                  fetchCompanies();
                }}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Companies"
            value={companies.length}
            sub="Active business accounts"
            icon={Building2}
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
                placeholder="Search by name or tax ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Company <ArrowUpDown size={11} className="opacity-50" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Customers
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-[13px] text-muted-foreground">
                      Loading companies...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-[13px] text-muted-foreground">
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  paged.map((company) => (
                    <tr key={company.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <Link href={`/companies/${company.id}`} className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                            {company.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {company.taxId || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] text-foreground">
                        {company._count.customers}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Sheet
                            open={editingCompany?.id === company.id}
                            onOpenChange={(open: boolean) => !open && setEditingCompany(null)}
                          >
                            <button
                              onClick={() => setEditingCompany(company)}
                              className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors"
                            >
                              Edit
                            </button>
                            <SheetContent className="sm:max-w-[440px]">
                              <SheetHeader>
                                <SheetTitle>Edit Company</SheetTitle>
                              </SheetHeader>
                              <CompanyForm
                                initialData={company}
                                onSuccess={() => {
                                  setEditingCompany(null);
                                  fetchCompanies();
                                }}
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(company.id)}
                              >
                                Delete
                              </DropdownMenuItem>
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
              Showing {startItem}–{endItem} of {filtered.length} companies
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
