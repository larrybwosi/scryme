"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Search,
  MessageSquare,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { BanUserDialog } from "./ban-user-dialog";
import { UnbanUserDialog } from "./unban-user-dialog";
import { ManageScrymeAccessDialog } from "./manage-scryme-access-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  isActive: boolean;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  acquisitionSource?: string | null;
  createdAt: Date;
  _count: {
    members: number;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface UsersTableProps {
  users: UserRow[];
  pagination: PaginationMeta;
  initialSearch?: string;
}

export function UsersTable({
  users,
  pagination,
  initialSearch = "",
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [banTarget, setBanTarget] = useState<UserRow | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<UserRow | null>(null);
  const [scrymeAccessTarget, setScrymeAccessTarget] = useState<UserRow | null>(
    null,
  );
  const [resetPasswordTarget, setResetPasswordTarget] =
    useState<UserRow | null>(null);

  const updateQueryParams = (newParams: { page?: number; search?: string }) => {
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");

    if (newParams.page !== undefined) {
      if (newParams.page <= 1) {
        current.delete("page");
      } else {
        current.set("page", newParams.page.toString());
      }
    }

    if (newParams.search !== undefined) {
      if (!newParams.search.trim()) {
        current.delete("search");
      } else {
        current.set("search", newParams.search.trim());
      }
      // When searching, reset to page 1
      current.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${current.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearchSubmit} className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search users by name, email, role, or source..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search !== initialSearch && (
          <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
            Search
          </Button>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acquisition Source</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No users found matching query.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isBanned = user.banned ?? false;
                return (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <Link
                        href={`/users/${user.id}`}
                        className="flex flex-col hover:opacity-80 transition-opacity"
                      >
                        <span className="font-medium text-foreground group-hover:underline">
                          {user.name || "Unnamed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs uppercase"
                      >
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isBanned ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="destructive" className="w-fit gap-1">
                            <ShieldAlert
                              className="size-3"
                              aria-hidden="true"
                            />
                            Banned
                          </Badge>
                          {user.banReason ? (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              Reason: {user.banReason}
                            </span>
                          ) : null}
                        </div>
                      ) : user.isActive ? (
                        <Badge
                          variant="secondary"
                          className="w-fit gap-1 text-emerald-600 bg-emerald-500/10"
                        >
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="w-fit text-muted-foreground"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.acquisitionSource || "Direct / Organic"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user._count.members} org
                      {user._count.members === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/users/${user.id}`}
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-2.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                          title="View user details"
                        >
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          onClick={() => setResetPasswordTarget(user)}
                        >
                          <KeyRound className="size-3.5" aria-hidden="true" />
                          Reset Password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                          onClick={() => setScrymeAccessTarget(user)}
                        >
                          <MessageSquare
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Chat Access
                        </Button>
                        {isBanned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => setUnbanTarget(user)}
                          >
                            <UserCheck
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setBanTarget(user)}
                          >
                            <UserX className="size-3.5" aria-hidden="true" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-muted-foreground">
          Showing page {pagination.page} of {pagination.totalPages} (
          {pagination.totalCount.toLocaleString()} total users)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={pagination.page <= 1 || isPending}
            onClick={() => updateQueryParams({ page: pagination.page - 1 })}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={pagination.page >= pagination.totalPages || isPending}
            onClick={() => updateQueryParams({ page: pagination.page + 1 })}
          >
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ResetPasswordDialog
        user={resetPasswordTarget}
        open={!!resetPasswordTarget}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
      />
      <BanUserDialog
        user={banTarget}
        open={!!banTarget}
        onOpenChange={(open) => !open && setBanTarget(null)}
      />
      <UnbanUserDialog
        user={unbanTarget}
        open={!!unbanTarget}
        onOpenChange={(open) => !open && setUnbanTarget(null)}
      />
      <ManageScrymeAccessDialog
        user={scrymeAccessTarget}
        open={!!scrymeAccessTarget}
        onOpenChange={(open) => !open && setScrymeAccessTarget(null)}
      />
    </div>
  );
}
