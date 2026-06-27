"use client";

import { Card, CardContent, CardHeader } from "@repo/ui/components/ui/card";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";

export function SupplierLoadingState() {
  return (
    <div className="space-y-6 px-6 py-8 bg-background min-h-screen">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-muted" />
          <Skeleton className="h-4 w-96 bg-muted" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-background border border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-4 rounded-full bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 bg-muted" />
              <Skeleton className="h-3 w-20 bg-muted mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="suppliers" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-background border border-border p-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-32 bg-muted mx-1" />
            ))}
          </TabsList>

          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 bg-muted" />
            <Skeleton className="h-10 w-32 bg-muted" />
          </div>
        </div>

        {/* Suppliers Tab Content Skeleton */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card className="bg-background border border-border">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-muted" />
                  <Skeleton className="h-4 w-64 bg-muted" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12 py-3.5 pl-4 pr-2">
                        <Skeleton className="h-4 w-4 bg-muted-foreground/20" />
                      </TableHead>
                      {Array.from({ length: 7 }).map((_, index) => (
                        <TableHead key={index} className="py-3.5 px-3">
                          <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex} className="border-border">
                        <TableCell className="py-3 pl-4 pr-2">
                          <Skeleton className="h-4 w-4 bg-muted" />
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-32 bg-muted" />
                              <Skeleton className="h-3 w-20 bg-muted" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <div className="space-y-1.5">
                            <Skeleton className="h-5 w-16 bg-muted" />
                            <Skeleton className="h-5 w-20 bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-24 bg-muted" />
                            <Skeleton className="h-3 w-32 bg-muted" />
                            <Skeleton className="h-3 w-28 bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center space-y-1.5">
                            <Skeleton className="h-4 w-12 bg-muted" />
                            <Skeleton className="h-3 w-16 bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center space-y-1.5">
                            <Skeleton className="h-4 w-8 bg-muted" />
                            <Skeleton className="h-3 w-16 bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end space-y-1.5">
                            <Skeleton className="h-4 w-20 bg-muted" />
                            <Skeleton className="h-3 w-16 bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right">
                          <Skeleton className="h-8 w-8 bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab Content Skeleton */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card className="bg-background border border-border">
            <CardHeader className="pb-4 border-b border-border">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-muted" />
                <Skeleton className="h-4 w-64 bg-muted" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-5 w-40 bg-muted" />
                      <Skeleton className="h-6 w-20 bg-muted" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, colIndex) => (
                        <div key={colIndex} className="space-y-2">
                          <Skeleton className="h-4 w-24 bg-muted" />
                          <Skeleton className="h-4 w-32 bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab Content Skeleton */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-background border border-border">
              <CardHeader className="pb-4 border-b border-border">
                <Skeleton className="h-6 w-56 bg-muted" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-5 w-32 bg-muted" />
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Skeleton
                              key={starIndex}
                              className="h-3 w-3 bg-muted"
                            />
                          ))}
                          <Skeleton className="h-4 w-8 bg-muted ml-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, metricIndex) => (
                          <div key={metricIndex}>
                            <Skeleton className="h-4 w-20 bg-muted" />
                            <Skeleton className="h-5 w-16 bg-muted mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background border border-border">
              <CardHeader className="pb-4 border-b border-border">
                <Skeleton className="h-6 w-56 bg-muted" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-32 bg-muted" />
                        <Skeleton className="h-4 w-12 bg-muted" />
                      </div>
                      <Skeleton className="w-full h-2.5 bg-muted rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
