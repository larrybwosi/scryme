import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Users,
  CreditCard,
  Boxes,
  HardDrive,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  getOrganizationDetails,
  getOrganizationMembers,
  getEffectiveQuota,
  getOrganizationStorageUsage,
  getOrganizationPaymentCredentials,
  getOrganizationModules,
} from "@/app/actions/organizations";
import {
  getOrganizationActivityLogs,
  getOrganizationUsage,
} from "@/app/actions/dashboard";
import { getOrganizationSubscription, listTiers } from "@/app/actions/billing";
import { SuspensionControl } from "@/components/organizations/suspension-control";
import { QuotaEditor } from "@/components/organizations/quota-editor";
import { StorageControl } from "@/components/organizations/storage-control";
import { SubscriptionEditor } from "@/components/organizations/subscription-editor";
import { MembersTable } from "@/components/organizations/members-table";
import { OrganizationActivityPanel } from "@/components/organizations/organization-activity-panel";
import { OrganizationPaymentCredentialsCard } from "@/components/organizations/payment-credentials-card";
import { OrgModuleEditor } from "@/components/organizations/module-editor";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const org = await getOrganizationDetails(id).catch(() => null);
  if (!org) notFound();

  const [
    members,
    quota,
    subscription,
    tiers,
    storage,
    usage,
    activityLogs,
    credentials,
    modules,
  ] = await Promise.all([
    getOrganizationMembers(id),
    getEffectiveQuota(id),
    getOrganizationSubscription(id),
    listTiers(),
    getOrganizationStorageUsage(id),
    getOrganizationUsage(id),
    getOrganizationActivityLogs(id, 15),
    getOrganizationPaymentCredentials(id),
    getOrganizationModules(id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Top Breadcrumb & Tenant Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/organizations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Organizations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {org.name}
              </h1>
              {org.isSuspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              /{org.slug} · {org._count.members} members · {org._count.products}{" "}
              products · {org._count.transactions} transactions
            </p>
          </div>
          <SuspensionControl
            organizationId={org.id}
            isSuspended={org.isSuspended}
            suspensionReason={org.suspensionReason}
          />
        </div>
      </div>

      {/* Tabs Layout for Optimal Developer & Admin Experience */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-muted/60 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm">
            <Activity className="size-4" aria-hidden="true" />
            Overview & Activity
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 text-xs sm:text-sm">
            <Users className="size-4" aria-hidden="true" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 text-xs sm:text-sm">
            <CreditCard className="size-4" aria-hidden="true" />
            Billing & Quotas
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2 text-xs sm:text-sm">
            <Boxes className="size-4" aria-hidden="true" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2 text-xs sm:text-sm">
            <HardDrive className="size-4" aria-hidden="true" />
            Storage
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview & Activity */}
        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <OrganizationActivityPanel
            usage={usage}
            activityLogs={activityLogs}
            acquisitionSource={org.acquisitionSource}
          />
        </TabsContent>

        {/* Tab: Members */}
        <TabsContent value="members" className="mt-0 focus-visible:outline-none">
          <MembersTable members={members} />
        </TabsContent>

        {/* Tab: Billing & Quotas */}
        <TabsContent value="billing" className="mt-0 space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SubscriptionEditor
              organizationId={org.id}
              subscription={subscription}
              tiers={tiers}
            />
            <QuotaEditor organizationId={org.id} quota={quota} />
          </div>

          <OrganizationPaymentCredentialsCard
            organizationId={org.id}
            credentials={credentials}
          />
        </TabsContent>

        {/* Tab: Modules */}
        <TabsContent value="modules" className="mt-0 focus-visible:outline-none">
          <OrgModuleEditor organizationId={org.id} initialModules={modules} />
        </TabsContent>

        {/* Tab: Storage */}
        <TabsContent value="storage" className="mt-0 focus-visible:outline-none">
          <StorageControl organizationId={org.id} storage={storage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
