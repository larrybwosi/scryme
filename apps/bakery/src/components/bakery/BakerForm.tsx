import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Loader2, Star, ShieldCheck, Settings, Crown, Award, UserCheck } from 'lucide-react';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import { BakeryBaker } from '@/types/bakery';
import { cn } from '@/lib/utils';
import { useListMembers } from '@/lib/api/members';

interface OperatorFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  baker?: BakeryBaker | null;
}

export const BAKER_ROLES = [
  { value: 'LEAD_BAKER', label: 'Lead Baker', description: 'Oversees batch runs, recipe execution & team supervision', icon: Crown, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'HEAD_PASTRY_CHEF', label: 'Head Pastry Chef', description: 'Leads specialty pastry, lamination & recipe development', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'LINE_BAKER', label: 'Line Baker', description: 'Executes standard mixing, proofing, and baking operations', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'ASSISTANT_BAKER', label: 'Assistant Baker', description: 'Assists with prep, cleaning, inventory and packaging', icon: Settings, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function OperatorFormDialog({ open, onOpenChange, baker }: OperatorFormDialogProps) {
  const isEditMode = !!baker;
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('LEAD_BAKER');
  const [pin, setPin] = useState('');
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { data: members, isLoading: membersLoading } = useListMembers();
  const { bakers, addBaker, updateBaker, isAddingBaker, isUpdating } = useBakerySettingsManagement();

  // Lifecycle for Edit mode population
  useEffect(() => {
    if (open) {
      if (isEditMode && baker) {
        setSelectedMemberId(baker.memberId || '');
        setSelectedRole(baker.role || 'LEAD_BAKER');
        setPin((baker as any).pin || '');
        setSpecialtiesInput(baker.specialties?.join(', ') || '');
        setIsDefault((baker as any).isDefault || false);
      } else {
        setSelectedMemberId('');
        setSelectedRole('LEAD_BAKER');
        setPin('');
        setSpecialtiesInput('');
        setIsDefault(false);
      }
    }
  }, [open, isEditMode, baker]);

  // Filter out members who are already operators (only for creation mode)
  const availableMembers =
    members?.filter((member) =>
      isEditMode ? member.id === baker?.memberId : !bakers?.some(b => b.memberId === member.id)
    ) || [];

  const isSubmitting = isAddingBaker || isUpdating;

  const handleSubmit = () => {
    if (!selectedMemberId) return;

    const specialtiesArray = specialtiesInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload: any = {
      memberId: selectedMemberId,
      role: selectedRole,
      specialties: specialtiesArray,
      pin,
      isDefault,
      isActive: baker?.isActive ?? true,
    };

    const options = {
      onSuccess: () => {
        onOpenChange?.(false);
      },
      onError: (error: any) => {
        console.error('Failed to commit operator configuration:', error);
      },
    };

    if (isEditMode && baker) {
      if (updateBaker) {
        updateBaker({ bakerId: baker.id, data: payload }, options);
      } else {
        onOpenChange?.(false);
      }
    } else {
      addBaker(payload, options);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-xl">
        {/* Header Area */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {isEditMode ? 'Modify Staff & Baker Profile' : 'Authorize Member as Baker'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {isEditMode
                ? 'Update role configuration, execution specialties, and shift settings.'
                : 'Select an organization member and configure their baker role and permissions.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body Area */}
        <div className="p-6 space-y-5">
          {/* Section 1: Member Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Organization Member
            </Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              disabled={isEditMode || isSubmitting}
            >
              <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select an authenticated member account" />
              </SelectTrigger>
              <SelectContent>
                {membersLoading ? (
                  <SelectItem value="loading" disabled>
                    Fetching directory...
                  </SelectItem>
                ) : availableMembers.length === 0 && !isEditMode ? (
                  <SelectItem value="no-members" disabled>
                    All eligible members are already provisioned
                  </SelectItem>
                ) : (
                  availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} — {member.email} ({member.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Section 2: Role Configuration */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Baker Role Configuration
            </Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select baker role" />
              </SelectTrigger>
              <SelectContent>
                {BAKER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-slate-600" />
                      <span className="font-medium">{r.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500 italic">
              {BAKER_ROLES.find(r => r.value === selectedRole)?.description}
            </p>
          </div>

          {/* Section 3: Additional Parameters */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Execution & Terminal Credentials
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pin" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Terminal Access PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  maxLength={20}
                  placeholder="••••••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  disabled={!selectedMemberId || isSubmitting}
                  className="h-9 border-slate-200 dark:border-slate-800 font-mono tracking-widest text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialties" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Specialties (comma-separated)
                </Label>
                <Input
                  id="specialties"
                  placeholder="Sourdough, Pastry, Lamination"
                  value={specialtiesInput}
                  onChange={e => setSpecialtiesInput(e.target.value)}
                  disabled={!selectedMemberId || isSubmitting}
                  className="h-9 border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Dynamic Tag Preview */}
            {specialtiesInput && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {specialtiesInput
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
                  .map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded"
                    >
                      {specialty}
                    </span>
                  ))}
              </div>
            )}

            {/* Primary Shift Operator Assignment Toggle */}
            <div className="flex items-start space-x-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-3">
              <div className="flex items-center h-5">
                <input
                  id="default-baker"
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  disabled={!selectedMemberId || isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <Label
                  htmlFor="default-baker"
                  className="text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  Lead / Primary Shift Operator
                </Label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically default this member for new production runs in the Smart Wizard.
                </p>
              </div>
              <Star className={cn('h-4 w-4 ml-auto', isDefault ? 'text-amber-500 fill-current' : 'text-slate-300')} />
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="border-slate-200 dark:border-slate-800 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemberId || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Committing...
              </>
            ) : isEditMode ? (
              'Save Configuration'
            ) : (
              'Authorize Baker'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
