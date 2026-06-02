// fallow-ignore-next-line unused-files
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Plus, UserPlus, Wallet, Settings2, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import sdk from '@/lib/sdk';
import { useFormattedCurrency } from '@/lib/utils';
import { Skeleton } from '@repo/ui/components/ui/skeleton';

export function PartnerManager() {
  const formatCurrency = useFormattedCurrency();
  const { data: partners, isLoading } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => sdk.client.get('/bakery/partners').then(res => res.data)
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  const partnerList = (partners as any) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Partners List</h2>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate/Fee</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerList.map((partner: any) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">
                    <div>
                      {partner.name}
                      <p className="text-xs text-muted-foreground">{partner.email || partner.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.benefitType}</Badge>
                  </TableCell>
                  <TableCell>
                    {partner.benefitType === 'COMMISSION' ? `${partner.commissionRate}%` : formatCurrency(partner.fixedFee || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Wallet className="h-3 w-3" />
                      {formatCurrency(partner.walletBalance)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.isActive ? "default" : "secondary"}>
                      {partner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Wallet History">
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit Partner">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!partners || (partners as any[]).length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No delivery partners configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
