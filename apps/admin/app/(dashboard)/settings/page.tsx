import { listGlobalSettings, getPaymentTrackingStatus } from "@/app/actions/settings";
import { SettingsTable } from "@/components/settings/settings-table";
import { PaymentTrackingSwitcher } from "@/components/settings/payment-tracking-switcher";

export default async function SettingsPage() {
  const [settings, isPaymentTrackingEnabled] = await Promise.all([
    listGlobalSettings(),
    getPaymentTrackingStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system-wide configuration keys and global parameters (
          {settings.length} total).
        </p>
      </div>

      <PaymentTrackingSwitcher initialEnabled={isPaymentTrackingEnabled} />

      <SettingsTable settings={settings} />
    </div>
  );
}
