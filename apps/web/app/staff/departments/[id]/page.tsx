import { Metadata } from "next";
import React from "react";
import { getDepartmentDetail } from "../../../actions/department";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  Users,
  Wallet,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import Link from "next/link";
import { DepartmentMemberTable } from "../../../../components/departments/detail/department-member-table";
import { DepartmentBudgetTable } from "../../../../components/departments/detail/department-budget-table";
import { DepartmentApprovalTable } from "../../../../components/departments/detail/department-approval-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { DetailActions } from "./detail-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getDepartmentDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const dept = result.data;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header Banner */}
      <div className="h-48 bg-zinc-900 relative overflow-hidden">
        {dept.banner ? (
          <Image
            src={dept.banner}
            alt="banner"
            fill
            className="object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-emerald-500/20" />
        )}
        <div className="absolute bottom-6 left-8 right-0 flex items-end gap-6">
          <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden shrink-0 relative">
            {dept.image ? (
              <Image
                src={dept.image}
                alt="logo"
                fill
                className="object-cover"
              />
            ) : (
              <Building2 size={40} className="text-muted-foreground" />
            )}
          </div>
          <div className="mb-2 flex-1">
            <h1 className="text-3xl font-bold text-white">{dept.name}</h1>
            <div className="flex items-center gap-2 text-zinc-300 mt-1">
              <Building2 size={14} />
              <span className="text-sm">Department Overview</span>
            </div>
          </div>
          <div className="mb-2 pr-8">
            <DetailActions department={dept} />
          </div>
        </div>
        <div className="absolute top-6 left-6">
          <Link href="/staff/departments">
            <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-md">
              <ChevronLeft size={16} />
              <span>Back to Departments</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Info */}
            <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Info size={16} />
                  Department Details
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                  <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                    {dept.description || "No description provided for this department."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department Head</label>
                    <div className="flex items-center gap-2 mt-1">
                      {dept.head ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={dept.head.user.image ?? undefined} />
                            <AvatarFallback>{dept.head.user.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{dept.head.user.name ?? "Unknown"}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created On</label>
                    <div className="flex items-center gap-2 mt-1 text-sm font-medium">
                      <Calendar size={14} className="text-muted-foreground" />
                      {format(new Date(dept.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Wallet size={16} />
                Current Budget
              </h3>

              {dept.activeBudget ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active: {dept.activeBudget.name}</span>
                      <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white border-none text-[10px]">IN PROGRESS</Badge>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      KES {Number(dept.activeBudget.amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                      Ends on {format(new Date(dept.activeBudget.periodEnd), "MMM dd, yyyy")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-bold">{Math.round((Number(dept.activeBudget.spentAmount) / Number(dept.activeBudget.amount)) * 100) || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(Math.round((Number(dept.activeBudget.spentAmount) / Number(dept.activeBudget.amount)) * 100), 100) || 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Spent: KES {Number(dept.activeBudget.spentAmount).toLocaleString()} / Total: KES {Number(dept.activeBudget.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                  <Wallet size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No active budget set</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Main Content Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="bg-card border border-border p-1 rounded-xl w-full justify-start h-auto mb-6 overflow-x-auto">
                <TabsTrigger value="members" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground">
                  <Users size={16} />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="budgets" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground">
                  <Wallet size={16} />
                  <span>Budgets</span>
                </TabsTrigger>
                <TabsTrigger value="approvals" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground">
                  <ShieldCheck size={16} />
                  <span>Approval Chains</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-0">
                <DepartmentMemberTable
                  departmentId={dept.id}
                  members={dept.departmentMembers}
                />
              </TabsContent>

              <TabsContent value="budgets" className="mt-0">
                <DepartmentBudgetTable
                  departmentId={dept.id}
                  activeBudgetId={dept.activeBudgetId}
                  budgets={dept.budgets}
                />
              </TabsContent>

              <TabsContent value="approvals" className="mt-0">
                <DepartmentApprovalTable
                  departmentId={dept.id}
                  chains={dept.purchaseApprovalChains}
                  members={dept.departmentMembers}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Department Details",
  description: "Manage departmental members, roles, permissions, and organogram.",
};