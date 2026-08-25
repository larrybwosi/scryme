import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"

interface MemberRow {
  id: string
  role: string
  isActive: boolean
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    isActive: boolean
    banned: boolean | null
  }
}

export function MembersTable({ members }: { members: MemberRow[] }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Members</CardTitle>
        <CardDescription>Everyone with access to this organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No members yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-foreground">
                      {member.user.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal capitalize">
                        {member.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : member.isActive && member.user.isActive ? (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
