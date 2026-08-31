"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  CreditCard,
  Users,
  Plug,
  Settings,
  LogOut,
  ShieldCheck,
  Cpu,
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/ui/button"
import { authClient } from "@/lib/auth-client"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/systems", label: "Platform Systems", icon: Cpu },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/15">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight text-foreground">Platform Admin</span>
          <span className="text-xs leading-tight text-muted-foreground">Scryme</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border px-3 py-4">
        {userEmail ? <p className="truncate px-3 text-xs text-muted-foreground">{userEmail}</p> : null}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/login"
                },
              },
            })
          }
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
