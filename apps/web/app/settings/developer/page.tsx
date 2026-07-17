"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { Plus, Trash2, Key, Globe, ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeveloperSettings() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: "", redirectUri: "" });
  const [createdApp, setCreatedApp] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.oauth2.getClients();
      if (!error) {
        setApps(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async () => {
    try {
      const { data, error } = await authClient.oauth2.register({
        client_name: newApp.name,
        redirect_uris: [newApp.redirectUri],
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Application created successfully");
        setCreatedApp(data);
        fetchApps();
      }
    } catch (err) {
      toast.error("Failed to create application");
    }
  };

  const handleDeleteApp = async () => {
    if (!appToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await authClient.oauth2.deleteClient({
        client_id: appToDelete,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Application deleted");
        setAppToDelete(null);
        fetchApps();
      }
    } catch (err) {
      toast.error("Failed to delete application");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Settings</h1>
        <p className="text-muted-foreground">Manage your OAuth2 applications and API integrations.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>
              Applications you&apos;ve created to integrate with Scryme.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setCreatedApp(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create App
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              {!createdApp ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Create OAuth Application</DialogTitle>
                    <DialogDescription>
                      Register a new application to enable &quot;Login with Scryme&quot;.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Application Name</Label>
                      <Input
                        id="name"
                        placeholder="My Awesome App"
                        value={newApp.name}
                        onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="redirect">Redirect URI</Label>
                      <Input
                        id="redirect"
                        placeholder="https://yourapp.com/api/auth/callback/scryme"
                        value={newApp.redirectUri}
                        onChange={(e) => setNewApp({ ...newApp, redirectUri: e.target.value })}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Where we should redirect users after they authorize your app.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateApp} disabled={!newApp.name || !newApp.redirectUri}>
                      Create Application
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      Application Created
                    </DialogTitle>
                    <DialogDescription>
                      Store your client secret securely. It will not be shown again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
                      <AlertTitle className="text-amber-800 dark:text-amber-200">Warning</AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-300">
                        The client secret is only displayed once. If you lose it, you will need to rotate it.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={createdApp.client_id} className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdApp.client_id, "cid")}>
                          {copiedId === "cid" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={createdApp.client_secret} className="font-mono text-sm" type="text" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdApp.client_secret, "sec")}>
                          {copiedId === "sec" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsCreateOpen(false)} className="w-full">I&apos;ve saved it</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground italic">Loading applications...</div>
          ) : apps.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-lg">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No applications found</h3>
              <p className="text-muted-foreground mb-6">Create your first OAuth application to get started.</p>
              <Button onClick={() => setIsCreateOpen(true)}>Create Application</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Redirect URIs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => {
                  const appId = app.id || app.clientId || app.client_id;
                  const clientId = app.clientId || app.client_id;
                  const redirectUris = app.redirectUris || app.redirect_uris || [];
                  return (
                    <TableRow key={appId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-xs">
                            {app.name?.charAt(0) || "A"}
                          </div>
                          {app.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{clientId}</code>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {redirectUris.join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Copy Client ID"
                                onClick={() => copyToClipboard(clientId, appId)}
                              >
                                {copiedId === appId ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy Client ID</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                aria-label="Delete Application"
                                onClick={() => setAppToDelete(clientId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Application</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!appToDelete} onOpenChange={(open) => !open && !isDeleting && setAppToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the OAuth2 application
              and revoke all access tokens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteApp();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Application"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>
            Learn how to integrate &quot;Login with Scryme&quot; into your applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div
            className="flex flex-col p-4 rounded-lg border hover:bg-accent transition-colors group cursor-pointer"
            onClick={() => toast.info("Documentation is coming soon!")}
          >
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-primary" />
              <span className="font-semibold">OAuth2 Flow</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100" />
            </div>
            <p className="text-sm text-muted-foreground">
              Learn about our OAuth2 Authorization Code flow and OpenID Connect implementation.
            </p>
          </div>
          <div
            className="flex flex-col p-4 rounded-lg border hover:bg-accent transition-colors group cursor-pointer"
            onClick={() => toast.info("API Reference is coming soon!")}
          >
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-semibold">API Reference</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100" />
            </div>
            <p className="text-sm text-muted-foreground">
              Explore available V3 API endpoints for user info and organizational data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
