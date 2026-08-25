import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { requireSuperAdmin } from "@/app/actions/auth"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSuperAdmin()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={user.email} />
      <main className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
