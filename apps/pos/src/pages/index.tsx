import { useState } from 'react';
import { Input } from '@repo/ui/components/ui/input';
import { Calendar, Search, LogOut, Settings } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { NotificationCenter } from '@/components/notification-center';
import { NotificationSettingsDialog } from '@/components/notification-settings-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const { checkOut, currentMember } = useAuth();

  const handleCheckout = () => {
    checkOut();
    setShowCheckoutDialog(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-lg">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-semibold">{currentMember?.name || 'User'}</span>
            </h1>

            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search anything" className="pl-10" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={() => setShowNotificationSettings(true)}>
              <Settings className="h-5 w-5" />
            </Button>
            <NotificationSettingsDialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckoutDialog(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Check Out
            </Button>

            <Button variant="outline" className="gap-2 bg-transparent">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Button>
          </div>
        </header>
      </div>

      <AlertDialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out? This will end your current session and return you to the check-in
              screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout} className="bg-destructive hover:bg-destructive/90">
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
