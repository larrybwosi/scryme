import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import {
  listTiers,
  listSubscriptions,
  listSystemPayments,
  getSystemPaymentConfigs,
  getDefaultQuotaAllocations,
} from "@/app/actions/billing"
import { listOrganizations } from "@/app/actions/organizations"
import { TiersPanel } from "@/components/billing/tiers-panel"
import { SubscriptionsPanel } from "@/components/billing/subscriptions-panel"
import { PaymentsPanel } from "@/components/billing/payments-panel"
import { PaymentConfigsPanel } from "@/components/billing/payment-configs-panel"
import { DefaultQuotasPanel } from "@/components/billing/default-quotas-panel"

export default async function BillingPage() {
  const [tiers, subscriptions, payments, organizations, paymentConfigs, defaultQuotas] =
    await Promise.all([
      listTiers(),
      listSubscriptions(),
      listSystemPayments(),
      listOrganizations(),
      getSystemPaymentConfigs(),
      getDefaultQuotaAllocations(),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing & System Quotas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage plan tiers, system default quotas, payment gateway configurations, organization subscriptions, and transaction receipts.
        </p>
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">Tiers & Quotas</TabsTrigger>
          <TabsTrigger value="payment-configs">Payment Gateways</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="default-quotas">Default Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="mt-6">
          <TiersPanel tiers={tiers} />
        </TabsContent>

        <TabsContent value="payment-configs" className="mt-6">
          <PaymentConfigsPanel configs={paymentConfigs} />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsPanel subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel payments={payments} organizations={organizations} tiers={tiers} />
        </TabsContent>

        <TabsContent value="default-quotas" className="mt-6">
          <DefaultQuotasPanel initialAllocations={defaultQuotas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
