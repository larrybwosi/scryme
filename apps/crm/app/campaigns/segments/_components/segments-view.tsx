"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Users,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  ArrowRight,
  AlertCircle,
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
import { getSegments } from "@/app/actions/campaigns";
import { SegmentForm } from "./segment-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";

interface SegmentsViewProps {
  organizationId: string;
}

export function SegmentsView({ organizationId }: SegmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use SWR for data fetching
  const {
    data: segments = [],
    error,
    isLoading,
    mutate,
  } = useSWR(["segments", organizationId], () => getSegments(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  // Filter segments based on search query
  const filteredSegments = segments.filter(
    (segment: any) =>
      segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (segment.description &&
        segment.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleSegmentCreated = () => {
    setIsDialogOpen(false);
    mutate(); // Re-fetch segments data
  };

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error loading segments
              </h3>
              <p className="text-muted-foreground">
                Failed to load audience segments. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">
            Audience Segments
          </h1>
          <p className="text-muted-foreground">
            Group your customers based on behavior, attributes, and custom
            fields.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Segment</DialogTitle>
            </DialogHeader>
            <SegmentForm
              organizationId={organizationId}
              onSuccess={handleSegmentCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search segments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Estimated Size</TableHead>
              <TableHead>Last Refreshed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading segments...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSegments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center py-4">
                    <Users className="h-10 w-10 text-muted-foreground opacity-20 mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No segments match your search."
                        : "No segments defined yet."}
                    </p>
                    {!searchQuery && (
                      <Button variant="link" className="mt-2">
                        Learn how to segment your audience
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSegments.map((segment: any) => (
                <TableRow key={segment.id}>
                  <TableCell className="font-medium">{segment.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {segment.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-slate-400" />
                      {segment.size?.toLocaleString() || "~1,240"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {segment.lastRefreshed
                      ? new Date(segment.lastRefreshed).toLocaleString()
                      : "1 hour ago"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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
