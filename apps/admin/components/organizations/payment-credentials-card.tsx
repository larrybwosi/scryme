"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Smartphone, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import { upsertOrganizationPaymentCredentials } from "@/app/actions/organizations";

interface PaymentCredentialsCardProps {
  organizationId: string;
  credentials: {
    id?: string;
    mpesaShortCode?: string;
    mpesaType?: string;
    mpesaConsumerKey?: string;
    mpesaConsumerSecret?: string;
    mpesaPassKey?: string | null;
    mpesaInitiatorPass?: string | null;
    environment?: "SANDBOX" | "PRODUCTION";
  } | null;
}

export function OrganizationPaymentCredentialsCard({
  organizationId,
  credentials,
}: PaymentCredentialsCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [shortCode, setShortCode] = useState(credentials?.mpesaShortCode || "");
  const [type, setType] = useState(credentials?.mpesaType || "PAYBILL");
  const [consumerKey, setConsumerKey] = useState(
    credentials?.mpesaConsumerKey || "",
  );
  const [consumerSecret, setConsumerSecret] = useState(
    credentials?.mpesaConsumerSecret || "",
  );
  const [passKey, setPassKey] = useState(credentials?.mpesaPassKey || "");
  const [initiatorPass, setInitiatorPass] = useState(
    credentials?.mpesaInitiatorPass || "",
  );
  const [environment, setEnvironment] = useState<"SANDBOX" | "PRODUCTION">(
    credentials?.environment || "SANDBOX",
  );

  async function handleSave() {
    if (!shortCode || !consumerKey || !consumerSecret) {
      toast.error(
        "Please fill in M-Pesa Shortcode, Consumer Key, and Consumer Secret",
      );
      return;
    }

    setIsPending(true);
    try {
      await upsertOrganizationPaymentCredentials(organizationId, {
        mpesaShortCode: shortCode,
        mpesaType: type,
        mpesaConsumerKey: consumerKey,
        mpesaConsumerSecret: consumerSecret,
        mpesaPassKey: passKey || undefined,
        mpesaInitiatorPass: initiatorPass || undefined,
        environment,
      });
      toast.success("Organization payment credentials saved");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payment credentials",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Smartphone className="size-4 text-emerald-500" />
            Organization Payment Credentials (M-Pesa)
          </CardTitle>
          <CardDescription>
            Configure dedicated M-Pesa Till or Paybill API credentials for this
            specific organization.
          </CardDescription>
        </div>
        {credentials ? (
          <Badge
            variant="secondary"
            className="gap-1 text-emerald-600 bg-emerald-500/10"
          >
            <CheckCircle2 className="size-3" />
            Configured
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Unconfigured
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-shortcode">Paybill / Till Number</Label>
            <Input
              id="org-shortcode"
              placeholder="e.g. 600100 or 123456"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-type">Shortcode Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="org-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYBILL">Paybill</SelectItem>
                <SelectItem value="TILL">Till Number (Buy Goods)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-env">Environment</Label>
            <Select
              value={environment}
              onValueChange={(v: any) => setEnvironment(v)}
            >
              <SelectTrigger id="org-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SANDBOX">Sandbox</SelectItem>
                <SelectItem value="PRODUCTION">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-key" className="flex items-center gap-1.5">
              <Lock className="size-3 text-muted-foreground" />
              Consumer Key
            </Label>
            <Input
              id="org-key"
              type="password"
              placeholder="Consumer Key"
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-secret" className="flex items-center gap-1.5">
              <Lock className="size-3 text-muted-foreground" />
              Consumer Secret
            </Label>
            <Input
              id="org-secret"
              type="password"
              placeholder="Consumer Secret"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-passkey">Online Passkey (STK Push)</Label>
            <Input
              id="org-passkey"
              type="password"
              placeholder="Passkey"
              value={passKey}
              onChange={(e) => setPassKey(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-initpass">Initiator Password (Optional)</Label>
            <Input
              id="org-initpass"
              type="password"
              placeholder="B2C Initiator Password"
              value={initiatorPass}
              onChange={(e) => setInitiatorPass(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save Payment Credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
