"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { ChefHat, Loader2, UserCheck, UserX } from "lucide-react";
import {
  getMemberBakeryStatus,
  addMemberToBakeryStaff,
  removeMemberFromBakeryStaff,
} from "../../../app/actions/staff";
import { toast } from "sonner";

export function BakeryStaffCard({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isBaker, setIsBaker] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      setLoading(true);
      const res = await getMemberBakeryStatus(memberId);
      if (isMounted) {
        if (res.success) {
          setIsBaker(!!res.isBaker);
        }
        setLoading(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [memberId]);

  const handleToggle = async () => {
    setUpdating(true);
    if (isBaker) {
      const res = await removeMemberFromBakeryStaff(memberId);
      if (res.success) {
        setIsBaker(false);
        toast.success("Member removed from production staff");
      } else {
        toast.error(res.error || "Failed to remove member from production staff");
      }
    } else {
      const res = await addMemberToBakeryStaff(memberId);
      if (res.success) {
        setIsBaker(true);
        toast.success("Member added to production staff as baker");
      } else {
        toast.error(res.error || "Failed to add member to production staff");
      }
    }
    setUpdating(false);
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ChefHat size={20} className="text-blue-500" />
            Production & Bakery Staff
          </CardTitle>
          {!loading && (
            <Badge
              className={
                isBaker
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }
            >
              {isBaker ? "Authorized Baker" : "Not Production Staff"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-muted-foreground">
          Authorize this member as production staff to perform batch operations in the Bakery app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking production staff authorization...
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-foreground">
                {isBaker ? "Production Staff Authorized" : "Not in Production Roster"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isBaker
                  ? "Member is listed as a baker in production workflows."
                  : "Add member to enable assignment in bakery batches and schedules."}
              </p>
            </div>
            <Button
              type="button"
              variant={isBaker ? "outline" : "default"}
              size="sm"
              onClick={handleToggle}
              disabled={updating}
              className={
                isBaker
                  ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                  : "bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              }
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBaker ? (
                <>
                  <UserX size={14} />
                  Remove from Production Staff
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  Add to Production Staff
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
