import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@repo/ui/components/ui/card'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { CheckCircle2, ListTodo, FolderKanban, ShieldCheck } from 'lucide-react'
import { useSession } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session, isPending } = useSession()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <FolderKanban className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Task Manager</h1>
        </div>

        <p className="text-muted-foreground text-lg">
          Manage tasks and projects across organizations with ease.
        </p>

        <Card className="text-left shadow-lg border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                Setup Status
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 inline" />
                Active
              </Badge>
            </div>
            <CardDescription>
              Task Manager application initialized successfully in <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">apps/tasks</code>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Authentication Status
              </div>
              <p className="text-sm text-muted-foreground">
                {isPending ? (
                  "Checking session..."
                ) : session ? (
                  `Logged in as ${session.user.email}`
                ) : (
                  "Auth client initialized (@repo/auth integration ready)."
                )}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline">Learn More</Button>
            <Button>Get Started</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
