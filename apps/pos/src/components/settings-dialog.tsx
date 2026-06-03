'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import SettingsPage from '@/pages/settings-page';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1000px] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle>System Settings</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-0">
               <SettingsPage />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
