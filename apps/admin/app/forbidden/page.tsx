"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { authClient } from "@/lib/auth-client"

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-6 text-destructive" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Access restricted</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This console is limited to platform super administrators. Your account does not have the required
            permissions to view this page.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/login">Sign in with a different account</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
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
            Sign out
          </Button>
        </div>
      </div>
    </main>
  )
}
