'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import { usePosStore } from '@/store/store';
import { Scan, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange }: BarcodeScannerDialogProps) {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [scannedBuffer, setScannedBuffer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const products = usePosStore(state => state.products);
  const addItemToOrder = usePosStore(state => state.addItemToOrder);

  const handleBarcodeSubmit = useCallback(async (scannedCode: string) => {
    setError('');

    if (!scannedCode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    // Check local store first
    let product = products.find(p => p.barcode === scannedCode.trim() || p.variants?.some((v: any) => v.barcode === scannedCode.trim()));

    if (!product) {
      // Try backend lookup
      try {
        const invoke = (await import('@tauri-apps/api/core')).invoke;
        product = await invoke<any>('get_product_by_barcode_command', {
          barcode: scannedCode.trim(),
        });
      } catch (err) {
        console.error('Backend barcode lookup failed:', err);
      }
    }

    if (!product) {
      setError(`Product not found for barcode: ${scannedCode}`);
      setBarcode('');
      return;
    }

    if (product.stock <= 0) {
      setError(`${product.productName} is out of stock`);
      setBarcode('');
      return;
    }

    const defaultUnit = product.sellableUnits.find(u => u.isBaseUnit) || product.sellableUnits[0];
    addItemToOrder(product, product.variantId, defaultUnit, 1);

    // Success feedback
    setBarcode('');
    setError('');

    // Auto-close after successful scan
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  }, [products, addItemToOrder, onOpenChange]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setBarcode('');
      setError('');
      setScannedBuffer('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Barcode scanners typically send Enter after scanning
      if (e.key === 'Enter' && scannedBuffer) {
        handleBarcodeSubmit(scannedBuffer);
        setScannedBuffer('');
      } else if (e.key.length === 1) {
        // Accumulate characters from scanner
        setScannedBuffer(prev => prev + e.key);
      }
    };

    // Clear buffer after 100ms of inactivity (scanners are very fast)
    const timeoutId = setTimeout(() => {
      if (scannedBuffer && scannedBuffer.length > 3) {
        handleBarcodeSubmit(scannedBuffer);
      }
      setScannedBuffer('');
    }, 100);

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [open, scannedBuffer, handleBarcodeSubmit]);

  const handleManualSubmit = () => {
    handleBarcodeSubmit(barcode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              ref={inputRef}
              placeholder="Scan or enter barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              className="text-lg text-center"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Use a barcode scanner or type the barcode manually
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleManualSubmit}>
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
