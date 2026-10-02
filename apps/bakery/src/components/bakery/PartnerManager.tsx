// fallow-ignore-next-line unused-files
import React, { useState } from 'react';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { UserPlus, Wallet, Settings2, Loader2, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sdk from '@/lib/sdk';
import { useFormattedCurrency } from '@/lib/utils';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { toast } from 'sonner';

export function PartnerManager() {
  const formatCurrency = useFormattedCurrency();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [walletPartner, setWalletPartner] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    benefitType: 'FIXED_FEE',
    commissionRate: 0,
    fixedFee: 0,
    isActive: true,
  });

  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState('TOPUP');
  const [walletNotes, setWalletNotes] = useState('');

  const { data: partners, isLoading } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => sdk.client.get('/bakery/partners'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => sdk.client.post('/deliveries/partners', data),
    onSuccess: () => {
      toast.success('Delivery partner created');
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create delivery partner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sdk.client.patch(`/deliveries/partners/${id}`, data),
    onSuccess: () => {
      toast.success('Delivery partner updated');
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      setEditingPartner(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update delivery partner');
    },
  });

  const walletMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sdk.client.post(`/deliveries/partners/${id}/wallet`, data),
    onSuccess: () => {
      toast.success('Wallet adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      setWalletPartner(null);
      setWalletAmount('');
      setWalletNotes('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to adjust wallet');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      benefitType: 'FIXED_FEE',
      commissionRate: 0,
      fixedFee: 0,
      isActive: true,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (partner: any) => {
    setFormData({
      name: partner.name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      benefitType: partner.benefitType || 'FIXED_FEE',
      commissionRate: partner.commissionRate || 0,
      fixedFee: partner.fixedFee || 0,
      isActive: partner.isActive ?? true,
    });
    setEditingPartner(partner);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updateMutation.mutate({
        id: editingPartner.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAdjustWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletPartner) return;
    const numAmount = parseFloat(walletAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    walletMutation.mutate({
      id: walletPartner.id,
      data: {
        amount: walletType === 'DEDUCTION' ? -numAmount : numAmount,
        type: walletType,
        notes: walletNotes,
      },
    });
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Partners List</h2>
        <Button onClick={handleOpenAdd} className="gap-2">
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
              {(partners as any[])?.map((partner) => (
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
                    {partner.benefitType === 'COMMISSION'
                      ? `${partner.commissionRate}%`
                      : formatCurrency(partner.fixedFee || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Wallet className="h-3 w-3" />
                      {formatCurrency(partner.walletBalance || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                      {partner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Adjust Wallet Balance"
                        onClick={() => setWalletPartner(partner)}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Partner"
                        onClick={() => handleOpenEdit(partner)}
                      >
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

      {/* Add / Edit Partner Modal */}
      <Dialog
        open={isAddOpen || !!editingPartner}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingPartner(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'}</DialogTitle>
            <DialogDescription>
              Configure third-party delivery provider details and fee schedules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Partner Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. UberEats / In-house Express"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@delivery.com"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555-0199"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Benefit Type</Label>
                <Select
                  value={formData.benefitType}
                  onValueChange={(val) => setFormData({ ...formData, benefitType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_FEE">Fixed Fee</SelectItem>
                    <SelectItem value="COMMISSION">Commission %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.benefitType === 'COMMISSION' ? (
                <div>
                  <Label className="text-xs font-semibold">Commission Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-semibold">Fixed Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.fixedFee}
                    onChange={(e) =>
                      setFormData({ ...formData, fixedFee: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingPartner(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingPartner ? 'Save Changes' : 'Create Partner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Wallet Modal */}
      <Dialog open={!!walletPartner} onOpenChange={(open) => !open && setWalletPartner(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Partner Wallet — {walletPartner?.name}</DialogTitle>
            <DialogDescription>
              Current Balance: {formatCurrency(walletPartner?.walletBalance || 0)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustWallet} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Adjustment Type</Label>
              <Select value={walletType} onValueChange={setWalletType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOPUP">Top-up Balance (+)</SelectItem>
                  <SelectItem value="DEDUCTION">Deduct Balance (-)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Manual Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Notes / Reference</Label>
              <Input
                placeholder="e.g. Weekly settlement payout"
                value={walletNotes}
                onChange={(e) => setWalletNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setWalletPartner(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={walletMutation.isPending}>
                {walletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
