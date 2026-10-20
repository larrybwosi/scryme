"use client";

import { Search, FilterX, Calendar } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

interface ActivityFiltersProps {
  users: UserOption[];
  organizations: OrgOption[];
  filters: {
    userId?: string;
    organizationId?: string;
    activityType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
  onFilterChange: (filters: Record<string, any>) => void;
  onReset: () => void;
}

export function ActivityFilters({
  users,
  organizations,
  filters,
  onFilterChange,
  onReset,
}: ActivityFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Query */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search by user, email, receipt #, IP..."
            className="pl-9 text-xs"
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        {/* Activity Type Filter */}
        <div>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            value={filters.activityType || "ALL"}
            onChange={(e) => onFilterChange({ activityType: e.target.value })}
          >
            <option value="ALL">All Activity Types</option>
            <option value="LOGIN">User Logins (Auth Sessions)</option>
            <option value="POS_SALE">POS Terminal Sales</option>
            <option value="SALES_ORDER">Sales Orders</option>
            <option value="ONLINE_ORDER">Online / E-commerce Orders</option>
          </select>
        </div>

        {/* User Filter */}
        <div>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            value={filters.userId || ""}
            onChange={(e) => onFilterChange({ userId: e.target.value || undefined })}
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {/* Organization Filter */}
        <div>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            value={filters.organizationId || ""}
            onChange={(e) => onFilterChange({ organizationId: e.target.value || undefined })}
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        {/* Date Range Inputs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span>Date Range:</span>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.startDate || ""}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
          />
          <span>to</span>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.endDate || ""}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
          />
        </div>

        {/* Reset Filters */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <FilterX className="size-3.5" aria-hidden="true" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
