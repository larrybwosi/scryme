import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";

interface MemberRow {
  id: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
    banned: boolean | null;
  };
}

export function MembersTable({ members }: { members: MemberRow[] }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Members
        </CardTitle>
        <CardDescription>
          Everyone with access to this organization ({members.length} total).
        </CardDescription>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No members yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      <Link
                        href={`/users/${member.user.id}`}
                        className="hover:underline"
                      >
                        {member.user.name || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link
                        href={`/users/${member.user.id}`}
                        className="hover:underline"
                      >
                        {member.user.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-normal capitalize"
                      >
                        {member.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : member.isActive && member.user.isActive ? (
                        <Badge
                          variant="secondary"
                          className="text-muted-foreground"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/users/${member.user.id}`}
                        aria-label={`View ${member.user.name || member.user.email}`}
                      >
                        <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
