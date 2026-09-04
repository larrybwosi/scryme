"use client"

import { useState } from "react"
import { ShieldAlert, ShieldCheck, UserX, UserCheck, Search, MessageSquare } from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { BanUserDialog } from "./ban-user-dialog"
import { UnbanUserDialog } from "./unban-user-dialog"
import { ManageScrymeAccessDialog } from "./manage-scryme-access-dialog"

export interface UserRow {
  id: string
  name: string | null
  email: string
  role: string | null
  isActive: boolean
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  _count: {
    members: number
  }
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState("")
  const [banTarget, setBanTarget] = useState<UserRow | null>(null)
  const [unbanTarget, setUnbanTarget] = useState<UserRow | null>(null)
  const [scrymeAccessTarget, setScrymeAccessTarget] = useState<UserRow | null>(null)

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Filter users by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No users found matching filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isBanned = user.banned ?? false
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase">
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isBanned ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="destructive" className="w-fit gap-1">
                            <ShieldAlert className="size-3" aria-hidden="true" />
                            Banned
                          </Badge>
                          {user.banReason ? (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              Reason: {user.banReason}
                            </span>
                          ) : null}
                        </div>
                      ) : user.isActive ? (
                        <Badge variant="secondary" className="w-fit gap-1 text-emerald-600 bg-emerald-500/10">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user._count.members} org{user._count.members === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                          onClick={() => setScrymeAccessTarget(user)}
                        >
                          <MessageSquare className="size-3.5" aria-hidden="true" />
                          Chat Access
                        </Button>
                        {isBanned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => setUnbanTarget(user)}
                          >
                            <UserCheck className="size-3.5" aria-hidden="true" />
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

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
  )
}
