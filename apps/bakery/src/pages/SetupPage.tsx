'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Key, Globe, Cpu, Loader2, ArrowRight, Save, AlertCircle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { tauriInvoke } from '@/lib/tauri-bridge';
import sdk, { isTauri } from '@/lib/sdk';
import { Separator } from '@repo/ui/components/ui/separator';
import { resetBakeryDevice } from '@/utils/reset';

export default function SetupPage() {
  const navigate = useNavigate();
  const [setupToken, setSetupToken] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [hardwareInfo, setHardwareInfo] = useState<{ macAddress?: string; serialNumber?: string } | null>(null);
  const [isDetectingHardware, setIsDetectingHardware] = useState(false);
  const [showApiUrl, setShowApiUrl] = useState(false);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'https://api.scryme.app/api/v2');
  const [isValidatingApi, setIsValidatingApi] = useState(false);

  const handleDetectHardware = async () => {
    setIsDetectingHardware(true);
    try {
      const info = await tauriInvoke<{ macAddress?: string; serialNumber?: string }>('get_hardware_identifiers');
      setHardwareInfo(info);
      toast.success('Hardware identifiers detected');
    } catch (error) {
      console.error('Failed to detect hardware', error);
      toast.error('Could not auto-detect hardware info');
    } finally {
      setIsDetectingHardware(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupToken) {
      toast.error('Please enter a Setup Token');
      return;
    }

    setIsProvisioning(true);
    setProvisionError(null);
    try {
      await tauriInvoke('provision_device_with_token', {
        setupToken,
        macAddress: hardwareInfo?.macAddress || null,
        serialNumber: hardwareInfo?.serialNumber || null,
        apiUrlOverride: showApiUrl ? apiUrl : null,
      });

      if (showApiUrl && apiUrl) {
        sdk.client.setBaseURL(apiUrl);
        localStorage.setItem('bakery_api_url', apiUrl);
      }

      const newKey = await tauriInvoke<string>('get_provisioned_api_key');
      if (newKey) {
        sdk.setApiKey(newKey);
      }

      toast.success('Terminal provisioned successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Provisioning failed', error);
      const errorMessage = typeof error === 'string' ? error : error.message || 'Provisioning failed';
      setProvisionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-2xl shadow-xl mb-4 border-primary/20 overflow-hidden">
            <img src="/logo.jpeg" alt="Scryme Bakery Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter">SCRYME BAKERY</h1>
          <p className="text-sm text-primary/70 font-medium uppercase tracking-widest mt-1">Terminal Node</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Device Provisioning</CardTitle>
            <CardDescription className="text-gray-600">Enter a setup token from your dashboard to provision this device.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProvision}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="setup-token" className="text-sm font-medium text-gray-700">Setup Token</Label>
                  {isTauri() && (
                    <button
                      type="button"
                      onClick={() => setShowApiUrl(!showApiUrl)}
                      className="text-[10px] text-primary/60 hover:text-primary transition-colors font-semibold uppercase tracking-wider"
                    >
                      {showApiUrl ? 'Hide Endpoint' : 'Custom Endpoint'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                  <Input
                    id="setup-token"
                    type="password"
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    placeholder="Enter the 15-minute setup token"
                    className="pl-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {provisionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-start gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">{provisionError}</p>
                  </div>
                </div>
              )}

              {showApiUrl && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="api-url" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">API Endpoint URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        id="api-url"
                        type="url"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/api/v2"
                        className="pl-10 h-10 text-xs border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Device Identity</Label>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                  {hardwareInfo ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">MAC Address:</span>
                        <span className="font-mono text-amber-900 font-bold">{hardwareInfo.macAddress || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Serial Number:</span>
                        <span className="font-mono text-amber-900 font-bold truncate ml-4" title={hardwareInfo.serialNumber}>
                          {hardwareInfo.serialNumber || 'N/A'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDetectHardware}
                        disabled={isDetectingHardware}
                        className="text-xs text-amber-700 hover:bg-amber-100 h-8"
                      >
                        {isDetectingHardware ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Cpu className="h-3 w-3 mr-2" />}
                        Auto-detect hardware info
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Button
                type="submit"
                disabled={isProvisioning || !setupToken}
                className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
              >
                {isProvisioning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Provisioning Terminal...
                  </>
                ) : (
                  <>
                    Complete Provisioning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {isTauri() && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetBakeryDevice}
                  className="w-full h-10 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Clear Data & Reset Device
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Scryme Bakery ERP System
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-amber-800/40">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure Node</span>
            <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> System Nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
