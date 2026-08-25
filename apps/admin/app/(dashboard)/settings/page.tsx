import { listGlobalSettings } from "@/app/actions/settings"
import { SettingsTable } from "@/components/settings/settings-table"

export default async function SettingsPage() {
  const settings = await listGlobalSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system-wide configuration keys and global parameters ({settings.length} total).
        </p>
      </div>

      <SettingsTable settings={settings} />
    </div>
  )
}
