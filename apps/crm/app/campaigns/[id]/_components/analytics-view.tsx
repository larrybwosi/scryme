"use client";

import React from "react";
import {
  ArrowLeft,
  Mail,
  MousePointer2,
  UserCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Target,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  submitCampaignForApproval,
  approveCampaign,
  rejectCampaign,
} from "../../actions";
import { toast } from "sonner";

interface CampaignAnalyticsViewProps {
  campaign: any;
  memberId: string;
}

export function CampaignAnalyticsView({
  campaign,
  memberId,
}: CampaignAnalyticsViewProps) {
  const router = useRouter();

  if (!campaign) return <div>Campaign not found</div>;

  const openRate =
    campaign.totalSent > 0
      ? (campaign.totalOpened / campaign.totalSent) * 100
      : 0;
  const clickRate =
    campaign.totalSent > 0
      ? (campaign.totalClicked / campaign.totalSent) * 100
      : 0;
  const convRate =
    campaign.totalSent > 0
      ? (campaign.totalConverted / campaign.totalSent) * 100
      : 0;

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {campaign.name}
              </h1>
              <Badge>{campaign.status}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar size={14} /> Created on{" "}
              {new Date(campaign.createdAt).toLocaleDateString()} by{" "}
              {campaign.createdBy?.user?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {campaign.status === "DRAFT" && (
            <Button
              variant="outline"
              onClick={async () => {
                await submitCampaignForApproval(campaign.id);
                toast.success("Campaign submitted for approval");
                router.refresh();
              }}
            >
              Submit for Approval
            </Button>
          )}
          {campaign.status === "PENDING_APPROVAL" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600"
                onClick={async () => {
                  await rejectCampaign(campaign.id);
                  toast.success("Campaign rejected");
                  router.refresh();
                }}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  await approveCampaign(campaign.id, memberId);
                  toast.success("Campaign approved");
                  router.refresh();
                }}
              >
                Approve
              </Button>
            </div>
          )}
          <Button variant="outline">Edit Campaign</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase text-slate-500">
              Reach
            </CardDescription>
            <CardTitle className="text-2xl flex items-center justify-between">
              {campaign.totalSent?.toLocaleString()}
              <Users className="h-4 w-4 text-slate-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Total Recipients
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase text-slate-500">
              Engagement
            </CardDescription>
            <CardTitle className="text-2xl flex items-center justify-between">
              {Math.round(openRate)}%
              <Mail className="h-4 w-4 text-slate-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Open Rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase text-slate-500">
              Conversion
            </CardDescription>
            <CardTitle className="text-2xl flex items-center justify-between">
              {Math.round(convRate)}%
              <Target className="h-4 w-4 text-slate-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Conversion Rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase text-slate-500">
              Revenue
            </CardDescription>
            <CardTitle className="text-2xl flex items-center justify-between font-bold text-orange-600">
              ${Number(campaign.totalRevenue || 0).toLocaleString()}
              <DollarSign className="h-4 w-4 text-slate-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Attributed Sales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Funnel Performance</CardTitle>
                <CardDescription>
                  Track the journey from delivery to conversion.
                </CardDescription>
              </div>
              <BarChart3 className="text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" /> Delivered
                </span>
                <span>100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <ExternalLink size={14} className="text-green-500" /> Opened
                </span>
                <span>{Math.round(openRate)}%</span>
              </div>
              <Progress value={openRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <MousePointer2 size={14} className="text-purple-500" />{" "}
                  Clicked
                </span>
                <span>{Math.round(clickRate)}%</span>
              </div>
              <Progress value={clickRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <DollarSign size={14} className="text-orange-500" /> Converted
                </span>
                <span>{Math.round(convRate)}%</span>
              </div>
              <Progress value={convRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Campaign configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Channel</span>
              <span className="font-medium">{campaign.channel}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Segment</span>
              <span className="font-medium">
                {campaign.segment?.name || "All Customers"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Workflow</span>
              <span className="font-medium">
                {campaign.workflow?.name || "None"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Scheduled For</span>
              <span className="font-medium">
                {campaign.scheduledAt
                  ? new Date(campaign.scheduledAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                Description
              </h4>
              <p className="text-sm text-slate-600 italic">
                {campaign.description ||
                  "No description provided for this campaign."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Real-time feed of campaign interactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.events?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No events tracked yet.
                  </TableCell>
                </TableRow>
              ) : (
                campaign.events?.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.record?.data?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.transaction
                        ? `$${Number(event.transaction.finalTotal).toLocaleString()}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
