import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Store, Warehouse, Check, Loader2, AlertTriangle } from 'lucide-react';
import { usePosLocations } from '@/hooks/locations';
import { useAuthStore } from '@/store/pos-auth-store';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface LocationSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationSwitchDialog({ open, onOpenChange }: LocationSwitchDialogProps) {
  const { locations, isLoading } = usePosLocations();
  const { currentLocation, switchLocation, currentMember, clearMemberSession } = useAuthStore();
  const { checkOut, isCheckingOut } = useAuth();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(currentLocation?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoggingOut = isCheckingOut || isSubmitting;

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'RETAIL_SHOP':
        return Store;
      case 'WAREHOUSE':
        return Warehouse;
      default:
        return MapPin;
    }
  };

  const handleConfirm = async () => {
    if (!selectedLocationId) return;

    const location = locations.find(l => l.id === selectedLocationId);
    if (!location) return;

    setIsSubmitting(true);
    try {
      // Step 1: Switch the location first (updates config + syncs products)
      await switchLocation(location as any);

      // Step 2: If a member is currently logged in, log them out of the previous session.
      // We call the Tauri logout command (best-effort server notification + clears keyring/memory).
      // Even if it fails, we force-clear the local session so they must re-login.
      if (currentMember) {
        try {
          await checkOut();
        } catch {
          // checkOut already force-clears the session on error, so this is safe to swallow.
          clearMemberSession();
        }
      }

      toast.success(`Switched to ${location.name}`, {
        description: currentMember ? 'Please log in again to continue.' : undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to switch location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Location</DialogTitle>
          <DialogDescription>Select the store or warehouse this terminal should operate from.</DialogDescription>
        </DialogHeader>

        {/* Warn the user they'll be logged out if someone is currently checked in */}
        {currentMember && selectedLocationId && selectedLocationId !== currentLocation?.id && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">{currentMember.name}</span> will be logged out. You'll need to check in
              again after switching.
            </span>
          </div>
        )}

        <div className="py-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {locations.map(loc => {
                  const Icon = getLocationIcon(loc.locationType);
                  const isSelected = selectedLocationId === loc.id;
                  const isCurrent = currentLocation?.id === loc.id;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`
                        relative flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all
                        ${isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}
                      `}
                    >
                      <div
                        className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{loc.name}</span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {loc.locationType.toLowerCase().replace('_', ' ')}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="text-primary">
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoggingOut}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocationId || selectedLocationId === currentLocation?.id || isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Confirm Switch'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
