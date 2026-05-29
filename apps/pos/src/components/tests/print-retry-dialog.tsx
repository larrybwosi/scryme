import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Printer, RefreshCcw, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PrintRetryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => Promise<void>;
  onQueue: () => void;
  error: string;
  orderNumber: string;
}

export function PrintRetryDialog({ isOpen, onClose, onRetry, onQueue, error, orderNumber }: PrintRetryDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (err) {
      // Error will be handled by parent component
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleQueue = () => {
    onQueue();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Receipt Print Failed
          </DialogTitle>
          <DialogDescription>Failed to print receipt for order {orderNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">The receipt could not be printed. You can:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Try printing again (check printer connection)</li>
              <li>Queue the print job to retry later</li>
              <li>Skip printing and continue</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Skip Printing
          </Button>
          <Button variant="secondary" onClick={handleQueue} className="w-full sm:w-auto">
            <Clock className="mr-2 h-4 w-4" />
            Queue for Later
          </Button>
          <Button onClick={handleRetry} disabled={isRetrying} className="w-full sm:w-auto">
            {isRetrying ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Retry Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
