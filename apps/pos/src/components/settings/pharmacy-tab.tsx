import { useState } from 'react';
import { usePosStore } from '@/store/store';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Switch } from '@repo/ui/components/ui/switch';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Separator } from '@repo/ui/components/ui/separator';
import { Stethoscope, ShieldCheck, FileText, Pill, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function PharmacyTab() {
  const pharmacyConfig = usePosStore(state => state.settings.pharmacyConfig) || {
    pharmacistName: 'Dr. Jane Doe, PharmD',
    pharmacistLicense: 'PH-98765432',
    facilityRegistrationNo: 'PHARM-2025-001',
    requirePharmacistVerification: true,
    drugInteractionAlerts: true,
    genericSubstitutionPolicy: 'auto_suggest',
    allowInsuranceClaims: true,
    defaultInsuranceCopayPercent: 20,
    controlledSubstanceLedger: true,
    dispensingLabelHeader: 'OFFICIAL DISPENSING LABEL',
    warningDisclaimerText: 'Take as directed by your physician. Keep out of reach of children.',
  };

  const updatePharmacyConfig = usePosStore(state => state.updatePharmacyConfig);

  const [pharmacistName, setPharmacistName] = useState(pharmacyConfig.pharmacistName);
  const [pharmacistLicense, setPharmacistLicense] = useState(pharmacyConfig.pharmacistLicense);
  const [facilityRegistrationNo, setFacilityRegistrationNo] = useState(pharmacyConfig.facilityRegistrationNo);
  const [requirePharmacistVerification, setRequirePharmacistVerification] = useState(pharmacyConfig.requirePharmacistVerification);
  const [drugInteractionAlerts, setDrugInteractionAlerts] = useState(pharmacyConfig.drugInteractionAlerts);
  const [genericSubstitutionPolicy, setGenericSubstitutionPolicy] = useState(pharmacyConfig.genericSubstitutionPolicy);
  const [allowInsuranceClaims, setAllowInsuranceClaims] = useState(pharmacyConfig.allowInsuranceClaims);
  const [defaultInsuranceCopayPercent, setDefaultInsuranceCopayPercent] = useState(pharmacyConfig.defaultInsuranceCopayPercent.toString());
  const [controlledSubstanceLedger, setControlledSubstanceLedger] = useState(pharmacyConfig.controlledSubstanceLedger);
  const [dispensingLabelHeader, setDispensingLabelHeader] = useState(pharmacyConfig.dispensingLabelHeader);
  const [warningDisclaimerText, setWarningDisclaimerText] = useState(pharmacyConfig.warningDisclaimerText);

  const handleSave = () => {
    updatePharmacyConfig({
      pharmacistName,
      pharmacistLicense,
      facilityRegistrationNo,
      requirePharmacistVerification,
      drugInteractionAlerts,
      genericSubstitutionPolicy,
      allowInsuranceClaims,
      defaultInsuranceCopayPercent: parseFloat(defaultInsuranceCopayPercent) || 0,
      controlledSubstanceLedger,
      dispensingLabelHeader,
      warningDisclaimerText,
    });
    toast.success('Pharmacy settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pharmacist & Facility License Information */}
        <Card className="p-6 border-muted/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Pharmacist & Licensing</h2>
              <p className="text-sm text-muted-foreground">Store regulatory & credentials information</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pharmacistName">Pharmacist in Charge Name</Label>
              <Input
                id="pharmacistName"
                value={pharmacistName}
                onChange={e => setPharmacistName(e.target.value)}
                placeholder="Dr. Jane Doe, PharmD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pharmacistLicense">Pharmacist License Number</Label>
              <Input
                id="pharmacistLicense"
                value={pharmacistLicense}
                onChange={e => setPharmacistLicense(e.target.value)}
                placeholder="PH-12345678"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facilityRegistrationNo">Pharmacy Board Registration No.</Label>
              <Input
                id="facilityRegistrationNo"
                value={facilityRegistrationNo}
                onChange={e => setFacilityRegistrationNo(e.target.value)}
                placeholder="PHARM-REG-99"
                className="font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Verification & Clinical Protocols */}
        <Card className="p-6 border-muted/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Dispensing & Safety Protocols</h2>
              <p className="text-sm text-muted-foreground">Clinical verification and alert controls</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Mandatory Pharmacist Sign-Off</Label>
                <p className="text-xs text-muted-foreground">
                  Require registered pharmacist sign-off before selling prescription items
                </p>
              </div>
              <Switch
                checked={requirePharmacistVerification}
                onCheckedChange={setRequirePharmacistVerification}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Drug Interaction & Allergy Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Display warnings if added items conflict with patient allergy records
                </p>
              </div>
              <Switch
                checked={drugInteractionAlerts}
                onCheckedChange={setDrugInteractionAlerts}
              />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="genericSubstitutionPolicy">Generic Drug Substitution Policy</Label>
              <Select
                value={genericSubstitutionPolicy}
                onValueChange={(val: any) => setGenericSubstitutionPolicy(val)}
              >
                <SelectTrigger id="genericSubstitutionPolicy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_suggest">Auto-Suggest Generic Equivalents</SelectItem>
                  <SelectItem value="always_ask">Prompt Cashier for Patient Preference</SelectItem>
                  <SelectItem value="disabled">Disable Generic Substitution Hints</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Insurance & Controlled Substances */}
        <Card className="p-6 border-muted/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Insurance & Controlled Substances</h2>
              <p className="text-sm text-muted-foreground">Co-pay defaults and Schedule II-V tracking</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Allow Insurance Claims & Co-Pay</Label>
                <p className="text-xs text-muted-foreground">Enable insurance split billing in payment checkout</p>
              </div>
              <Switch
                checked={allowInsuranceClaims}
                onCheckedChange={setAllowInsuranceClaims}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defaultInsuranceCopayPercent">Default Patient Co-Pay (%)</Label>
              <Input
                id="defaultInsuranceCopayPercent"
                type="number"
                min="0"
                max="100"
                value={defaultInsuranceCopayPercent}
                onChange={e => setDefaultInsuranceCopayPercent(e.target.value)}
                placeholder="20"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Controlled Substance Register</Label>
                <p className="text-xs text-muted-foreground">Log Schedule II-V drug dispensing to compliance ledger</p>
              </div>
              <Switch
                checked={controlledSubstanceLedger}
                onCheckedChange={setControlledSubstanceLedger}
              />
            </div>
          </div>
        </Card>

        {/* Label & Disclaimer Customization */}
        <Card className="p-6 border-muted/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Label & Receipt Customization</h2>
              <p className="text-sm text-muted-foreground">Rx auxiliary label headers & medical disclaimers</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dispensingLabelHeader">Dispensing Label Header Title</Label>
              <Input
                id="dispensingLabelHeader"
                value={dispensingLabelHeader}
                onChange={e => setDispensingLabelHeader(e.target.value)}
                placeholder="OFFICIAL DISPENSING LABEL"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warningDisclaimerText">Cautionary Medical Disclaimer Text</Label>
              <Textarea
                id="warningDisclaimerText"
                rows={3}
                value={warningDisclaimerText}
                onChange={e => setWarningDisclaimerText(e.target.value)}
                placeholder="Take as directed by your physician. Keep out of reach of children."
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="w-4 h-4 mr-2" /> Save Pharmacy Settings
        </Button>
      </div>
    </div>
  );
}
