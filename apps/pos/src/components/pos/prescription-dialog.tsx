'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { FileText, Stethoscope, Hash, ShieldCheck } from 'lucide-react';
import { usePosStore } from '@/store/store';

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrescriptionDialog({ open, onOpenChange }: PrescriptionDialogProps) {
  const currentOrder = usePosStore(state => state.currentOrder);
  const pharmacyConfig = usePosStore(state => state.settings.pharmacyConfig);

  const [prescriptionId, setPrescriptionId] = useState(currentOrder.prescriptionId || '');
  const [doctorName, setDoctorName] = useState(currentOrder.doctorName || '');
  const [doctorLicense, setDoctorLicense] = useState((currentOrder.metadata as any)?.doctorLicense || '');
  const [refillsAllowed, setRefillsAllowed] = useState((currentOrder.metadata as any)?.refillsAllowed || '2');
  const [notes, setNotes] = useState(currentOrder.instructions || '');

  const handleSave = () => {
    usePosStore.setState(state => ({
      currentOrder: {
        ...state.currentOrder,
        prescriptionId,
        doctorName,
        instructions: notes,
        isPharmacistVerified: true,
        metadata: {
          ...state.currentOrder.metadata,
          doctorLicense,
          refillsAllowed,
          pharmacistVerifiedBy: pharmacyConfig?.pharmacistName || 'Staff Pharmacist',
          pharmacistLicense: pharmacyConfig?.pharmacistLicense,
        },
      },
    }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
            Prescription & Dispensing Details
          </DialogTitle>
          <DialogDescription>
            Enter doctor prescription details and verify for pharmacy compliance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="prescriptionId" className="flex items-center gap-1.5 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" /> Rx / Serial Number
              </Label>
              <Input
                id="prescriptionId"
                value={prescriptionId}
                onChange={e => setPrescriptionId(e.target.value)}
                placeholder="e.g. RX-2025-1001"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="refills" className="flex items-center gap-1.5 text-xs font-semibold">
                <Hash className="w-3.5 h-3.5" /> Refills Allowed
              </Label>
              <Input
                id="refills"
                type="number"
                min="0"
                value={refillsAllowed}
                onChange={e => setRefillsAllowed(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="doctorName" className="flex items-center gap-1.5 text-xs font-semibold">
                <Stethoscope className="w-3.5 h-3.5" /> Doctor Name
              </Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="Dr. Sarah Jenkins, MD"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="doctorLicense" className="flex items-center gap-1.5 text-xs font-semibold">
                Medical License #
              </Label>
              <Input
                id="doctorLicense"
                value={doctorLicense}
                onChange={e => setDoctorLicense(e.target.value)}
                placeholder="MED-45892"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Dosage Directions / SIG Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Take 1 tablet PO TID with food for 10 days"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 rounded-lg">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Saving will automatically sign-off and verify this order under <strong>{pharmacyConfig?.pharmacistName || 'Staff Pharmacist'}</strong>.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Verify & Save Prescription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
