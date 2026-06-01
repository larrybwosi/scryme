import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import QRCode from 'qrcode';
import { Loader2, Smartphone, Wifi, CheckCircle, FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';

interface FileReceiveDialogProps {
  onFileReceived?: (fileName: string) => void;
}

export function FileReceiveDialog({ onFileReceived }: FileReceiveDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReceivedFile, setLastReceivedFile] = useState<string | null>(null);

  const callbackRef = useRef(onFileReceived);
  useEffect(() => {
    callbackRef.current = onFileReceived;
  }, [onFileReceived]);
  // --- Sound Helper Function ---
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/notification-success.mp3');
    audio.play().catch(e => console.error('Error playing sound:', e));
  };

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      // Listen for the event
      unlisten = await listen<string>('file-received', event => {
        console.log('File received:', event.payload);

        // Update local UI
        setLastReceivedFile(event.payload);
        playSuccessSound();

        // 4. CALL THE PARENT CALLBACK HERE
        if (callbackRef.current) {
          callbackRef.current(event.payload);
        }
      });
    };

    if (isOpen) {
      setupListener();
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [isOpen]);

  const startServer = async () => {
    setIsLoading(true);
    setLastReceivedFile(null);
    try {
      const url = await invoke<string>('start_file_server');
      setServerUrl(url);

      const qrData = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrUrl(qrData);
    } catch (error) {
      console.error('Failed to start server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !qrUrl) {
      startServer();
    }
  };

  const resetView = () => {
    setLastReceivedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Smartphone className="h-4 w-4" />
          Receive from Phone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Files via Wi-Fi</DialogTitle>
          <DialogDescription>Scan this QR code with your mobile camera to upload files.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Starting local server...</p>
            </div>
          ) : lastReceivedFile ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-green-100 p-6 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">File Received!</h3>
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md mb-6">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{lastReceivedFile}</span>
              </div>
              <Button onClick={resetView}>Receive Another File</Button>
            </div>
          ) : qrUrl ? (
            <>
              <div className="relative border-4 border-black rounded-lg overflow-hidden mb-4">
                <img src={qrUrl} alt="Upload QR Code" className="w-56 h-56" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-4">
                <Wifi className="h-3 w-3" />
                <span>{serverUrl}</span>
              </div>

              <p className="text-xs text-center text-muted-foreground max-w-[250px]">
                Ensure your phone and this computer are connected to the same Wi-Fi network.
              </p>
            </>
          ) : (
            <div className="text-red-500">Failed to generate QR Code</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
