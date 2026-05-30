'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Info, CheckCircle, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Switch } from '@repo/ui/components/ui/switch';
import { Slider } from '@repo/ui/components/ui/slider';
import { Button } from '@repo/ui/components/ui/button';
import { Separator } from '@repo/ui/components/ui/separator';
import { notificationService, type NotificationSettings } from '@/lib/notification-service';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsDialog({ open, onOpenChange }: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());

  useEffect(() => {
    if (open) {
      setSettings(notificationService.getSettings());
    }
  }, [open]);

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
  };

  const testSound = (type: 'info' | 'success' | 'warning' | 'error' | 'sale') => {
    const soundMap = {
      info: { file: '/sounds/notification-info.mp3', enabled: 'infoSoundEnabled' as const },
      success: { file: '/sounds/notification-success.mp3', enabled: 'successSoundEnabled' as const },
      warning: { file: '/sounds/notification-warning.mp3', enabled: 'warningSoundEnabled' as const },
      error: { file: '/sounds/notification-error.mp3', enabled: 'errorSoundEnabled' as const },
      sale: { file: '/sounds/notification-sale.mp3', enabled: 'saleSoundEnabled' as const },
    };

    const sound = soundMap[type];
    if (settings[sound.enabled] && settings.soundEnabled) {
      try {
        const audio = new Audio(sound.file);
        audio.volume = settings.soundVolume;
        audio.play().catch(e => console.error('Failed to play test sound:', e));
      } catch (error) {
        console.error('Failed to create audio:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>Configure how you receive and hear notifications</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Sound Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Sound Notifications
                </Label>
                <p className="text-sm text-muted-foreground">Enable or disable all notification sounds</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={checked => updateSetting('soundEnabled', checked)}
              />
            </div>

            {settings.soundEnabled && (
              <div className="space-y-2">
                <Label className="text-sm">Volume</Label>
                <div className="flex items-center gap-4">
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[settings.soundVolume * 100]}
                    onValueChange={value => updateSetting('soundVolume', value[0] / 100)}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-12 text-right">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Individual Sound Controls */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Sound by Notification Type</h4>
              <p className="text-xs text-muted-foreground">
                Enable or disable sounds for specific types of notifications
              </p>
            </div>

            {/* Info Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Info Notifications</Label>
                  <p className="text-xs text-muted-foreground">General information and updates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('info')}
                  disabled={!settings.soundEnabled || !settings.infoSoundEnabled}
                  className="h-8"
                >
                  Test
                </Button>
                <Switch
                  checked={settings.infoSoundEnabled}
                  onCheckedChange={checked => updateSetting('infoSoundEnabled', checked)}
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>

            {/* Success Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Success Notifications</Label>
                  <p className="text-xs text-muted-foreground">Confirmations and completions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('success')}
                  disabled={!settings.soundEnabled || !settings.successSoundEnabled}
                  className="h-8"
                >
                  Test
                </Button>
                <Switch
                  checked={settings.successSoundEnabled}
                  onCheckedChange={checked => updateSetting('successSoundEnabled', checked)}
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>

            {/* Warning Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Warning Notifications</Label>
                  <p className="text-xs text-muted-foreground">Important alerts and cautions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('warning')}
                  disabled={!settings.soundEnabled || !settings.warningSoundEnabled}
                  className="h-8"
                >
                  Test
                </Button>
                <Switch
                  checked={settings.warningSoundEnabled}
                  onCheckedChange={checked => updateSetting('warningSoundEnabled', checked)}
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>

            {/* Error Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Error Notifications</Label>
                  <p className="text-xs text-muted-foreground">Critical errors and failures</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('error')}
                  disabled={!settings.soundEnabled || !settings.errorSoundEnabled}
                  className="h-8"
                >
                  Test
                </Button>
                <Switch
                  checked={settings.errorSoundEnabled}
                  onCheckedChange={checked => updateSetting('errorSoundEnabled', checked)}
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>

            {/* Sale Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Sale Notifications</Label>
                  <p className="text-xs text-muted-foreground">Completed sales and transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('sale')}
                  disabled={!settings.soundEnabled || !settings.saleSoundEnabled}
                  className="h-8"
                >
                  Test
                </Button>
                <Switch
                  checked={settings.saleSoundEnabled}
                  onCheckedChange={checked => updateSetting('saleSoundEnabled', checked)}
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
