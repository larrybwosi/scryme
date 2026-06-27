'use client';

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Lock, User, AlertCircle, Loader2, Zap, ShieldCheck, Activity, Globe, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/providers/auth-context';
import { Separator } from '@repo/ui/components/ui/separator';
import { isOfflineMode } from '@/lib/sdk';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginLocal, sso, isLoading } = useAuth();

  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(isOfflineMode());

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      if (isLocalMode) {
        await loginLocal(localEmail, localPassword);
      } else {
        await login({ cardId, pin });
      }
      toast.success('Authenticated successfully');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSso = async () => {
    setIsLoggingIn(true);
    try {
      await sso();
      toast.success('Authenticated via Dashboard SSO');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error('SSO Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleLocalMode = () => {
    const newMode = !isLocalMode;
    setIsLocalMode(newMode);
    if (newMode) {
      localStorage.setItem('bakery_local_mode', 'true');
    } else {
      localStorage.removeItem('bakery_local_mode');
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
          <p className="text-sm text-primary/70 font-medium uppercase tracking-widest mt-1">
            {isLocalMode ? 'Local Mode' : 'Terminal Node'}
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLocalMode ? 'Local Login' : 'Baker Sign In'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isLocalMode
                ? 'Authenticate to access the local bakery system.'
                : 'Authenticate to begin production.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {isLocalMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="local-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
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
                </>
              ) : (
                <>
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
                        maxLength={20}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 border-amber-200 focus:ring-amber-500 focus:border-amber-500 font-mono tracking-[0.2em]"
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
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8">
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                disabled={isLoggingIn || isLoading}
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (isLocalMode ? 'Login' : 'Sign In to Kitchen')}
              </Button>

              {!isLocalMode && (
                <>
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
                    disabled={isLoggingIn || isLoading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Dashboard SSO
                  </Button>
                </>
              )}

              <button
                type="button"
                className="mt-4 text-xs text-gray-400 hover:text-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
                onClick={toggleLocalMode}
              >
                <Globe className="h-3 w-3" />
                {isLocalMode ? 'Back to Cloud Mode' : 'Use Local Mode'}
              </button>
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
