"use client";

import { useState, useTransition } from "react";
import { getUserActivityLogs, ActivityLogItem } from "@/app/actions/activity";
import { ActivityStats } from "./activity-stats";
import { ActivityFilters } from "./activity-filters";
import { ActivityTable } from "./activity-table";
import { Loader2 } from "lucide-react";

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

interface ActivityClientProps {
  filterOptions: {
    users: UserOption[];
    organizations: OrgOption[];
  };
  initialData: {
    items: ActivityLogItem[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
    stats: {
      totalActivities: number;
      posSalesCount: number;
      loginCount: number;
      activeOrgs: number;
    };
  };
}

export function ActivityClient({ filterOptions, initialData }: ActivityClientProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<{
    userId?: string;
    organizationId?: string;
    activityType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
  }>({
    page: 1,
  });

  const handleFilterChange = (newFilterPartial: Record<string, any>) => {
    const updatedFilters = {
      ...filters,
      ...newFilterPartial,
      page: 1, // Reset to page 1 on filter change
    };
    setFilters(updatedFilters);

    startTransition(async () => {
      const result = await getUserActivityLogs({
        ...updatedFilters,
        activityType: (updatedFilters.activityType as any) || "ALL",
      });
      setData(result);
    });
  };

  const handleResetFilters = () => {
    const resetState = { page: 1 };
    setFilters(resetState);

    startTransition(async () => {
      const result = await getUserActivityLogs({ activityType: "ALL", page: 1 });
      setData(result);
    });
  };

  const handlePageChange = (newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);

    startTransition(async () => {
      const result = await getUserActivityLogs({
        ...updatedFilters,
        activityType: (updatedFilters.activityType as any) || "ALL",
      });
      setData(result);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">User Activity & POS Sales Logins</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor authentication logins, POS terminal sales, orders, and user actions across all workspaces.
          </p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <Loader2 className="size-4 animate-spin" />
            Updating logs...
          </div>
        )}
      </div>

      <ActivityStats stats={data.stats} />

      <ActivityFilters
        users={filterOptions.users}
        organizations={filterOptions.organizations}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <ActivityTable
        logs={data.items}
        pagination={data.pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
