"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, CreditCard, Smartphone, Building2, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Switch } from "@repo/ui/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import {
  saveSystemPaymentConfigs,
  type SystemPaymentConfigs,
} from "@/app/actions/billing"

export function PaymentConfigsPanel({ configs }: { configs: SystemPaymentConfigs }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [enabledMethods, setEnabledMethods] = useState<string[]>(configs.enabledMethods || ["mpesa", "card"])

  // M-Pesa State
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState(configs.mpesa?.consumerKey || "")
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState(configs.mpesa?.consumerSecret || "")
  const [mpesaShortCode, setMpesaShortCode] = useState(configs.mpesa?.shortCode || "")
  const [mpesaPassKey, setMpesaPassKey] = useState(configs.mpesa?.passKey || "")
  const [mpesaType, setMpesaType] = useState<"PAYBILL" | "TILL">(configs.mpesa?.type || "PAYBILL")
  const [mpesaEnv, setMpesaEnv] = useState<"SANDBOX" | "PRODUCTION">(configs.mpesa?.environment || "SANDBOX")

  // Stripe State
  const [stripePub, setStripePub] = useState(configs.stripe?.publishableKey || "")
  const [stripeSecret, setStripeSecret] = useState(configs.stripe?.secretKey || "")
  const [stripeWebhook, setStripeWebhook] = useState(configs.stripe?.webhookSecret || "")

  // Dodo State
  const [dodoApiKey, setDodoApiKey] = useState(configs.dodo?.apiKey || "")
  const [dodoEnv, setDodoEnv] = useState<"sandbox" | "live">(configs.dodo?.environment || "sandbox")

  // Bank Transfer State
  const [bankName, setBankName] = useState(configs.bankTransfer?.bankName || "")
  const [accountName, setAccountName] = useState(configs.bankTransfer?.accountName || "")
  const [accountNumber, setAccountNumber] = useState(configs.bankTransfer?.accountNumber || "")
  const [swiftCode, setSwiftCode] = useState(configs.bankTransfer?.swiftCode || "")
  const [instructions, setInstructions] = useState(configs.bankTransfer?.instructions || "")

  function toggleMethod(method: string) {
    if (enabledMethods.includes(method)) {
      setEnabledMethods(enabledMethods.filter((m) => m !== method))
    } else {
      setEnabledMethods([...enabledMethods, method])
    }
  }

  async function handleSave() {
    setIsPending(true)
    try {
      const payload: SystemPaymentConfigs = {
        enabledMethods,
        mpesa: {
          consumerKey: mpesaConsumerKey,
          consumerSecret: mpesaConsumerSecret,
          shortCode: mpesaShortCode,
          passKey: mpesaPassKey,
          type: mpesaType,
          environment: mpesaEnv,
        },
        stripe: {
          publishableKey: stripePub,
          secretKey: stripeSecret,
          webhookSecret: stripeWebhook,
        },
        dodo: {
          apiKey: dodoApiKey,
          environment: dodoEnv,
        },
        bankTransfer: {
          bankName,
          accountName,
          accountNumber,
          swiftCode,
          instructions,
        },
      }

      await saveSystemPaymentConfigs(payload)
      toast.success("System payment configurations saved")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save payment configs")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active Methods Toggle */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CreditCard className="size-4 text-primary" />
            Platform Payment Methods
          </CardTitle>
          <CardDescription>
            Enable or disable system-wide payment options available for subscriptions and purchases.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">M-Pesa STK Push</span>
              <span className="text-xs text-muted-foreground">Safaricom Mobile Money</span>
            </div>
            <Switch
              checked={enabledMethods.includes("mpesa")}
              onCheckedChange={() => toggleMethod("mpesa")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Card / Stripe</span>
              <span className="text-xs text-muted-foreground">Credit & Debit Cards</span>
            </div>
            <Switch
              checked={enabledMethods.includes("card")}
              onCheckedChange={() => toggleMethod("card")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Dodo Payments</span>
              <span className="text-xs text-muted-foreground">Global Merchant of Record</span>
            </div>
            <Switch
              checked={enabledMethods.includes("dodo")}
              onCheckedChange={() => toggleMethod("dodo")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Bank Wire Transfer</span>
              <span className="text-xs text-muted-foreground">Direct Account Deposit</span>
            </div>
            <Switch
              checked={enabledMethods.includes("bank_transfer")}
              onCheckedChange={() => toggleMethod("bank_transfer")}
            />
          </div>
        </CardContent>
      </Card>

      {/* M-Pesa Gateway Config */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Smartphone className="size-4 text-emerald-500" />
            Safaricom M-Pesa API Gateway
          </CardTitle>
          <CardDescription>
            Credentials for Daraja 2.0 API STK Push and C2B payment processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mpesa-shortcode">Paybill / Till Number</Label>
              <Input
                id="mpesa-shortcode"
                placeholder="e.g. 174379"
                value={mpesaShortCode}
                onChange={(e) => setMpesaShortCode(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mpesa-type">Shortcode Type</Label>
              <Select value={mpesaType} onValueChange={(val: any) => setMpesaType(val)}>
                <SelectTrigger id="mpesa-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYBILL">Paybill</SelectItem>
                  <SelectItem value="TILL">Till Number (Buy Goods)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mpesa-env">Environment</Label>
              <Select value={mpesaEnv} onValueChange={(val: any) => setMpesaEnv(val)}>
                <SelectTrigger id="mpesa-env">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SANDBOX">Sandbox (Testing)</SelectItem>
                  <SelectItem value="PRODUCTION">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mpesa-key">Consumer Key</Label>
              <Input
                id="mpesa-key"
                type="password"
                placeholder="Consumer Key from Safaricom Developer Portal"
                value={mpesaConsumerKey}
                onChange={(e) => setMpesaConsumerKey(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mpesa-secret">Consumer Secret</Label>
              <Input
                id="mpesa-secret"
                type="password"
                placeholder="Consumer Secret"
                value={mpesaConsumerSecret}
                onChange={(e) => setMpesaConsumerSecret(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mpesa-passkey">Online Passkey (STK Push Passkey)</Label>
            <Input
              id="mpesa-passkey"
              type="password"
              placeholder="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
              value={mpesaPassKey}
              onChange={(e) => setMpesaPassKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stripe Gateway Config */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CreditCard className="size-4 text-indigo-500" />
            Stripe Payment Gateway
          </CardTitle>
          <CardDescription>
            API Credentials for credit card payments and automated subscription billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stripe-pub">Publishable Key</Label>
            <Input
              id="stripe-pub"
              placeholder="pk_test_..."
              value={stripePub}
              onChange={(e) => setStripePub(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stripe-secret">Secret Key</Label>
            <Input
              id="stripe-secret"
              type="password"
              placeholder="sk_test_..."
              value={stripeSecret}
              onChange={(e) => setStripeSecret(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stripe-webhook">Webhook Secret</Label>
            <Input
              id="stripe-webhook"
              type="password"
              placeholder="whsec_..."
              value={stripeWebhook}
              onChange={(e) => setStripeWebhook(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dodo Payments Config */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Key className="size-4 text-amber-500" />
            Dodo Payments Configuration
          </CardTitle>
          <CardDescription>
            Merchant of Record API integration settings for cross-border billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dodo-key">API Key</Label>
            <Input
              id="dodo-key"
              type="password"
              placeholder="dodo_api_..."
              value={dodoApiKey}
              onChange={(e) => setDodoApiKey(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dodo-env">Environment Mode</Label>
            <Select value={dodoEnv} onValueChange={(val: any) => setDodoEnv(val)}>
              <SelectTrigger id="dodo-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox / Test</SelectItem>
                <SelectItem value="live">Live / Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bank Wire Details */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Building2 className="size-4 text-blue-500" />
            Bank Wire Deposit Information
          </CardTitle>
          <CardDescription>
            Official bank details displayed to customers paying offline via bank transfer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                placeholder="e.g. Standard Chartered Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="acc-name">Account Name</Label>
              <Input
                id="acc-name"
                placeholder="e.g. Scryme Technologies Inc"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="acc-num">Account Number</Label>
              <Input
                id="acc-num"
                placeholder="e.g. 010023456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="swift">SWIFT / BIC Code</Label>
              <Input
                id="swift"
                placeholder="e.g. SCBLKENX"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="instructions">Payment Instructions & Remittance Note</Label>
            <Textarea
              id="instructions"
              rows={2}
              placeholder="Instructions for customer when sending wire transfer..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Payment Configurations
        </Button>
      </div>
    </div>
  )
}
