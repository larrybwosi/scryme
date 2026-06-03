import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Loader2, Star, ShieldCheck, Settings } from 'lucide-react';
import { useBakerySettingsManagement } from '@/hooks/bakery';
import { BakeryBaker } from '@/types/bakery';
import { cn } from '@/lib/utils';
import { useListMembers } from '@/lib/api/members';

interface OperatorFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  baker?: BakeryBaker | null;
}

export default function OperatorFormDialog({ open, onOpenChange, baker }: OperatorFormDialogProps) {
  const isEditMode = !!baker;
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pin, setPin] = useState('');
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { data: members, isLoading: membersLoading } = useListMembers();
  const { bakers, addBaker, updateBaker, isAddingBaker, isUpdating } = useBakerySettingsManagement();

  // Lifecycle for Edit mode population
  useEffect(() => {
    if (open) {
      if (isEditMode && baker) {
        setSelectedMemberId(baker.memberId || "");
        setPin((baker as any).pin || '');
        setSpecialtiesInput(baker.specialties?.join(', ') || '');
        // Assuming your type supports isDefault, adapt as needed for your exact schema
        setIsDefault((baker as any).isDefault || false);
      } else {
        setSelectedMemberId('');
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

    const payload = {
      memberId: selectedMemberId,
      pin: pin || '1234',
      specialties: specialtiesArray,
      isDefault: isDefault,
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
      // Fallback to updating if hook supports it, or adapt to your specific update mutation structure
      if (updateBaker) {
        updateBaker({ bakerId: baker.id, data: payload }, options);
      } else {
        console.warn('updateBaker is missing from useBakerySettingsManagement hook.');
        onOpenChange?.(false); // Failsafe close
      }
    } else {
      addBaker(payload, options);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
  };

  const selectedMember =
    availableMembers.find(member => member.id === selectedMemberId) ||
    (isEditMode ? members?.find((m) => m.id === baker?.memberId) : null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
        {/* Header Area */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {isEditMode ? 'Modify Operator Settings' : 'Provision New Operator'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {isEditMode
                ? 'Update assignment rules and execution specialties for this staff member.'
                : 'Authorize a system user to execute production runs and manage batches.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body Area */}
        <div className="p-6 space-y-6">
          {/* Section 1: Identity */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Identity Record</Label>
            <div className="space-y-1.5">
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
                disabled={isEditMode || isSubmitting}
              >
                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select authenticated user account" />
                </SelectTrigger>
                <SelectContent>
                  {membersLoading ? (
                    <SelectItem value="loading" disabled>
                      Fetching directory...
                    </SelectItem>
                  ) : availableMembers.length === 0 && !isEditMode ? (
                    <SelectItem value="no-members" disabled>
                      All eligible users are provisioned
                    </SelectItem>
                  ) : (
                    availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} — {member.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 2: Production Parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Routing & Execution
            </Label>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm text-slate-700 dark:text-slate-300">
                Access PIN (4 digits)
              </Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="1234"
                value={pin}
                onChange={e => setPin(e.target.value)}
                disabled={!selectedMemberId || isSubmitting}
                className="h-9 border-slate-200 dark:border-slate-800 font-mono tracking-widest"
              />
              <p className="text-[11px] text-slate-400">
                Used for terminal authentication in offline mode.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties" className="text-sm text-slate-700 dark:text-slate-300">
                Qualified Specialties
              </Label>
              <Input
                id="specialties"
                placeholder="e.g. Sourdough, Pastry, Lamination"
                value={specialtiesInput}
                onChange={e => setSpecialtiesInput(e.target.value)}
                disabled={!selectedMemberId || isSubmitting}
                className="h-9 border-slate-200 dark:border-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                Comma-separated matrix defining authorized production categories.
              </p>

              {/* Dynamic Tag Preview */}
              {specialtiesInput && (
                <div className="flex flex-wrap gap-1.5 pt-2">
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
            </div>

            {/* Default Operator Assignment Toggle */}
            <div className="flex items-start space-x-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-4">
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
                  className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  Primary Shift Operator
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically assign this operator to new production runs via the Smart Wizard by default.
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
            className="border-slate-200 dark:border-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemberId || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Committing...
              </>
            ) : isEditMode ? (
              'Save Configuration'
            ) : (
              'Authorize Operator'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
