import { listUsers } from "@/app/actions/users"
import { UsersTable } from "@/components/users/users-table"

export default async function UsersPage() {
  const users = await listUsers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system users across all organizations ({users.length} total).
        </p>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
