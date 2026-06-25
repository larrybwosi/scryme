"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { toast } from "sonner";
import Link from "next/link";
import { LocationSheet } from "./location-sheet";
import { DeleteLocationDialog } from "./delete-location-dialog";

interface LocationTableProps {
  data: any[];
  members: any[];
}

export function LocationTable({ data, members }: LocationTableProps) {
  const [deletingLocation, setDeletingLocation] = React.useState<any>(null);

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Hierarchy</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground">
                No locations found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(location => (
              <TableRow key={location.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1D1D1F]">
                        {location.name}
                      </span>
                      {location.isDefault && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200">
                          Default
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {location.code || "No code"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {location.locationType.toLowerCase().replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {location.parentLocation?.name || (
                    <span className="text-muted-foreground text-xs">Root</span>
                  )}
                </TableCell>
                <TableCell>
                  {location.manager?.user?.name || (
                    <span className="text-muted-foreground text-xs">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs">
                    <span>{location._count.childLocations} Sub-locations</span>
                    <span>{location._count.zones} Zones</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      location._count.variantStocks > 0 ? "text-green-600" : ""
                    }>
                    {location._count.variantStocks} SKUs
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/locations/${location.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View details for ${location.name}`}>
                            <ExternalLink size={16} />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${location.name}`}>
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Actions</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <LocationSheet
                          location={location}
                          locations={data}
                          members={members}
                          isEdit>
                          <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                        </LocationSheet>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeletingLocation(location)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Location
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {deletingLocation && (
        <DeleteLocationDialog
          locationId={deletingLocation.id}
          locationName={deletingLocation.name}
          open={!!deletingLocation}
          onOpenChange={open => !open && setDeletingLocation(null)}
        />
      )}
    </div>
  );
}
