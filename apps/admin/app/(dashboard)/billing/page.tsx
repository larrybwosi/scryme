import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { listTiers, listSubscriptions, listSystemPayments } from "@/app/actions/billing"
import { listOrganizations } from "@/app/actions/organizations"
import { TiersPanel } from "@/components/billing/tiers-panel"
import { SubscriptionsPanel } from "@/components/billing/subscriptions-panel"
import { PaymentsPanel } from "@/components/billing/payments-panel"

export default async function BillingPage() {
  const [tiers, subscriptions, payments, organizations] = await Promise.all([
    listTiers(),
    listSubscriptions(),
    listSystemPayments(),
    listOrganizations(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage plan tiers, organization subscriptions, and recorded payments.
        </p>
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="tiers" className="mt-6">
          <TiersPanel tiers={tiers} />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsPanel subscriptions={subscriptions} />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
