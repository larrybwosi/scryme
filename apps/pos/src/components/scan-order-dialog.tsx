import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { QrCode, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';

interface ScanOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionDetails {
  id: string;
  number: string;
  status: string;
  total: number;
  paymentStatus: string;
  customerName: string;
  itemCount: number;
  items: {
    name: string;
    sku: string;
    quantity: number;
    total: number;
  }[];
  createdAt: string;
}

export function ScanOrderDialog({ open, onOpenChange }: ScanOrderDialogProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setCode('');
      setDetails(null);
      setError(null);
    }
  }, [open]);

  // Listen for global scanner events when dialog is open
  useEffect(() => {
    if (!open) return;

    const unlisten = listen<{ message: string }>('scanner-data', event => {
      const scannedCode = event.payload.message;
      console.log('Dialog received scan:', scannedCode);
      setCode(scannedCode);
      handleScan(scannedCode);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [open]);

  const handleScan = async (scanCode: string) => {
    if (!scanCode.trim()) return;

    setLoading(true);
    setError(null);
    setDetails(null);

    try {
      const response = await invoke<{ success: boolean; data: TransactionDetails }>('scan_transaction_code', {
        code: scanCode,
      });

      if (response.success && response.data) {
        setDetails(response.data);
        toast('Scan Successful', {
          description: `Transaction ${response.data.number || ''} found.`,
        });
      } else {
        setError('Invalid response format or transaction not found.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.toString() || 'Failed to validate code.');
      toast('Scan Failed', {
        description: err.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(code);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Validate Order / Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Section */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Scan QR code or type reference..."
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="text-lg font-mono"
            />
            <Button onClick={() => handleScan(code)} disabled={loading || !code}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
            </Button>
          </div>

          {/* Success State - Transaction Details */}
          {details && (
            <div className="rounded-md border bg-slate-50 dark:bg-slate-900 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{details.customerName}</h3>
                  <p className="text-sm text-muted-foreground">Order #{details.number || details.id}</p>
                </div>
                <Badge
                  variant={
                    details.paymentStatus === 'PAID' || details.paymentStatus === 'COMPLETED'
                      ? 'default' // Using default (black/primary) for success-like states if "success" variant doesn't exist, or specific styles
                      : 'secondary'
                  }
                  className={
                    details.paymentStatus === 'PAID'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }
                >
                  {details.paymentStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Total Amount</span>
                  <span className="text-xl font-bold">KES {details.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date</span>
                  <span>{new Date(details.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Items ({details.itemCount})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {details.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-mono">{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetails(null);
                    setCode('');
                    inputRef.current?.focus();
                  }}
                >
                  Scan Next
                </Button>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!details && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Ready to scan. Point scanner at the QR code.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
