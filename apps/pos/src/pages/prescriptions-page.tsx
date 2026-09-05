'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePosStore } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePrinter } from '@/hooks/use-printer';
import { trackPosEvent } from '@/lib/openpanel';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Pill,
  Printer,
  ShieldCheck,
  User,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card } from '@repo/ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { toast } from 'sonner';

export interface PrescriptionRecord {
  id: string;
  rxNumber: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorLicense: string;
  dateWritten: string;
  medicationName: string;
  dosageForm: string; // e.g. "500mg Tablet", "250mg/5ml Syrup"
  quantity: number;
  sig: string; // Dosage instructions e.g. "Take 1 tablet PO TID with food for 10 days"
  refillsAllowed: number;
  refillsRemaining: number;
  status: 'pending_verification' | 'ready_for_dispense' | 'dispensed' | 'on_hold';
  pharmacistVerifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

const STORAGE_KEY = 'scryme_prescriptions';

export function PrescriptionsPage() {
  const settings = usePosStore(state => state.settings);
  const pharmacyConfig = settings.pharmacyConfig;
  const { printDocument } = usePrinter();

  // Load initial prescription data from localStorage (or empty array)
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
    } catch (e) {
      console.error('Failed to save prescriptions to storage', e);
    }
  }, [prescriptions]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLogRxOpen, setIsLogRxOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<PrescriptionRecord | null>(null);

  // Form State for Log New Prescription
  const [newRxNumber, setNewRxNumber] = useState(`RX-${Date.now().toString().slice(-6)}`);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorLicense, setNewDoctorLicense] = useState('');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newQuantity, setNewQuantity] = useState('30');
  const [newSig, setNewSig] = useState('');
  const [newRefills, setNewRefills] = useState('2');

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(rx => {
      const matchesStatus = statusFilter === 'all' || rx.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        rx.rxNumber.toLowerCase().includes(q) ||
        rx.patientName.toLowerCase().includes(q) ||
        rx.doctorName.toLowerCase().includes(q) ||
        rx.medicationName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [prescriptions, statusFilter, searchQuery]);

  // Metrics
  const pendingCount = useMemo(() => prescriptions.filter(r => r.status === 'pending_verification').length, [prescriptions]);
  const readyCount = useMemo(() => prescriptions.filter(r => r.status === 'ready_for_dispense').length, [prescriptions]);
  const dispensedCount = useMemo(() => prescriptions.filter(r => r.status === 'dispensed').length, [prescriptions]);

  const handleVerifyRx = (rxId: string) => {
    const rxToVerify = prescriptions.find(r => r.id === rxId);
    setPrescriptions(prev =>
      prev.map(rx =>
        rx.id === rxId
          ? {
              ...rx,
              status: 'ready_for_dispense',
              pharmacistVerifiedBy: pharmacyConfig?.pharmacistName || 'Dr. Jane Doe, PharmD',
              verifiedAt: new Date().toLocaleString(),
            }
          : rx
      )
    );
    if (rxToVerify) {
      trackPosEvent('pos_prescription_verified', { rxNumber: rxToVerify.rxNumber, medication: rxToVerify.medicationName });
    }
    toast.success('Prescription verified by Pharmacist');
  };

  const handleLogPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newMedicationName || !newDoctorName) {
      toast.error('Please fill in required fields');
      return;
    }

    const newRecord: PrescriptionRecord = {
      id: `rx_${Date.now()}`,
      rxNumber: newRxNumber,
      patientName: newPatientName,
      patientPhone: newPatientPhone,
      doctorName: newDoctorName,
      doctorLicense: newDoctorLicense || 'MD-LOCAL',
      dateWritten: new Date().toISOString().split('T')[0],
      medicationName: newMedicationName,
      dosageForm: 'Oral',
      quantity: parseInt(newQuantity, 10) || 30,
      sig: newSig || 'Take as directed by doctor',
      refillsAllowed: parseInt(newRefills, 10) || 0,
      refillsRemaining: parseInt(newRefills, 10) || 0,
      status: pharmacyConfig?.requirePharmacistVerification ? 'pending_verification' : 'ready_for_dispense',
    };

    setPrescriptions(prev => [newRecord, ...prev]);
    setIsLogRxOpen(false);
    trackPosEvent('pos_prescription_logged', { rxNumber: newRxNumber, medication: newMedicationName });
    toast.success(`Prescription ${newRxNumber} logged successfully`);

    // Reset form
    setNewRxNumber(`RX-${Date.now().toString().slice(-6)}`);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewDoctorName('');
    setNewDoctorLicense('');
    setNewMedicationName('');
    setNewSig('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-muted/5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" /> Pharmacy Dispensing & Clinical Queue
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground text-sm">
            Manage doctor prescriptions, clinical verification, and records
          </p>
        </div>
        <Button onClick={() => setIsLogRxOpen(true)} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Log New Prescription
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                Awaiting Pharmacist Sign-off
              </p>
              <h3 className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-200">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                Verified Prescriptions
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-200">{readyCount}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-blue-700 dark:text-blue-400">
                Dispensed Today
              </p>
              <h3 className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-200">{dispensedCount}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-lg">
              <Pill className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-muted/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Rx #, patient, doctor, drug..."
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prescriptions</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="ready_for_dispense">Ready for Dispense</SelectItem>
                <SelectItem value="dispensed">Dispensed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <Card className="border-muted/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Rx Number</TableHead>
              <TableHead className="font-bold">Patient</TableHead>
              <TableHead className="font-bold">Prescriber / Doctor</TableHead>
              <TableHead className="font-bold">Medication & Directions (SIG)</TableHead>
              <TableHead className="font-bold">Refills</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No prescriptions found matching your search filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredPrescriptions.map(rx => (
                <TableRow key={rx.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono font-semibold text-primary">{rx.rxNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {rx.patientName}
                    </div>
                    <div className="text-xs text-muted-foreground">{rx.patientPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                      {rx.doctorName}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">Lic: {rx.doctorLicense}</div>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="font-bold text-sm text-foreground">{rx.medicationName}</div>
                    <div className="text-xs text-muted-foreground italic mt-0.5">{rx.sig}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {rx.refillsRemaining} / {rx.refillsAllowed}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rx.status === 'pending_verification' && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="w-3 h-3 mr-1" /> Pending Sign-off
                      </Badge>
                    )}
                    {rx.status === 'ready_for_dispense' && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {rx.status === 'dispensed' && (
                      <Badge variant="secondary" className="text-xs">
                        Dispensed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rx.status === 'pending_verification' && (
                        <Button
                          size="sm"
                          onClick={() => handleVerifyRx(rx.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Sign-off
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRxForPrint(rx)}
                        className="h-8 w-8 p-0"
                        title="Print Auxiliary Dispensing Label"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Log New Prescription Dialog */}
      <Dialog open={isLogRxOpen} onOpenChange={setIsLogRxOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <FileText className="w-5 h-5" /> Log Prescription Entry
            </DialogTitle>
            <DialogDescription>
              Record doctor prescription details into the dispensing queue.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogPrescription} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rxNumber">Rx Number</Label>
                <Input id="rxNumber" value={newRxNumber} onChange={e => setNewRxNumber(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refills">Refills Allowed</Label>
                <Input id="refills" type="number" min="0" value={newRefills} onChange={e => setNewRefills(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="patientName">Patient Full Name</Label>
                <Input id="patientName" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="e.g. John Miller" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patientPhone">Patient Phone</Label>
                <Input id="patientPhone" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} placeholder="+2547..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input id="doctorName" value={newDoctorName} onChange={e => setNewDoctorName(e.target.value)} placeholder="Dr. Sarah Jenkins, MD" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doctorLicense">Doctor Medical License #</Label>
                <Input id="doctorLicense" value={newDoctorLicense} onChange={e => setNewDoctorLicense(e.target.value)} placeholder="MED-12345" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="medication">Medication & Strength</Label>
                <Input id="medication" value={newMedicationName} onChange={e => setNewMedicationName(e.target.value)} placeholder="e.g. Amoxicillin 500mg" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sig">Dosage Instructions (SIG)</Label>
              <Textarea
                id="sig"
                rows={2}
                value={newSig}
                onChange={e => setNewSig(e.target.value)}
                placeholder="e.g. Take 1 tablet 3 times daily with food for 10 days"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsLogRxOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Log Prescription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auxiliary Label Print Preview Modal */}
      {selectedRxForPrint && (
        <Dialog open={!!selectedRxForPrint} onOpenChange={() => setSelectedRxForPrint(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" /> Dispensing Label Preview
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 border-2 border-dashed border-emerald-600 rounded-lg bg-emerald-50/20 space-y-3 font-mono text-xs">
              <div className="text-center border-b pb-2">
                <h4 className="font-bold text-sm uppercase tracking-wider">{pharmacyConfig?.dispensingLabelHeader || 'OFFICIAL DISPENSING LABEL'}</h4>
                <p className="text-[10px] text-muted-foreground">{pharmacyConfig?.pharmacistName} | Lic: {pharmacyConfig?.pharmacistLicense}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">Rx #: {selectedRxForPrint.rxNumber}</span>
                  <span>Date: {selectedRxForPrint.dateWritten}</span>
                </div>
                <div><span className="font-bold">PATIENT:</span> {selectedRxForPrint.patientName}</div>
                <div><span className="font-bold">PRESCRIBER:</span> {selectedRxForPrint.doctorName}</div>
              </div>

              <div className="border-t border-b py-2 space-y-1">
                <div className="font-bold text-sm text-emerald-800 dark:text-emerald-400">{selectedRxForPrint.medicationName} (Qty: {selectedRxForPrint.quantity})</div>
                <div className="font-bold text-xs bg-emerald-100 dark:bg-emerald-950 p-2 rounded leading-snug">
                  SIG: {selectedRxForPrint.sig}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground italic text-center">
                {pharmacyConfig?.warningDisclaimerText || 'Keep out of reach of children. Take strictly as directed.'}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRxForPrint(null)}>Close</Button>
              <Button
                onClick={async () => {
                  try {
                    const branchName = useAuthStore.getState().currentLocation?.name;
                    const orderPayload = {
                      rxNumber: selectedRxForPrint.rxNumber,
                      patientName: selectedRxForPrint.patientName,
                      doctorName: selectedRxForPrint.doctorName,
                      doctorLicense: selectedRxForPrint.doctorLicense,
                      dateWritten: selectedRxForPrint.dateWritten,
                      pharmacistName: pharmacyConfig?.pharmacistName || 'Staff Pharmacist',
                      pharmacistLicense: pharmacyConfig?.pharmacistLicense || '',
                      headerText: pharmacyConfig?.dispensingLabelHeader || 'OFFICIAL DISPENSING LABEL',
                      disclaimer: pharmacyConfig?.warningDisclaimerText || 'Keep out of reach of children. Take strictly as directed.',
                      items: [
                        {
                          name: selectedRxForPrint.medicationName,
                          quantity: selectedRxForPrint.quantity,
                          dosageInstructions: selectedRxForPrint.sig,
                          rxNumber: selectedRxForPrint.rxNumber,
                          patientName: selectedRxForPrint.patientName,
                          doctorName: selectedRxForPrint.doctorName,
                        },
                      ],
                    };
                    await printDocument('label', orderPayload, settings, branchName);
                    toast.success(`Sent dispensing label for ${selectedRxForPrint.rxNumber} to printer!`);
                  } catch (err: any) {
                    console.error('Prescription label print failed:', err);
                    toast.error('Print failed', { description: err?.message || 'Check printer settings' });
                  } finally {
                    setSelectedRxForPrint(null);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Printer className="w-4 h-4" /> Print Label
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PrescriptionsPage;
