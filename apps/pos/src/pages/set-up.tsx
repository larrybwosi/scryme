import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Check,
  Loader2,
  ShieldCheck,
  Info,
  ExternalLink,
  Laptop,
  Settings,
  ChevronLeft,
  Monitor,
  ChefHat,
  Tablet as TabletIcon,
  QrCode,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

// shadcn components
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Progress } from '@repo/ui/components/ui/progress';
import { Label } from '@repo/ui/components/ui/label';

// hooks
import { useAuthStore } from '@/store/pos-auth-store';
import { useNavigate } from 'react-router';
import { getVersion } from '@tauri-apps/api/app';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

// --- Types ---
interface Location {
  id: string;
  name: string;
  address: string;
  type: string;
  isDefault?: boolean;
}

interface SetupData {
  setupToken: string;
  location: Location | null;
}

// --- Sub-Components ---

const SetupTokenInstructions = ({ onBack, apiUrl }: { onBack: () => void, apiUrl: string }) => {
  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 -ml-2 h-8 px-2 rounded-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h3 className="text-2xl font-semibold tracking-tight uppercase">Setup Token Help</h3>
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          Your setup token provisions this terminal automatically.
        </p>
      </div>

      <div className="grid gap-4">
        {[
          { icon: Laptop, title: '1. Login to Dashboard', desc: 'Sign in to your Merchant Portal.' },
          { icon: Settings, title: '2. Go to Integrations', desc: 'Navigate to Integrations > Apps & API.' },
          { icon: Monitor, title: '3. Select Devices', desc: 'Switch to the Devices tab.' },
          { icon: Key, title: '4. Generate Token', desc: 'Click "Provision device" to generate a setup token.' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
          >
            <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200 uppercase tracking-tighter">
                {item.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full h-11 rounded-none border-zinc-300 dark:border-zinc-700" asChild>
        <a href={`${apiUrl}/integrations/apps-api?tab=devices`} target="_blank" rel="noreferrer">
          Open Dashboard <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </Button>
    </div>
  );
};

const SetupTokenStep = ({
  onNext,
  onShowInstructions,
}: {
  onNext: (t: string) => void;
  onShowInstructions: () => void;
}) => {
  const [authMode, setAuthMode] = useState<'qr' | 'token'>('qr');
  const [token, setToken] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [error, setError] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);

  // QR Pairing Session State
  const [pairingSessionId, setPairingSessionId] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<Date | null>(null);
  const [pairingStatus, setPairingStatus] = useState<'PENDING' | 'AUTHORIZED' | 'EXPIRED' | 'LOADING'>('PENDING');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(300);

  const { provisionDevice, authorizeFromPairingPayload, rawApiUrl, apiUrl, setApiUrl, applyApiUrl } = useAuthStore();

  // Helper to request a new pairing session
  const initPairingSession = async () => {
    setPairingStatus('LOADING');
    setError('');
    try {
      let resData: any = null;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const response = await invoke<any>('create_pairing_session_command');
        resData = response?.success !== undefined ? response.data : response;
      } catch {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const response = await invoke<any>('authenticated_api_request', {
            method: 'POST',
            path: 'api/v3/pos/pairing/session',
          });
          resData = response?.success !== undefined ? response.data : response;
        } catch {
          const fallback = await fetch(`${apiUrl}/api/v3/pos/pairing/session`, { method: 'POST' });
          const json = await fallback.json();
          resData = json.data || json;
        }
      }

      if (resData?.sessionId) {
        setPairingSessionId(resData.sessionId);
        setPairingCode(resData.pairingCode || null);
        setPairingExpiresAt(resData.expiresAt ? new Date(resData.expiresAt) : new Date(Date.now() + 300000));
        setPairingStatus('PENDING');
      } else {
        setError('Failed to initiate pairing session.');
        setPairingStatus('EXPIRED');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating pairing QR code.');
      setPairingStatus('EXPIRED');
    }
  };

  // Initialize pairing session on mount when in QR mode
  useEffect(() => {
    if (authMode === 'qr') {
      initPairingSession();
    }
  }, [authMode]);

  // Realtime Socket.io listener for instant pairing authorization
  useEffect(() => {
    if (authMode !== 'qr' || !pairingSessionId || pairingStatus !== 'PENDING') return;

    let socket: any = null;
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(apiUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
        });

        const channelSession = `pos:pairing:${pairingSessionId}`;
        const channelCode = pairingCode ? `pos:pairing:${pairingCode}` : null;
        const v3ChannelSession = `v3:pos:pairing:${pairingSessionId}`;
        const v3ChannelCode = pairingCode ? `v3:pos:pairing:${pairingCode}` : null;

        socket.on('connect', () => {
          socket.emit('join', { channel: channelSession });
          socket.emit('join', { channel: v3ChannelSession });
          if (channelCode) {
            socket.emit('join', { channel: channelCode });
          }
          if (v3ChannelCode) {
            socket.emit('join', { channel: v3ChannelCode });
          }
        });

        const handleAuthorized = async (data: any) => {
          if (!isMounted) return;
          const payload = data?.payload || data;
          if (payload) {
            setPairingStatus('AUTHORIZED');
            try {
              await authorizeFromPairingPayload(payload);
              onNext('pairing_authorized');
            } catch (e: any) {
              setError(e.message || 'Failed to apply authorized session credentials.');
            }
          }
        };

        socket.on('pairing:authorized', handleAuthorized);
      } catch (err) {
        console.error('Failed to setup socket.io client for pairing:', err);
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [authMode, pairingSessionId, pairingCode, pairingStatus, apiUrl, authorizeFromPairingPayload, onNext]);

  // Countdown timer effect
  useEffect(() => {
    if (!pairingExpiresAt || pairingStatus !== 'PENDING') return;

    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((pairingExpiresAt.getTime() - Date.now()) / 1000));
      setTimeLeftSec(diff);
      if (diff === 0) {
        setPairingStatus('EXPIRED');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pairingExpiresAt, pairingStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 3) {
      setError('Invalid token format');
      return;
    }
    setError('');
    setIsProvisioning(true);
    try {
      await provisionDevice(token);
      setIsProvisioning(false);
      onNext(token);
    } catch (err: any) {
      setIsProvisioning(false);
      const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to provision device';
      setError(errorMessage);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Settings / API URL Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setAuthMode('qr');
              setError('');
            }}
            className={cn(
              "flex-1 h-9 rounded-none text-xs font-bold uppercase tracking-wider transition-all",
              authMode === 'qr'
                ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <QrCode className="w-3.5 h-3.5 mr-1.5" /> Scan QR Code
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setAuthMode('token');
              setError('');
            }}
            className={cn(
              "flex-1 h-9 rounded-none text-xs font-bold uppercase tracking-wider transition-all",
              authMode === 'token'
                ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <Key className="w-3.5 h-3.5 mr-1.5" /> Setup Token
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowApiSettings(!showApiSettings)}
          className="h-8 text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-900 shrink-0 ml-2"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {showApiSettings && (
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="apiUrl" className="text-[10px] font-bold uppercase text-zinc-500">
            Backend API URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="apiUrl"
              type="url"
              value={rawApiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="h-10 text-xs font-mono rounded-none border-zinc-200"
              placeholder="https://api.example.com"
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await applyApiUrl();
                setShowApiSettings(false);
                if (authMode === 'qr') initPairingSession();
              }}
              className="h-10 rounded-none bg-zinc-800 text-white"
            >
              Apply
            </Button>
          </div>
          <p className="text-[9px] text-zinc-400 italic">
            Caution: Changing this affects all terminal requests.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 font-medium flex items-center gap-2 rounded-none p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <Info size={14} /> {error}
        </p>
      )}

      {/* MODE 1: QR CODE PAIRING */}
      {authMode === 'qr' && (
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in">
          {pairingStatus === 'LOADING' ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-xs uppercase font-semibold text-zinc-500">Generating Pairing QR...</p>
            </div>
          ) : pairingStatus === 'AUTHORIZED' ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-green-600">
              <CheckCircle2 className="w-12 h-12" />
              <p className="text-sm font-bold uppercase tracking-wider">Device Authorized!</p>
            </div>
          ) : pairingStatus === 'EXPIRED' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Pairing Code Expired</p>
              <Button
                type="button"
                onClick={initPairingSession}
                className="h-10 rounded-none bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-bold uppercase tracking-wider text-xs"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh QR Code
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 border border-zinc-200 shadow-md relative group">
                <QRCodeSVG
                  value={JSON.stringify({ type: 'POS_PAIRING', sessionId: pairingSessionId, pairingCode })}
                  size={180}
                  level="H"
                  marginSize={0}
                />
              </div>

              {pairingCode && (
                <div className="flex flex-col items-center justify-center space-y-1 my-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Pairing Code
                  </p>
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 px-4 py-2 font-mono text-2xl font-black tracking-widest text-zinc-900 dark:text-zinc-100">
                    {pairingCode.split('').map((char, idx) => (
                      <span key={idx} className="w-5 text-center">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Expires in {formatTimer(timeLeftSec)}</span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-center leading-relaxed max-w-xs">
                Scan with <span className="text-zinc-900 dark:text-zinc-100 font-bold">Scryme Mobile App</span> to automatically authorize terminal
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={initPairingSession}
                className="text-[10px] text-zinc-400 hover:text-zinc-900 uppercase font-mono tracking-wider h-6"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Regenerate Code
              </Button>
            </>
          )}
        </div>
      )}

      {/* MODE 2: MANUAL SETUP TOKEN */}
      {authMode === 'token' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Input
                id="setupToken"
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="pl-11 font-mono text-sm h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-blue-600 rounded-none shadow-none transition-all"
                placeholder="Paste your setup token here..."
                autoFocus
              />
              <Key className="absolute left-4 top-4.5 h-5 w-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
            </div>

          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-none text-base bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-none uppercase font-bold tracking-wide"
              disabled={isProvisioning || !token}
            >
              {isProvisioning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Provision & Continue'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="text-zinc-500 dark:text-zinc-400 text-sm hover:bg-transparent hover:text-blue-600 hover:underline rounded-none"
              onClick={onShowInstructions}
            >
              Where do I find my setup token?
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const DeviceTypeStep = ({
  onNext
}: {
  onNext: (type: 'MAIN_HUB' | 'KDS' | 'TABLET', hubIp?: string) => void
}) => {
  const [deviceType, setDeviceType] = useState<'MAIN_HUB' | 'KDS' | 'TABLET'>('MAIN_HUB');
  const [hubIp, setHubIp] = useState('');
  const [deviceName, setDeviceName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(deviceType, hubIp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-md mx-auto">
      <div className="space-y-4">
        <Label className="text-base font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Select Device Role
        </Label>

        <div className="space-y-2">
          <Label htmlFor="deviceName" className="text-xs font-bold uppercase text-zinc-500">
            Friendly Terminal Name
          </Label>
          <Input
            id="deviceName"
            placeholder="e.g. Kitchen KDS 1, Front Desk Hub..."
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-600 mb-4"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'MAIN_HUB', label: 'Main Hub / Register', Icon: Monitor, desc: 'Primary POS with full management capabilities.' },
            { id: 'KDS', label: 'Kitchen Display (KDS)', Icon: ChefHat, desc: 'Display and manage kitchen orders.' },
            { id: 'TABLET', label: 'Waiter Tablet', Icon: TabletIcon, desc: 'Mobile ordering for wait staff.' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setDeviceType(type.id as any)}
              className={cn(
                "flex items-start gap-4 p-4 border transition-all text-left",
                deviceType === type.id
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-600"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
              )}
            >
              <type.Icon className={cn("w-6 h-6 mt-1", deviceType === type.id ? "text-blue-600" : "text-zinc-400")} />
              <div>
                <p className="font-bold text-sm uppercase tracking-tight">{type.label}</p>
                <p className="text-xs text-zinc-500">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {deviceType !== 'MAIN_HUB' && (
          <div className="space-y-2 pt-4 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="hubIp" className="text-xs font-bold uppercase text-zinc-500">
              Main Hub IP Address
            </Label>
            <Input
              id="hubIp"
              placeholder="e.g. 192.168.1.50"
              value={hubIp}
              onChange={(e) => setHubIp(e.target.value)}
              className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-600"
              required
            />
            <p className="text-[10px] text-zinc-400 italic">
              Find this IP in the Main Hub's "Hub Overview" or KDS settings.
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 rounded-none text-base bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-none uppercase font-bold tracking-wide"
      >
        Finalize Configuration
      </Button>
    </form>
  );
};

const SuccessStep = ({
  location,
  deviceType,
  hubIp
}: {
  location: Location | null,
  deviceType: 'MAIN_HUB' | 'KDS' | 'TABLET',
  hubIp: string | null
}) => {
  const [progress, setProgress] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 800);
    const redirectTimer = setTimeout(() => {
      useAuthStore.getState().completeSetup(deviceType, hubIp);
      navigate('/');
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, deviceType, hubIp]);

  return (
    <div className="text-center w-full max-w-sm mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-8 text-green-600 dark:text-green-500 ring-1 ring-green-600/20 rounded-none"
      >
        <Check className="w-12 h-12" strokeWidth={2} />
      </motion.div>

      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">System Ready</h2>
      <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg">
        Terminal registered to <br />
        <span className="font-semibold text-zinc-900 dark:text-zinc-200">{location?.name}</span>
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-xs text-zinc-400 uppercase font-bold tracking-wider">
          <span>Booting Engine</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 rounded-none bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({ setupToken: '', location: null });
  const [deviceConfig, setDeviceConfig] = useState<{ type: 'MAIN_HUB' | 'KDS' | 'TABLET', hubIp: string | null }>({
    type: 'MAIN_HUB',
    hubIp: null
  });
  const [viewMode, setViewMode] = useState<'form' | 'instructions'>('form');
  const [appVersion, setAppVersion] = useState<string>('');
  const { currentLocation } = useAuthStore();

  const handleTokenNext = (token: string) => {
    setSetupData(prev => ({ ...prev, setupToken: token }));

    // Hub and Spoke options are strictly for restaurant mode
    if (import.meta.env.VITE_BUSINESS_MODE === 'restaurant') {
      setStep(2); // Go to Device Type selection
    } else {
      setDeviceConfig({ type: 'MAIN_HUB', hubIp: null });
      setStep(3); // Skip to success
    }
  };

  const handleDeviceTypeNext = (type: 'MAIN_HUB' | 'KDS' | 'TABLET', hubIp?: string) => {
    setDeviceConfig({ type, hubIp: hubIp || null });
    setStep(3); // Success step
  };

  useEffect(() => {
    if (currentLocation) {
        setSetupData(prev => ({ ...prev, location: currentLocation as any }));
    }
  }, [currentLocation]);

  useEffect(() => {
    // Async function to fetch version
    const fetchAppVersion = async () => {
      try {
        const v = await getVersion();
        setAppVersion(v);
      } catch (err) {
        console.error('Failed to get app version:', err);
        setAppVersion('Unknown');
      }
    };

    fetchAppVersion();
  }, []);

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-zinc-950 overflow-hidden font-sans select-none">
      <div data-tauri-drag-region className="absolute top-0 left-0 w-full h-10 z-50 bg-transparent" />

      {/* LEFT PANEL - Branding / Marketing */}
      <div className="hidden lg:flex w-[45%] bg-zinc-950 text-white relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-800">
        {/* Abstract Background Art */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-blue-900/10 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[20%] w-[80%] h-[80%] bg-zinc-800/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#34A853] flex items-center justify-center rounded-lg shadow-lg shadow-[#34A853]/20">
              <span className="text-white font-bold text-2xl font-sans">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">Scryme POS</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-5xl font-black leading-none mb-6 text-white tracking-tighter uppercase">
              Ready for <br /> Business.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm font-light">
              Initialize your terminal to start processing sales, tracking inventory, and managing customers in
              real-time.
            </p>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-4 text-sm text-zinc-500 font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 backdrop-blur-sm rounded-none">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>SECURE CONNECTION</span>
          </div>
          <span className="text-zinc-600">v{appVersion}</span>
        </div>
      </div>

      {/* RIGHT PANEL - Interaction / Form */}
      {/* Added overflow-y-auto so the form scrolls on small laptop screens if needed */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="w-full max-w-xl p-8 md:p-12 lg:p-16">
          <AnimatePresence mode="wait">
            {viewMode === 'instructions' ? (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SetupTokenInstructions onBack={() => setViewMode('form')} apiUrl={useAuthStore.getState().apiUrl} />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Form Header */}
                <div className="mb-10 text-center lg:text-left">
                  {step < 3 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-6 uppercase tracking-wider rounded-none">
                      <span>Step {step} of 2</span>
                    </div>
                  )}
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 mb-3 uppercase">
                    {step === 1 ? 'Connect Account' : 'Setup Complete'}
                  </h2>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light">
                    {step === 1 && 'Enter your setup token to initialize device.'}
                  </p>
                </div>

                {/* Steps */}
                <div className="min-h-[300px]">
                  {step === 1 && (
                    <SetupTokenStep onNext={handleTokenNext} onShowInstructions={() => setViewMode('instructions')} />
                  )}
                  {step === 2 && (
                    <DeviceTypeStep onNext={handleDeviceTypeNext} />
                  )}
                  {step === 3 && (
                    <SuccessStep
                      location={setupData.location}
                      deviceType={deviceConfig.type}
                      hubIp={deviceConfig.hubIp}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
