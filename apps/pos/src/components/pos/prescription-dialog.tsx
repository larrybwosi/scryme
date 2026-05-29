'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Stethoscope } from 'lucide-react';
import { usePosStore } from '@/store/store';

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrescriptionDialog({ open, onOpenChange }: PrescriptionDialogProps) {
  const currentOrder = usePosStore(state => state.currentOrder);

  const [prescriptionId, setPrescriptionId] = useState(currentOrder.prescriptionId || '');
  const [doctorName, setDoctorName] = useState(currentOrder.doctorName || '');
  const [notes, setNotes] = useState(currentOrder.instructions || '');

  const handleSave = () => {
    usePosStore.setState(state => ({
      currentOrder: {
        ...state.currentOrder,
        prescriptionId,
        doctorName,
        instructions: notes,
      }
    }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Prescription Details
          </DialogTitle>
          <DialogDescription>
            Enter the prescription details for this order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="prescriptionId" className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Prescription ID / Number
            </Label>
            <Input
              id="prescriptionId"
              value={prescriptionId}
              onChange={e => setPrescriptionId(e.target.value)}
              placeholder="e.g. RX-123456"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctorName" className="flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5" /> Doctor Name
            </Label>
            <Input
              id="doctorName"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              placeholder="Dr. Smith"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Prescription Notes / Instructions</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Dosage instructions, duration, etc."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Prescription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
