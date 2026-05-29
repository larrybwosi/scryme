'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { toast } from 'sonner';

interface ReceiveDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
}

export const ReceiveDeliveryModal: React.FC<ReceiveDeliveryModalProps> = ({ open, onOpenChange, purchaseId }) => {
  const handleReceive = () => {
    toast.success("Delivery received successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receive Delivery</DialogTitle>
          <DialogDescription>Record items received for purchase order {purchaseId}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receiver Name</Label>
                  <Input placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
             </div>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Product A</TableCell>
                    <TableCell>100</TableCell>
                    <TableCell><Input type="number" defaultValue={100} className="w-20" /></TableCell>
                    <TableCell>
                      <Select defaultValue="good">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                </TableBody>
             </Table>
             <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Any additional notes..." />
             </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleReceive}>Confirm Receipt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Mock Select for now to keep it simple
const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const SelectTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const SelectValue = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const SelectItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
