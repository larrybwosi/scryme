'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Key, Phone, Shield } from 'lucide-react';
import Link from 'next/link';

export default function WhatsappSettingsPage() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('DISCONNECTED');
  const [loading, setLoading] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/v3/crm/communication/whatsapp/config');
        if (res.ok) {
          const data = await res.json();
          const config = data.data || data;
          setIsConnected(config.isConnected);
          setSyncStatus(config.syncStatus);
          if (config.credentials) {
            setPhoneNumberId(config.credentials.phoneNumberId || '');
            setAccessToken(config.credentials.accessToken || '');
            setWabaId(config.credentials.wabaId || '');
            setDisplayPhoneNumber(config.credentials.displayPhoneNumber || '');
          }
        }
      } catch (e) {
        console.error('Failed to load WhatsApp config', e);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v3/crm/communication/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
          wabaId,
          displayPhoneNumber,
        }),
      });

      if (res.ok) {
        setIsConnected(true);
        setSyncStatus('CONNECTED');
        setSaved(true);
      }
    } catch (e) {
      console.error('Failed to save config', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      await fetch('/api/v3/crm/communication/templates/sync', { method: 'POST' });
    } catch (e) {
      console.error('Failed to sync templates', e);
    } finally {
      setSyncingTemplates(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/communications">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">WhatsApp Integration</h1>
          <p className="text-xs text-muted-foreground">Configure Meta WhatsApp Business Cloud API settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                Connection Status
                {isConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/20">Disconnected</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Link your Meta WhatsApp Business Account to enable client and supplier messaging.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number ID
            </label>
            <Input
              placeholder="e.g. 102290129340398"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-muted-foreground" /> Meta Graph API Access Token
            </label>
            <Input
              type="password"
              placeholder="EAAB..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">WhatsApp Business Account ID (WABA ID)</label>
              <Input
                placeholder="Optional"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Display Phone Number</label>
              <Input
                placeholder="e.g. +254712345678"
                value={displayPhoneNumber}
                onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Settings saved successfully!
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTemplates}
            disabled={!isConnected || syncingTemplates}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingTemplates ? 'animate-spin' : ''}`} /> Sync Templates
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
