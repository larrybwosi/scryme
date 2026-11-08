"use client";

import React, { useState, useTransition } from "react";
import { getDepartments, getDepartmentStats } from "../../actions/department";
import { DepartmentTable } from "../../../components/departments/department-table";
import { AddDepartmentDialog } from "../../../components/departments/add-department-dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Users, Search, Filter, Building2, Briefcase, Wallet } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

interface DepartmentsClientProps {
  initialDepartments: any[];
  stats: any;
}

export function DepartmentsClient({ initialDepartments, stats }: DepartmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-background text-foreground min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Departments
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization&apos;s departments and department-specific controls.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AddDepartmentDialog>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Create Department</span>
            </Button>
          </AddDepartmentDialog>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{stats?.totalDepartments}</h3>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                Active
              </Badge>
            </div>
          </div>
          <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users size={16} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Members Assigned</p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{stats?.totalMembers}</h3>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none">
                In Departments
              </Badge>
            </div>
          </div>
          <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Active Budgets</p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">KES {stats?.totalBudget?.toLocaleString()}</h3>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
                Allocated
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Search departments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2">
              <Filter size={14} />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
          <DepartmentTable data={initialDepartments} />
        </div>
      </div>
    </div>
  );
}