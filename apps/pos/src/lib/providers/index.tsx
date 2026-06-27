'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { usePosStore } from '@/store/store';
import { NotificationToast } from '@/components/notification-toast';
import { ConnectionStatusBanner } from '@/components/connection-status-banner';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UpdaterProvider } from '@/lib/providers/UpdateProvider';
import RealtimeInitializer from '@/lib/providers/RealtimeProvider';
import { ServerNotificationProvider } from '@/lib/providers/ServerNotificationProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const themeConfig = usePosStore(state => state.settings.themeConfig);
  const checkLowStockAlerts = usePosStore(state => state.checkLowStockAlerts);

  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme mode
    if (themeConfig.mode === 'dark') {
      root.classList.add('dark');
    } else if (themeConfig.mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply font size
    if (themeConfig.fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (themeConfig.fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    // Apply compact mode
    if (themeConfig.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply Zoom Level
    if (themeConfig.zoomLevel) {
      // @ts-ignore - zoom is a non-standard property but widely supported for this use case
      root.style.zoom = (themeConfig.zoomLevel / 100).toString();
    } else {
      // @ts-ignore
      root.style.zoom = '1';
    }

    // Apply Custom Colors
    if (themeConfig.primaryColor) {
      root.style.setProperty('--primary', themeConfig.primaryColor);
      root.style.setProperty('--ring', themeConfig.primaryColor);
      root.style.setProperty('--sidebar-primary', themeConfig.primaryColor);

      // Calculate foreground based on contrast
      const foreground = getContrastColor(themeConfig.primaryColor);
      root.style.setProperty('--primary-foreground', foreground);
      root.style.setProperty('--sidebar-primary-foreground', foreground);
    }

    if (themeConfig.accentColor) {
      root.style.setProperty('--accent', themeConfig.accentColor);
      root.style.setProperty('--sidebar-accent', themeConfig.accentColor);

      // Calculate foreground based on contrast
      const foreground = getContrastColor(themeConfig.accentColor);
      root.style.setProperty('--accent-foreground', foreground);
      root.style.setProperty('--sidebar-accent-foreground', foreground);
    }
  }, [themeConfig]);

  useEffect(() => {
    // Initial check
    checkLowStockAlerts();

    // Check every 5 minutes
    const interval = setInterval(
      () => {
        checkLowStockAlerts();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [checkLowStockAlerts]);

  return (
    <>
      <RealtimeInitializer />
      <NotificationToast />
      <ConnectionStatusBanner />
      <QueryClientProvider client={queryClient}>
        <UpdaterProvider checkInterval={60 * 60 * 1000 * 4}>
          <ServerNotificationProvider>{children}</ServerNotificationProvider>
        </UpdaterProvider>
      </QueryClientProvider>

      {/* Custom Desktop POS Toaster Configuration */}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton={true}
        duration={4000}
        visibleToasts={6}
        theme={themeConfig.mode === 'dark' ? 'dark' : 'light'}
        offset={16}
        toastOptions={{
          className: 'border border-border shadow-lg font-medium',
          style: {
            minWidth: '300px',
          },
        }}
      />
    </>
  );
}

// Helper to calculate appropriate foreground color (black or white)
// Supports Hex, RGB, and minimal OKLCH (fallback)
function getContrastColor(color: string): string {
  let r = 0,
    g = 0,
    b = 0;

  // Handle Hex
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  // Handle RGB/RGBA
  else if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }
  // Fallback for OKLCH or others (not perfect, but default to white text for safety on likely dark colors)
  else {
    return '#ffffff';
  }

  // Calculate YIQ brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}
