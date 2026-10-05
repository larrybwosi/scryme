"use client";

import React, { useEffect, useState, useMemo } from "react";
import { StaffTable } from "./staff-table";
import { InvitationsTable } from "./invitations-table";
import { RolesManager } from "./roles-manager";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Users, Mail, Shield, Search, Filter, Activity } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { useRealtime } from "@repo/shared/realtime/client";
import { useOrganizationStore } from "../../lib/stores/organization-store";

interface StaffClientViewProps {
  members: any[];
  invitations: any[];
}

export function StaffClientView({ members, invitations }: StaffClientViewProps) {
  const { subscribe, presence } = useRealtime();
  const organization = useOrganizationStore((state) => state.organization);
  const [onlineMembersMap, setOnlineMembersMap] = useState<Record<string, { app?: string; timestamp?: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const channel = organization?.id ? `presence:org:${organization.id}` : null;

  useEffect(() => {
    if (!channel) return;

    const unsubscribe = subscribe(channel, "presence:update", (data) => {
      if (data?.members && Array.isArray(data.members)) {
        const map: Record<string, { app?: string; timestamp?: number }> = {};
        data.members.forEach((m: any) => {
          const clientId = m.clientId;
          if (clientId) {
            map[clientId] = m.data || {};
          }
        });
        setOnlineMembersMap(map);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [channel, subscribe]);

  useEffect(() => {
    if (!channel) return;
    const currentMembers = presence.members[channel];
    if (currentMembers && Array.isArray(currentMembers)) {
      const map: Record<string, { app?: string; timestamp?: number }> = {};
      currentMembers.forEach((m) => {
        if (m.clientId) {
          map[m.clientId] = m.data || {};
        }
      });
      setOnlineMembersMap(map);
    }
  }, [presence.members, channel]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(query) ||
        m.user?.email?.toLowerCase().includes(query) ||
        m.role?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const onlineCount = useMemo(() => {
    return members.filter(
      (m) => onlineMembersMap[m.id] || onlineMembersMap[m.user?.id]
    ).length;
  }, [members, onlineMembersMap]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Total Members
          </p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {members.length}
            </h3>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Active
            </Badge>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Online Now
          </p>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-2xl font-bold text-foreground">
                {onlineCount}
              </h3>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Realtime</span>
            </Badge>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Admins</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {members.filter((m) => m.role === "ADMIN").length}
            </h3>
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Privileged
            </Badge>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Pending Invitations
          </p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {invitations.length}
            </h3>
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Awaiting Join
            </Badge>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Suspended
          </p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-destructive">
              {members.filter((m) => m.membershipStatus === "SUSPENDED").length}
            </h3>
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Action Required
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <TabsList className="bg-card border p-1 h-auto gap-1">
            <TabsTrigger
              value="members"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Users size={16} />
              Active Staff ({members.length})
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Mail size={16} />
              Pending Invitations ({invitations.length})
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Shield size={16} />
              Roles & Scopes
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-card"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Filter size={14} />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        <TabsContent value="members" className="outline-none">
          <StaffTable data={filteredMembers as any} onlineMembersMap={onlineMembersMap} />
        </TabsContent>

        <TabsContent value="invitations" className="outline-none">
          <InvitationsTable data={invitations as any} />
        </TabsContent>

        <TabsContent value="roles" className="outline-none pt-4">
          <RolesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
