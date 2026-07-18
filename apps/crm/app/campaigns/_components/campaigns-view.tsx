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

  const totalSent = campaigns.reduce((acc: number, c: any) => acc + (c.totalSent || 0), 0);
  const totalOpened = campaigns.reduce((acc: number, c: any) => acc + (c.totalOpened || 0), 0);
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
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Page Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">Campaigns</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} &bull; {campaigns.filter((c: any) => c.status === 'ACTIVE').length} active
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 text-[12.5px]">
                <Plus size={13} />
                New Campaign
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

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted`}>
                <stat.icon size={15} className={stat.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{stat.label}</p>
                <p className="text-[16px] font-bold text-foreground tabular-nums">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-8 h-8 text-[12.5px]"
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[12.5px]">Filters</Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Campaign</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Channel</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Recipients</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Open Rate</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 text-right">Revenue</TableHead>
                <TableHead className="py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      <p className="text-[12.5px] text-muted-foreground">Loading campaigns...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[12.5px] text-muted-foreground">
                    {searchQuery ? "No campaigns match your search." : "No campaigns yet. Create your first campaign."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign: any) => {
                  const openRate = campaign.totalSent > 0
                    ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
                    : 0;
                  return (
                    <TableRow key={campaign.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3.5">
                        <Link href={`/campaigns/${campaign.id}`} className="flex flex-col group/link hover:opacity-80">
                          <span className="text-[13px] font-semibold text-foreground group-hover/link:text-primary transition-colors">{campaign.name}</span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">{campaign.segment?.name || "All Customers"}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="py-3.5">{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="text-[12px] capitalize text-muted-foreground">{campaign.channel.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-[13px] text-foreground tabular-nums">
                        {(campaign.totalSent || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${openRate}%` }} />
                          </div>
                          <span className="text-[12px] font-medium text-foreground tabular-nums">{openRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right text-[13px] font-semibold text-foreground tabular-nums">
                        ${Number(campaign.totalRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                              <MoreVertical size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[12.5px]">
                            <DropdownMenuLabel className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
