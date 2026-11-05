import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  KeyRound,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Globe,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { getUserDetails } from "@/app/actions/users";
import { UserDetailsActions } from "@/components/users/user-details-actions";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getUserDetails(id).catch(() => null);
  if (!user) notFound();

  const isBanned = user.banned ?? false;

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Back Link */}
      <div className="flex flex-col gap-4">
        <Link
          href="/users"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Users
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {user.name || "Unnamed User"}
              </h1>
              <Badge variant="outline" className="font-mono text-xs uppercase">
                {user.role || "user"}
              </Badge>
              {isBanned ? (
                <Badge variant="destructive" className="gap-1">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  Banned
                </Badge>
              ) : user.isActive ? (
                <Badge
                  variant="secondary"
                  className="gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-200"
                >
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden="true" />
                {user.email}
              </span>
              <span>·</span>
              <span className="font-mono text-xs text-muted-foreground">
                ID: {user.id}
              </span>
              {user.username && (
                <>
                  <span>·</span>
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                </>
              )}
            </p>
          </div>

          <UserDetailsActions
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              banned: user.banned,
              banReason: user.banReason,
              banExpires: user.banExpires,
              acquisitionSource: user.acquisitionSource,
              createdAt: user.createdAt,
              _count: {
                members: user._count.members,
              },
            }}
          />
        </div>
      </div>

      {/* Ban Warning if Banned */}
      {isBanned && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex flex-col gap-1">
          <span className="font-medium flex items-center gap-2">
            <ShieldAlert className="size-4" aria-hidden="true" />
            This user account is currently suspended / banned
          </span>
          {user.banReason && (
            <p className="text-xs text-muted-foreground">
              Reason: {user.banReason}
            </p>
          )}
          {user.banExpires && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(user.banExpires).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Joined Platform</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              {new Date(user.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Updated: {new Date(user.updatedAt).toLocaleDateString()}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Acquisition Source</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              {user.acquisitionSource || "Direct / Organic"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Referral: {user.referralCode || "None"}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Security & Auth</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              {user.twoFactorEnabled ? "2FA Enabled" : "Standard Auth"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {user.emailVerified ? "Email verified" : "Email unverified"}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Active Tenants</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              {user._count.members} Organization{user._count.members === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {user._count.sessions} active session{user._count.sessions === 1 ? "" : "s"}
          </CardContent>
        </Card>
      </div>

      {/* Organization Memberships Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Organization Memberships
          </CardTitle>
          <CardDescription>
            Organizations where this user is an active or assigned team member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tenant Role</TableHead>
                  <TableHead>Membership Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      This user does not belong to any organizations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  user.members.map((member) => (
                    <TableRow key={member.id} className="group">
                      <TableCell className="font-medium text-foreground">
                        <Link
                          href={`/organizations/${member.organization.id}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {member.organization.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        /{member.organization.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono uppercase">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.organization.isSuspended ? (
                          <Badge variant="destructive">Org Suspended</Badge>
                        ) : member.isActive ? (
                          <Badge
                            variant="secondary"
                            className="text-emerald-600 bg-emerald-500/10 border-emerald-200"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {member.membershipStatus || "Inactive"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/organizations/${member.organization.id}`}
                          aria-label={`View ${member.organization.name}`}
                        >
                          <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
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

      {/* Linked Accounts & Recent Sessions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Linked OAuth Accounts */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Linked Accounts
            </CardTitle>
            <CardDescription>
              Authentication providers and identity links connected to this user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Standard email and password authentication.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {user.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground capitalize">
                        {acc.providerId}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Linked on {new Date(acc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Recent Sessions
            </CardTitle>
            <CardDescription>
              Latest active and historical browser and API sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active sessions recorded.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {user.sessions.map((sess) => {
                  const isExpired = new Date(sess.expiresAt) < new Date();
                  return (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between p-3 text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-foreground font-medium">
                          {sess.ipAddress || "Unknown IP"}
                        </span>
                        <span
                          className="text-muted-foreground max-w-xs truncate"
                          title={sess.userAgent || "Unknown Device"}
                        >
                          {sess.userAgent || "Desktop Browser"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isExpired ? (
                          <Badge variant="outline" className="text-[10px]">
                            Expired
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-200"
                          >
                            Active
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(sess.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
