"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Megaphone,
  Mail,
  MessageSquare,
  UserCheck,
  Layout,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { getCampaigns } from "../../actions/campaigns";
import { CampaignForm } from "./campaign-form";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";

interface CampaignsViewProps {
  organizationId: string;
  memberId: string;
}

// SWR fetcher function
const fetcher = async (url: string, organizationId: string) => {
  const data = await getCampaigns(organizationId);
  return data;
};

export function CampaignsView({
  organizationId,
  memberId,
}: CampaignsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use SWR for data fetching
  const {
    data: campaigns = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    ["campaigns", organizationId],
    () => getCampaigns(organizationId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    },
  );

  const filteredCampaigns = campaigns.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalSent = campaigns.reduce(
    (acc: number, c: any) => acc + (c.totalSent || 0),
    0,
  );
  const totalOpened = campaigns.reduce(
    (acc: number, c: any) => acc + (c.totalOpened || 0),
    0,
  );
  const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

  const stats = [
    {
      label: "Active Campaigns",
      value: campaigns.filter((c: any) => c.status === "ACTIVE").length,
      icon: Activity,
      color: "text-blue-600",
    },
    {
      label: "Total Recipients",
      value: totalSent.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
    },
    {
      label: "Avg Open Rate",
      value: `${avgOpenRate.toFixed(1)}%`,
      icon: Mail,
      color: "text-green-600",
    },
    {
      label: "Total Revenue",
      value: `$${campaigns.reduce((acc: number, c: any) => acc + Number(c.totalRevenue || 0), 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "PENDING_APPROVAL":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending Approval
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Scheduled
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "SMS":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "IN_PERSON":
        return <UserCheck className="h-4 w-4 text-orange-500" />;
      default:
        return <Megaphone className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCampaignCreated = () => {
    setIsDialogOpen(false);
    mutate(); // Re-fetch campaigns data
  };

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error loading campaigns
              </h3>
              <p className="text-muted-foreground">
                Failed to load campaigns. Please try again later.
              </p>
              <Button onClick={() => mutate()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and track your marketing automation.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm
              organizationId={organizationId}
              memberId={memberId}
              onSuccess={handleCampaignCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8"
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">
                      Loading campaigns...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  {searchQuery
                    ? "No campaigns match your search."
                    : "No campaigns found. Create your first campaign to get started!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign: any) => (
                <TableRow
                  key={campaign.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="flex flex-col hover:text-primary"
                    >
                      <span>{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {campaign.segment?.name || "All Customers"}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(campaign.channel)}
                      <span className="text-xs capitalize">
                        {campaign.channel.toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.totalSent?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 w-24">
                      <div className="flex justify-between text-xs">
                        <span>Open Rate</span>
                        <span className="font-medium">
                          {campaign.totalSent > 0
                            ? Math.round(
                                (campaign.totalOpened / campaign.totalSent) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${campaign.totalSent > 0 ? (campaign.totalOpened / campaign.totalSent) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(campaign.totalRevenue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
