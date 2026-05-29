'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export function AgeVerificationDialog({ open, onOpenChange, onVerified }: AgeVerificationDialogProps) {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    setError('');

    if (!dateOfBirth) {
      setError('Please enter date of birth');
      return;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('Customer must be 18 years or older to purchase');
      return;
    }

    if (!idNumber || idNumber.length < 4) {
      setError('Please enter a valid ID number');
      return;
    }

    // Success - call onVerified callback
    onVerified();
    onOpenChange(false);

    // Reset form
    setDateOfBirth('');
    setIdNumber('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            This purchase requires age verification. Customer must be 18 years or older.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="id-number">ID Number (Last 4 digits)</Label>
            <Input
              id="id-number"
              type="text"
              placeholder="Enter ID number"
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              maxLength={10}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleVerify}>
              Verify & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
