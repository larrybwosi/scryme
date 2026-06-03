'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Separator } from '@repo/ui/components/ui/separator';

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelpDialog({ open, onOpenChange }: ShortcutsHelpDialogProps) {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      title: 'General',
      shortcuts: [
        { keys: ['?'], description: 'Show this help dialog', extra: ['F1'] },
        { keys: [modifier, 'K'], description: 'Open global search' },
        { keys: [modifier, 'B'], description: 'Toggle sidebar' },
        { keys: ['Esc'], description: 'Close dialogs / Clear search' },
      ],
    },
    {
      title: 'POS / Register',
      shortcuts: [
        { keys: ['/'], description: 'Focus search input' },
        { keys: [modifier, 'Enter'], description: 'Proceed to checkout', extra: [modifier, 'P'] },
        { keys: [modifier, 'S'], description: 'Hold current order' },
        { keys: [modifier, 'Shift', 'C'], description: 'Clear current cart' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: [modifier, 'I'], description: 'Go to Register (POS)' },
        { keys: [modifier, 'H'], description: 'Go to Transaction History' },
        { keys: [modifier, ','], description: 'Go to Settings' },
        { keys: [modifier, 'L'], description: 'Go to System Logs' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {shortcutGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="grid gap-3">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-2">
                      <KbdGroup>
                        {shortcut.keys.map((key) => (
                          <Kbd key={key}>{key}</Kbd>
                        ))}
                      </KbdGroup>
                      {shortcut.extra && (
                        <>
                          <span className="text-xs text-muted-foreground">or</span>
                          <KbdGroup>
                            {shortcut.extra.map((key) => (
                              <Kbd key={key}>{key}</Kbd>
                            ))}
                          </KbdGroup>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {groupIdx < shortcutGroups.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
