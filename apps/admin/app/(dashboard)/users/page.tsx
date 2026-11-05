import { listUsers } from "@/app/actions/users";
import { UsersTable } from "@/components/users/users-table";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page: rawPage, search: rawSearch } = await searchParams;
  const page = Math.max(1, parseInt(rawPage || "1", 10) || 1);
  const search = rawSearch || "";

  const result = await listUsers({
    page,
    pageSize: 50,
    search: search.trim() || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system users across all organizations ({result.pagination.totalCount.toLocaleString()} total).
        </p>
      </div>

      <UsersTable
        users={result.users}
        pagination={result.pagination}
        initialSearch={search}
      />
    </div>
  );
}
