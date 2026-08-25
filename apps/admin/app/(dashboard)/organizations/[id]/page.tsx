import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  getOrganizationDetails,
  getOrganizationMembers,
  getEffectiveQuota,
  getOrganizationStorageUsage,
} from "@/app/actions/organizations"
import { getOrganizationSubscription, listTiers } from "@/app/actions/billing"
import { SuspensionControl } from "@/components/organizations/suspension-control"
import { QuotaEditor } from "@/components/organizations/quota-editor"
import { StorageControl } from "@/components/organizations/storage-control"
import { SubscriptionEditor } from "@/components/organizations/subscription-editor"
import { MembersTable } from "@/components/organizations/members-table"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const org = await getOrganizationDetails(id).catch(() => null)
  if (!org) notFound()

  const [members, quota, subscription, tiers, storage] = await Promise.all([
    getOrganizationMembers(id),
    getEffectiveQuota(id),
    getOrganizationSubscription(id),
    listTiers(),
    getOrganizationStorageUsage(id),
  ])

  return (
    <div className="flex flex-col gap-8">
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
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{org.name}</h1>
              {org.isSuspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              /{org.slug} · {org._count.members} members · {org._count.products} products ·{" "}
              {org._count.transactions} transactions
            </p>
          </div>
          <SuspensionControl
            organizationId={org.id}
            isSuspended={org.isSuspended}
            suspensionReason={org.suspensionReason}
          />
        </div>
      </div>

      <StorageControl organizationId={org.id} storage={storage} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SubscriptionEditor organizationId={org.id} subscription={subscription} tiers={tiers} />
        <QuotaEditor organizationId={org.id} quota={quota} />
      </div>

      <MembersTable members={members} />
    </div>
  )
}
