'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Key, Lock, User, Utensils, AlertCircle, Loader2, CheckCircle2, Zap, ArrowRight, ShieldCheck, Mail, Eye, EyeOff, Activity, Globe, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { useQueryClient } from '@tanstack/react-query';
import sdk, { isTauri } from '@/lib/sdk';
import SessionSkeleton from './session-loader';
import { LocationSelect } from '@/components/common/location-select';
import { cn } from '@/lib/utils';
import { Separator } from '@repo/ui/components/ui/separator';

interface BakeryAuthGuardProps {
  children: React.ReactNode;
}

export function BakeryAuthGuard({ children }: BakeryAuthGuardProps) {
  const queryClient = useQueryClient();
  const [hasDeviceKey, setHasDeviceKey] = useState<boolean>(false);
  const [hasMemberToken, setHasMemberToken] = useState<boolean>(false);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);
  const [isLocalAuthenticated, setIsLocalAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [setupToken, setSetupToken] = useState('');
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<{ macAddress?: string; serialNumber?: string } | null>(null);
  const [isDetectingHardware, setIsDetectingHardware] = useState(false);
  const [showApiUrl, setShowApiUrl] = useState(false);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'https://api.scryme.app/api/v2');
  const [isValidatingApi, setIsValidatingApi] = useState(false);

  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [locationId, setLocationId] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);

  const checkAuthStatus = async () => {
    let provisionedKey: string | null = null;
    try {
      // Load custom API URL from settings if in Tauri
      try {
        const settings = await invoke<any>('get_settings', { orgId: 'local-org' });
        if (settings?.apiEndpointUrl) {
          setApiUrl(settings.apiEndpointUrl);
          sdk.client.setBaseURL(settings.apiEndpointUrl);
          localStorage.setItem('bakery_api_url', settings.apiEndpointUrl);
        }
      } catch (settingsError) {
        console.error('Failed to load settings for API URL', settingsError);
      }

      // Check local storage for local mode preference - Priority 1 (Explicit Local)
      const localModePref = localStorage.getItem('bakery_local_mode') === 'true';
      if (localModePref) {
        setIsLocalMode(true);
        const localAuth = sessionStorage.getItem('bakery_local_authenticated') === 'true';
        setIsLocalAuthenticated(localAuth);
        setIsInitialized(true);
        return;
      }

      // Check if we have a provisioned API Key in keyring - Priority 2 (Device Identity)
      provisionedKey = await invoke<string | null>('get_provisioned_api_key').catch(() => null);
      if (provisionedKey) {
        sdk.setApiKey(provisionedKey);
      }

      // If we are offline and not provisioned, don't even try to reach the SDK
      if (!window.navigator.onLine && !provisionedKey) {
          console.log('Offline and not provisioned, defaulting to local-only initialization');
          setIsInitialized(true);
          return;
      }

      // SDK call with a timeout to prevent hanging on poor connections
      const statusPromise = sdk.bakery.getAuthStatus();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth check timeout')), 3000));

      const status = await Promise.race([statusPromise, timeoutPromise]) as any;
      setHasDeviceKey(status.hasDeviceKey);
      setHasMemberToken(status.hasMemberToken);

      // Automated SSO Flow: If we have a device key but no member token, attempt SSO
      if (status.hasDeviceKey && !status.hasMemberToken && window.navigator.onLine) {
          console.log('Device configured, attempting automated SSO...');
          try {
              setIsSsoLoading(true);
              const ssoPromise = sdk.bakery.sso();
              const ssoTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('SSO timeout')), 5000));
              await Promise.race([ssoPromise, ssoTimeout]);
              setHasMemberToken(true);
              toast.success('Automatically authenticated via SSO');
          } catch (ssoError) {
              console.log('Automated SSO failed or timed out, falling back to login');
          } finally {
              setIsSsoLoading(false);
          }
      }
    } catch (error) {
      console.warn('Authentication status check failed (likely offline or timeout)', error);
      // If we are provisioned but offline, we allow them to proceed to the login phase if they have a key
      if (provisionedKey) {
        setHasDeviceKey(true);
      }
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleUnauthorized = () => {
        if (!localStorage.getItem('bakery_local_mode')) {
          setHasMemberToken(false);
          toast.error('Session expired. Please log in again.');
        }
    };

    window.addEventListener('bakery-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bakery-unauthorized', handleUnauthorized);
  }, []);

  const handleDetectHardware = async () => {
    setIsDetectingHardware(true);
    try {
      const info = await invoke<{ macAddress?: string; serialNumber?: string }>('get_hardware_identifiers');
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
      // 1. Provision via Rust backend (handles keyring storage)
      await invoke('provision_device_with_token', {
        setupToken,
        macAddress: hardwareInfo?.macAddress || null,
        serialNumber: hardwareInfo?.serialNumber || null,
        apiUrlOverride: showApiUrl ? apiUrl : null,
      });

      // Update SDK base URL immediately if override was used
      if (showApiUrl && apiUrl) {
        sdk.client.setBaseURL(apiUrl);
        localStorage.setItem('bakery_api_url', apiUrl);
      }

      // If custom API URL was used, save it to settings
      if (showApiUrl && apiUrl) {
        try {
          const settings = await invoke<any>('get_settings', { orgId: 'local-org' });
          await invoke('update_settings', {
            userId: 'system',
            settings: {
              ...settings,
              apiEndpointUrl: apiUrl
            }
          });
        } catch (settingsError) {
          console.error('Failed to save custom API URL to settings', settingsError);
        }
      }

      // 2. Retrieve the new key and update SDK
      const newKey = await invoke<string>('get_provisioned_api_key');
      if (newKey) {
        sdk.setApiKey(newKey);
      }

      setHasDeviceKey(true);
      localStorage.removeItem('bakery_local_mode');
      setIsLocalMode(false);
      toast.success('Terminal provisioned and initialized successfully');
    } catch (error: any) {
      console.error('Provisioning failed', error);
      const errorMessage = typeof error === 'string' ? error : error.message || 'Provisioning failed';
      setProvisionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleLocalMode = () => {
    localStorage.setItem('bakery_local_mode', 'true');
    // If it's the first time, or settings are empty, we might want to flag for walkthrough
    if (!localStorage.getItem('bakery_walkthrough_completed')) {
      localStorage.setItem('bakery_show_walkthrough', 'true');
    }
    setIsLocalMode(true);
    setIsLocalAuthenticated(false);
    sessionStorage.removeItem('bakery_local_authenticated');
    // Invalidate all queries to ensure they switch to local tauriInvoke paths
    queryClient.invalidateQueries();
    toast.success('Entering Local Mode');
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await invoke('login_local', { email: localEmail, password: localPassword });
      setIsLocalAuthenticated(true);
      sessionStorage.setItem('bakery_local_authenticated', 'true');
      toast.success('Authenticated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
        toast.error('Please select a production location');
        return;
    }
    setIsLoggingIn(true);
    try {
        setHasMemberToken(true);
        toast.success('Access granted to production');
    } catch (error) {
        toast.error('Authentication failed');
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleSso = async () => {
      if (!window.navigator.onLine) {
          toast.error('Dashboard SSO requires an internet connection');
          return;
      }
      try {
          setIsSsoLoading(true);
          await sdk.bakery.sso();
          setHasMemberToken(true);
          toast.success('Authenticated via Dashboard SSO');
      } catch (error) {
          toast.error('SSO Authentication failed');
      } finally {
          setIsSsoLoading(false);
      }
  };

  const handleResetDevice = async () => {
    try {
        await sdk.bakery.logout();
        await invoke('clear_provisioned_api_key');
        setHasDeviceKey(false);
        setHasMemberToken(false);
        localStorage.removeItem('bakery_local_mode');
        setIsLocalMode(false);
        setIsLocalAuthenticated(false);
        sessionStorage.removeItem('bakery_local_authenticated');
        toast.success('Terminal reset');
    } catch (error) {
        toast.error('Reset failed');
    }
  };

  if (!isInitialized) return <SessionSkeleton />;

  if (isLocalMode && !isLocalAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-2xl shadow-xl mb-4 border-primary/20 overflow-hidden">
              <img src="/logo.jpeg" alt="Scryme Bakery Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter">SCRYME BAKERY</h1>
            <p className="text-sm text-primary/70 font-medium uppercase tracking-widest mt-1">Local Mode</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Local Login</CardTitle>
              <CardDescription className="text-gray-600">Authenticate to access the local bakery system.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLocalLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="local-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      id="local-email"
                      type="email"
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      placeholder="admin@bakery.local"
                      className="pl-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local-password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      id="local-password"
                      type={showPin ? "text" : "password"}
                      value={localPassword}
                      onChange={(e) => setLocalPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pb-8">
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Login'}
                </Button>

                <button
                  type="button"
                  className="mt-4 text-xs text-gray-400 hover:text-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    localStorage.removeItem('bakery_local_mode');
                    setIsLocalMode(false);
                  }}
                >
                  <Globe className="h-3 w-3" />
                  Back to Cloud Mode
                </button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (!isLocalMode && (!hasDeviceKey || !hasMemberToken)) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
          <div className="w-full max-w-md">
            {/* Unified Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-2xl shadow-xl mb-4 border-primary/20 overflow-hidden">
                <img src="/logo.jpeg" alt="Scryme Bakery Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-black text-primary tracking-tighter">SCRYME BAKERY</h1>
              <p className="text-sm text-primary/70 font-medium uppercase tracking-widest mt-1">Terminal Node</p>
            </div>

            {!hasDeviceKey ? (
                /* Phase 1: Device Configuration */
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
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-3 border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={async () => {
                                      if (!apiUrl) return;
                                      setIsValidatingApi(true);
                                      try {
                                        const isValid = await invoke<boolean>('validate_api_endpoint', { apiUrl });
                                        if (isValid) {
                                          toast.success('API Endpoint is valid and reachable');
                                        } else {
                                          toast.error('API Endpoint returned an error');
                                        }
                                      } catch (err) {
                                        toast.error('Could not connect to API Endpoint');
                                      } finally {
                                        setIsValidatingApi(false);
                                      }
                                    }}
                                    disabled={isValidatingApi || !apiUrl}
                                  >
                                    {isValidatingApi ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Test'}
                                  </Button>
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

                            <div className="relative py-2 w-full">
                                <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
                                    <span className="bg-white/90 px-2 text-gray-400 font-semibold">Offline Mode</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleLocalMode}
                                className="w-full h-11 text-gray-500 hover:text-amber-600 hover:bg-amber-50/50"
                            >
                                <Globe className="h-4 w-4 mr-2" />
                                Use App Offline
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                /* Phase 2: Baker Authentication */
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="space-y-1 text-center pb-6">
                        <CardTitle className="text-2xl font-bold text-gray-900">Baker Sign In</CardTitle>
                        <CardDescription className="text-gray-600">Authenticate to begin production.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Production Location</Label>
                                <LocationSelect
                                    value={locationId}
                                    onValueChange={setLocationId}
                                    placeholder="Select kitchen location"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="card-id" className="text-sm font-medium text-gray-700">Baker ID</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                    <Input
                                        id="card-id"
                                        value={cardId}
                                        onChange={(e) => setCardId(e.target.value)}
                                        placeholder="Enter your Card ID"
                                        className="pl-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-sm font-medium text-gray-700">PIN</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                    <Input
                                        id="pin"
                                        type={showPin ? "text" : "password"}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        maxLength={4}
                                        placeholder="••••"
                                        className="pl-10 pr-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500 font-mono tracking-[0.5em]"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                                    >
                                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-8">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                                disabled={isLoggingIn || isSsoLoading}
                            >
                                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Sign In to Kitchen'}
                            </Button>

                            <div className="relative py-2 w-full">
                                <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
                                    <span className="bg-white/90 px-2 text-gray-400 font-semibold">Or fast access</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-amber-200 hover:bg-amber-50 text-amber-700"
                                onClick={handleSso}
                                disabled={isLoggingIn || isSsoLoading}
                            >
                                {isSsoLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                Dashboard SSO
                            </Button>

                            <button
                                type="button"
                                className="mt-4 text-xs text-gray-400 hover:text-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
                                onClick={handleLocalMode}
                            >
                                <Globe className="h-3 w-3" />
                                Use Local Mode
                            </button>

                            <button
                                type="button"
                                className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                                onClick={handleResetDevice}
                            >
                                Reset Terminal Configuration
                            </button>
                        </CardFooter>
                    </form>
                </Card>
            )}

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

  return <>{children}</>;
}
