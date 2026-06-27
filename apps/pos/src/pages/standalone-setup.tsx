import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Label } from '@repo/ui/components/ui/label';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { Key, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/pos-auth-store';

export default function StandaloneSetup() {
  const [step, setStep] = useState(2);
  const [machineId, setMachineId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [pin, setPin] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const completeSetup = useAuthStore(state => state.completeSetup);
  const setCurrentLocation = useAuthStore(state => state.setCurrentLocation);

  useEffect(() => {
    invoke<string>('get_machine_id').then(setMachineId).catch(console.error);
  }, []);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const response = await invoke<any>('activate_license', { licenseKey });
      if (response.success) {
        toast.success(response.message);
        setStep(2);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Activation failed');
    } finally {
      setIsActivating(false);
    }
  };

  const handleFinish = async () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    try {
      await invoke('set_local_auth', { pin });

      // Ensure backend device config is also set for standalone mode
      await invoke('set_device_config', {
        baseUrl: 'http://localhost',
        locationId: 'standalone',
        deviceKey: 'standalone-key',
      });

      // Mock device config and location for standalone
      setCurrentLocation({
        id: 'standalone',
        name: 'Local Store',
        locationType: 'RETAIL_SHOP',
        isActive: true,
        isDefault: true,
        organizationId: 'standalone-org',
      } as any);

      completeSetup('MAIN_HUB', null);

      toast.success('Setup complete!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to complete setup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      {step === 1 ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Key className="text-primary" />
            </div>
            <CardTitle>Activate Dealio Standalone</CardTitle>
            <CardDescription>Enter your license key to activate this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Machine ID (System Reference)</Label>
              <Input value={machineId} readOnly className="bg-muted font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseKey">License Key</Label>
              <Input
                id="licenseKey"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleActivate} disabled={isActivating || !licenseKey}>
              {isActivating ? 'Activating...' : 'Activate Device'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="text-green-600" />
            </div>
            <CardTitle>Security Setup</CardTitle>
            <CardDescription>Create a local PIN for accessing the POS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Access PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="1234"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleFinish}>
              Complete Setup
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
