import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import {
  CreditCard,
  Lock,
  LogIn,
  Scan,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Terminal,
  ShieldCheck,
  Zap,
  Settings,
  Keyboard,
} from 'lucide-react';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@repo/ui/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { useNavigate } from 'react-router';

// --- Tauri V2 Imports ---
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import posthog from 'posthog-js';

// --- Typewriter Effect Component ---
const TypewriterText = ({ texts }: { texts: string[] }) => {
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % texts.length;
      const fullText = texts[i];

      setCurrentText(
        isDeleting ? fullText.substring(0, currentText.length - 1) : fullText.substring(0, currentText.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, typingSpeed, texts]);

  return <span className="font-mono text-blue-300 border-r-2 border-blue-400 pr-1 animate-pulse">{currentText}</span>;
};

export default function CheckinPage() {
  // --- Form Logic ---
  const [cardId, setCardId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  
  // --- Version State ---
  const [appVersion, setAppVersion] = useState<string>('');

  const { checkIn, isCheckingIn } = useAuth();
  const { currentLocation } = useAuthStore();
  const navigate = useNavigate();

  const cardInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // --- HID Scanner Buffer Refs ---
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // --- 1. Initialize Listener & Version ---
  useEffect(() => {
    cardInputRef.current?.focus();

    let unlisten: (() => void) | undefined;

    const initSystem = async () => {
      // Fetch Version
      try {
        const v = await getVersion();
        setAppVersion(v);
      } catch (err) {
        console.error('Failed to get app version:', err);
        setAppVersion('Unknown');
      }

      // Start NFC Listener Backend
      try {
        await invoke('start_nfc_listener');
      } catch (err) {
        console.error("Failed to start NFC background thread:", err);
      }

      // Listen for 'nfc-read' events from Rust
      unlisten = await listen<string>('nfc-read', (event) => {
        handleScanData(event.payload);
      });
    };

    initSystem();

    // Cleanup listener on unmount
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // --- 2. HID / Keyboard Scanner Listener ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // If user is actively typing in the password field, ignore global scan logic
      // to prevent the scanner from overwriting the password or stealing focus.
      if (document.activeElement === passwordInputRef.current) return;

      const now = Date.now();
      
      // Scanners type very fast (usually <50ms between keys). 
      // If gap is large (>100ms), it's likely a manual human typing or a new scan starting.
      if (now - lastKeyTime.current > 100) {
        scannerBuffer.current = '';
      }
      lastKeyTime.current = now;

      // Detect "Enter" which usually marks the end of a barcode/magnetic scan
      if (e.key === 'Enter') {
        // If we have data in the buffer, treat it as a scan
        if (scannerBuffer.current.length > 0) {
          e.preventDefault(); // Prevent form submission
          handleScanData(scannerBuffer.current);
          scannerBuffer.current = '';
        }
        return;
      }

      // Accumulate printable characters
      // We exclude control keys (Shift, Alt, etc) by checking key length
      if (e.key.length === 1) {
        scannerBuffer.current += e.key;
        
        // UX Polish: If the user clicked away and focus is lost, 
        // using a scanner shouldn't feel broken.
        // However, if the user IS focused on the Card Input, 
        // `handleCardIdChange` will also fire.
        // We sync them up by forcing the input to update if it's not focused.
        if (document.activeElement !== cardInputRef.current) {
             setCardId(scannerBuffer.current);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // --- Unified Scan Handler ---
  const handleScanData = (scannedId: string) => {
    // Clean the ID (trim whitespace usually added by cheap scanners)
    const cleanId = scannedId.trim();
    if (!cleanId) return;

    setCardId(cleanId);
    setError('');
    setIsScanning(false);
    setScanSuccess(true);

    // Visual feedback: Wait 500ms showing green check, then focus password
    setTimeout(() => {
      passwordInputRef.current?.focus();
      setScanSuccess(false);
    }, 500);
  };

  // --- Manual Scan Trigger (Visual Only now) ---
  const handleScanClick = (): void => {
    setIsScanning(true);
    setError('');
    setScanSuccess(false);
    
    // Set focus to card input so keyboard scanners work immediately
    cardInputRef.current?.focus();
    
    setTimeout(() => {
        if (!scanSuccess) setIsScanning(false);
    }, 10000); 
  };

  const handleCardIdChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCardId(e.target.value);
    // Keep buffer in sync if user is typing manually
    scannerBuffer.current = e.target.value; 
    setError('');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (): Promise<void> => {
    setError('');

    if (import.meta.env.MODE === 'standalone') {
        if (!password.trim()) {
            setError('Please enter your PIN');
            passwordInputRef.current?.focus();
            return;
        }

        try {
            const isValid = await invoke<boolean>('verify_local_auth', { pin: password });
            if (isValid) {
                // Mock member session for standalone
                useAuthStore.getState().setMemberSession({
                    id: 'standalone-admin',
                    name: 'Admin',
                    email: 'admin@standalone.com',
                    role: 'admin'
                } as any);
                navigate('/');
            } else {
                setError('Invalid PIN');
            }
        } catch (err) {
            setError('Authentication error');
        }
        return;
    }

    if (!cardId.trim()) {
      setError('Please enter or scan your card ID');
      cardInputRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      passwordInputRef.current?.focus();
      return;
    }

    await checkIn({ cardId, password });
    
    // Clear sensitive data on success/fail cycle
    setCardId('');
    scannerBuffer.current = '';
    setPassword('');
    setShowPassword(false);
    cardInputRef.current?.focus();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    // If Enter is pressed in Card ID field
    if (e.key === 'Enter' && e.currentTarget.id === 'cardId') {
        e.preventDefault();
        if (cardId.trim()) {
            passwordInputRef.current?.focus();
        }
        return;
    }

    // If Enter is pressed in Password field
    if (e.key === 'Enter' && !isCheckingIn) {
      handleSubmit();
    }
  };

  // --- Confirmation Dialog Logic ---
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const handleResetRequest = () => {
      setResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
      setResetDialogOpen(false);

      try {
          // 1. Reset Backend
          await invoke('reset_device_config');
          posthog.capture('device_reset', { location: currentLocation?.name });
          posthog.reset();
          useAuthStore.getState().resetAll();
          usePosStore.getState().resetStore();

          navigate('/setup');
      } catch (err) {
          console.error("Reset failed:", err);
          setError("Failed to reset device");
      }
  };

  return (
    <>
    <div className="min-h-screen w-full flex bg-slate-950 text-white overflow-hidden">
      {/* --- LEFT SIDE: Visuals & Typewriter --- */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-slate-900 border-r border-slate-800">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/some.png"
            alt="Tech Background"
            className="w-full h-full object-cover grayscale mix-blend-overlay"
          />
          {/* <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-slate-900/50 to-blue-950/80"></div>  */}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Terminal className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Skryme</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            System Access <br />
            <TypewriterText texts={['Authorized Only.', 'Secure Login.', 'Shift Ready.', 'Data Encrypted.']} />
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Welcome to the secure employee portal. Scan your badge or enter your credentials to begin your session.
          </p>

          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Fast Check-in</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Skryme LLC. All rights reserved.</div>
      </div>

      {/* --- RIGHT SIDE: Login Form --- */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-blue-950 to-slate-950"></div>
        </div>

        <Card className="w-full max-w-md bg-transparent border-none shadow-none lg:bg-slate-900/50 lg:border lg:border-slate-800 lg:shadow-2xl relative z-20 backdrop-blur-sm">
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetRequest}
            className="absolute right-4 top-4 text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors rounded-full"
            title="Reset Device Configuration"
          >
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <CardHeader className="space-y-1 pb-8 text-center lg:text-left">
            <CardTitle className="text-3xl font-bold text-white">Check In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your details below to access the terminal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Scan Button - Now sets Visual State */}
            {import.meta.env.MODE !== 'standalone' && (
            <Button
              onClick={handleScanClick}
              disabled={isCheckingIn || isScanning}
              variant="outline"
              className={`w-full h-20 border-dashed transition-all duration-300 relative overflow-hidden group ${
                isScanning
                  ? 'border-blue-500 bg-blue-500/10'
                  : scanSuccess
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50'
              }`}
            >
              {isScanning && (
                <div
                  className="absolute inset-0 bg-linear-to-b from-transparent via-blue-500/10 to-transparent animate-scan"
                  style={{ backgroundSize: '100% 200%' }}
                ></div>
              )}

              <div className="flex flex-row items-center gap-4 relative z-10">
                {isScanning ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : scanSuccess ? (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors text-slate-400">
                    <Scan className="w-5 h-5" />
                  </div>
                )}

                <div className="flex flex-col items-start">
                  <span
                    className={`font-medium ${
                      scanSuccess ? 'text-green-400' : isScanning ? 'text-blue-400' : 'text-slate-200'
                    }`}
                  >
                    {isScanning ? 'Scanning...' : scanSuccess ? 'Card Verified' : 'Tap to Scan Badge'}
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:inline-block">
                    {isScanning ? 'Waiting for card...' : scanSuccess ? 'Redirecting...' : 'Supports NFC & USB Scanners'}
                  </span>
                </div>
              </div>
            </Button>
            )}

            {import.meta.env.MODE !== 'standalone' && (
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 lg:bg-slate-900 px-2 text-slate-500">Or continue with ID</span>
              </div>
            </div>
            )}

            {/* Inputs */}
            <div className="space-y-4">
                {import.meta.env.MODE !== 'standalone' && (
                  <div className="space-y-2">
                    <Label htmlFor="cardId" className="text-slate-300">
                      Card ID
                    </Label>
                    <div className="relative group">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        ref={cardInputRef}
                        id="cardId"
                        value={cardId}
                        onChange={handleCardIdChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter ID or Scan..."
                        autoFocus
                        className="pl-10 bg-slate-950/50 border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 h-11 transition-all"
                        disabled={isCheckingIn}
                      />
                      {/* Visual indicator for Keyboard/Scanner support */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" title="Scanner Ready">
                        <Keyboard className="h-4 w-4 opacity-50" />
                      </div>
                  </div>
                </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                    {import.meta.env.MODE === 'standalone' ? 'Access PIN' : 'Password'}
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter password"
                    className="pl-10 pr-10 bg-slate-950/50 border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 h-11 transition-all"
                    disabled={isCheckingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isCheckingIn}
              className="w-full h-11 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-900/20 transition-all duration-200"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Check In <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter className="justify-center pb-0">
            <p className="text-xs text-slate-600 text-center">
              Terminal ID: <span className="text-slate-400 font-mono">{currentLocation?.name || 'Unknown'}</span>
              <span className="mx-2">•</span>
              <span className="text-slate-500">v{appVersion}</span>
              <span className="mx-2">•</span>
              Status: <span className="text-green-500">Online</span>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Alert Dialog for Reset */}
      {/* Using a custom modal if AlertDialog is not available, but assuming similar UI structure or basic modal */}
       {resetDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 text-center sm:text-left">
                 <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Reset Device?
                 </h2>
                 <p className="text-sm text-slate-400">
                    This will disconnect this device from the location, clear all local data (products, customers), and require a fresh setup. This action cannot be undone.
                 </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 pt-2">
                 <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Cancel
                 </Button>
                 <Button variant="destructive" onClick={handleConfirmReset} className="bg-red-600 hover:bg-red-700 text-white">
                    Yes, Reset Everything
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}