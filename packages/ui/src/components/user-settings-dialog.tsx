"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  User,
  Settings2,
  HelpCircle,
  RotateCcw,
  LogOut,
  Shield,
  Building2,
  Mail,
  Key,
  Bell,
  Sparkles,
  Volume2,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
  activeOrgName?: string;
  onSignOut?: () => void;
  onLaunchTour?: () => void;
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
  activeOrgName,
  onSignOut,
  onLaunchTour,
}: UserSettingsDialogProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 bg-muted/40 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border shadow-xs">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user.name || "User"} />
                ) : null}
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-base">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {user?.name || "User Settings"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage your personal account, application preferences, and setup
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1 font-mono text-[11px] px-2 py-0.5">
              <Shield className="h-3 w-3 text-indigo-500" />
              {user?.role || "Member"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <div className="px-6 pt-3 bg-muted/20 border-b">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="profile" className="gap-2 text-xs">
                <User className="h-3.5 w-3.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2 text-xs">
                <Settings2 className="h-3.5 w-3.5" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="setup" className="gap-2 text-xs">
                <HelpCircle className="h-3.5 w-3.5" />
                Setup & Help
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Full Name</span>
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {user?.name || "Not provided"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-card/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Email Address</span>
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {user?.email || "Not provided"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-card/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Active Organization</span>
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {activeOrgName || "None selected"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-card/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Key className="h-3.5 w-3.5 text-indigo-500" />
                      <span>User ID</span>
                    </div>
                    <p className="text-xs font-mono font-semibold truncate text-muted-foreground">
                      {user?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Session Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    Currently authenticated
                  </p>
                </div>
                {onSignOut && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onSignOut();
                    }}
                    className="gap-2 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="mt-0 space-y-5">
              {/* Theme Toggle Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Appearance Mode
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all text-xs font-medium",
                      mounted && theme === "light"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all text-xs font-medium",
                      mounted && theme === "dark"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all text-xs font-medium",
                      mounted && theme === "system"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Laptop className="h-4 w-4" />
                    System
                  </button>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notification Settings
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifs" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5 text-indigo-500" />
                        Email Notifications
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Receive operational summaries and critical security alerts
                      </p>
                    </div>
                    <Switch
                      id="email-notifs"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="desktop-alerts" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        Desktop Alerts
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Show real-time toast popups for sales and stock updates
                      </p>
                    </div>
                    <Switch
                      id="desktop-alerts"
                      checked={desktopAlerts}
                      onCheckedChange={setDesktopAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="sound-effects" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                        <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                        Audio Feedback
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Play sound notifications on barcode scanning or sale completion
                      </p>
                    </div>
                    <Switch
                      id="sound-effects"
                      checked={soundEffects}
                      onCheckedChange={setSoundEffects}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Setup & Help Tab */}
            <TabsContent value="setup" className="mt-0 space-y-4">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-transparent space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Interactive Onboarding Tour</h4>
                    <p className="text-xs text-muted-foreground">
                      Re-run the step-by-step walkthrough of key system modules
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  The tour guides you through organization settings, inventory management, branch locations, sales POS, and staff permissions.
                </p>

                {onLaunchTour && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onLaunchTour();
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Launch Setup Guide Tour
                  </Button>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
