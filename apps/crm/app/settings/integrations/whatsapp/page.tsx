'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Switch } from '@repo/ui/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { CheckCircle2, RefreshCw, ArrowLeft, Key, Phone, ShieldCheck, Copy, Check, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import {
  getWhatsappConfig,
  saveWhatsappConfig,
  syncWhatsappTemplates,
} from '@/app/actions/whatsapp';

export default function WhatsappSettingsPage() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [enableWelcomeReply, setEnableWelcomeReply] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [enableOutOfOfficeReply, setEnableOutOfOfficeReply] = useState(false);
  const [outOfOfficeMessage, setOutOfOfficeMessage] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await getWhatsappConfig();
        if (res.success && res.data) {
          setIsConnected(res.data.isConnected);
          setWebhookUrl(res.data.webhookCallbackUrl || '');
          if (res.data.credentials) {
            setPhoneNumberId(res.data.credentials.phoneNumberId || '');
            setAccessToken(res.data.credentials.accessToken || '');
            setWabaId(res.data.credentials.wabaId || '');
            setAppSecret(res.data.credentials.appSecret || '');
            setVerifyToken(res.data.credentials.verifyToken || res.data.verifyToken || '');
            setDisplayPhoneNumber(res.data.credentials.displayPhoneNumber || '');
          } else {
            setVerifyToken(res.data.verifyToken || '');
          }

          if (res.data.settings) {
            setEnableWelcomeReply(!!res.data.settings.enableWelcomeReply);
            setWelcomeMessage(res.data.settings.welcomeMessage || 'Hello! Thank you for contacting us. We will assist you shortly.');
            setEnableOutOfOfficeReply(!!res.data.settings.enableOutOfOfficeReply);
            setOutOfOfficeMessage(res.data.settings.outOfOfficeMessage || 'Thank you for reaching out. We are currently out of the office and will respond soon.');
          }
        }
      } catch (e) {
        console.error('Failed to load WhatsApp config', e);
      }
    }
    loadConfig();
  }, []);

  const handleCopy = (text: string, type: 'url' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setErrorMsg('');
    try {
      const res = await saveWhatsappConfig({
        phoneNumberId,
        accessToken,
        wabaId,
        appSecret,
        verifyToken,
        displayPhoneNumber,
        enableWelcomeReply,
        welcomeMessage,
        enableOutOfOfficeReply,
        outOfOfficeMessage,
      });

      if (res.success) {
        setIsConnected(true);
        setSaved(true);
      } else {
        setErrorMsg(res.error || 'Failed to save configuration');
      }
    } catch (e: any) {
      console.error('Failed to save config', e);
      setErrorMsg(e?.message || 'Error occurred while saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    setErrorMsg('');
    try {
      const res = await syncWhatsappTemplates();
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sync templates');
      }
    } catch (e: any) {
      console.error('Failed to sync templates', e);
      setErrorMsg(e?.message || 'Error occurred while syncing templates');
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
          <h1 className="text-xl font-bold">WhatsApp Business Cloud API</h1>
          <p className="text-xs text-muted-foreground">Configure official Meta WhatsApp Cloud API credentials, webhook callbacks, and autoreplies</p>
        </div>
      </div>

      {/* Meta Webhook Configuration Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Meta Webhook Callbacks Setup
              </CardTitle>
              <CardDescription className="text-xs">
                Copy and paste these webhook parameters into your Meta Developer App (WhatsApp &gt; Configuration &gt; Webhook).
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Meta Cloud API v23.0
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Callback URL</label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={webhookUrl || 'https://api.scryme.tech/webhooks/whatsapp'}
                className="font-mono text-xs bg-muted/30"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => handleCopy(webhookUrl || 'https://api.scryme.tech/webhooks/whatsapp', 'url')}
              >
                {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Verify Token</label>
            <div className="flex items-center gap-2">
              <Input
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Enter or use generated verify token"
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => handleCopy(verifyToken, 'token')}
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Credentials Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                API Credentials
                {isConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/20">Disconnected</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Credentials from your Meta for Developers App Dashboard.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number ID *
              </label>
              <Input
                placeholder="e.g. 102290129340398"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
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

          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-muted-foreground" /> System User Access Token *
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
                placeholder="e.g. 9876543210123"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Meta App Secret (for HMAC validation)</label>
              <Input
                type="password"
                placeholder="App secret from Basic Settings"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automated Replies & Greetings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Automations & Autoreplies
          </CardTitle>
          <CardDescription className="text-xs">
            Configure automated responses triggered when customers initiate inquiries or send messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold">Welcome / First Contact Greeting</label>
                <p className="text-[11px] text-muted-foreground">Automatically send a greeting when a customer initiates a new conversation thread.</p>
              </div>
              <Switch
                checked={enableWelcomeReply}
                onCheckedChange={setEnableWelcomeReply}
              />
            </div>
            {enableWelcomeReply && (
              <Textarea
                rows={2}
                placeholder="Welcome greeting message..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="text-xs"
              />
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Out-of-Office Autoreply
                </label>
                <p className="text-[11px] text-muted-foreground">Automatically notify customers when receiving inquiries outside normal operating hours.</p>
              </div>
              <Switch
                checked={enableOutOfOfficeReply}
                onCheckedChange={setEnableOutOfOfficeReply}
              />
            </div>
            {enableOutOfOfficeReply && (
              <Textarea
                rows={2}
                placeholder="Out of office notification message..."
                value={outOfOfficeMessage}
                onChange={(e) => setOutOfOfficeMessage(e.target.value)}
                className="text-xs"
              />
            )}
          </div>

          {saved && (
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Configuration saved successfully!
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-xs">
              {errorMsg}
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
