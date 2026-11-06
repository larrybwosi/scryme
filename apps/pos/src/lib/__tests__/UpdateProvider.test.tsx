import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdaterProvider, useUpdater } from '../providers/UpdateProvider';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import * as pluginUpdater from '@tauri-apps/plugin-updater';
import * as pluginProcess from '@tauri-apps/plugin-process';

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn(),
}));

function TestConsumer() {
  const updater = useUpdater();
  return (
    <div>
      <div data-testid="status">{updater.status}</div>
      <div data-testid="version">{updater.availableVersion ?? 'none'}</div>
      <div data-testid="is-available">{String(updater.isUpdateAvailable)}</div>
      <div data-testid="is-critical">{String(updater.isCritical)}</div>
      <div data-testid="modal-open">{String(updater.isModalOpen)}</div>
      <button onClick={() => updater.checkForUpdates()}>Check</button>
      <button onClick={() => updater.startInstall()}>Install</button>
      <button onClick={() => updater.restartApp()}>Restart</button>
    </div>
  );
}

describe('UpdaterProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ isConfigured: true });
    usePosStore.setState({
      settings: {
        enableAutoUpdate: false,
      } as any,
    });
  });

  it('detects available update and switches to PENDING when auto-update is disabled', async () => {
    const mockUpdate = {
      version: '10.2.44',
      date: new Date().toISOString(),
      body: 'Bug fixes and improvements',
      downloadAndInstall: vi.fn(),
    };

    vi.mocked(pluginUpdater.check).mockResolvedValueOnce(mockUpdate as any);

    render(
      <UpdaterProvider checkInterval={0}>
        <TestConsumer />
      </UpdaterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PENDING');
      expect(screen.getByTestId('version').textContent).toBe('10.2.44');
      expect(screen.getByTestId('is-available').textContent).toBe('true');
      expect(screen.getByTestId('modal-open').textContent).toBe('true');
    });
  });

  it('automatically downloads, installs, and reloads when an update completes', async () => {
    const downloadAndInstall = vi.fn().mockImplementation(async onProgress => {
      onProgress({ event: 'Started', data: { contentLength: 100 } });
      onProgress({ event: 'Progress', data: { chunkLength: 50 } });
      onProgress({ event: 'Progress', data: { chunkLength: 50 } });
      onProgress({ event: 'Finished' });
    });

    const mockUpdate = {
      version: '10.2.44',
      date: new Date().toISOString(),
      body: 'Release notes',
      downloadAndInstall,
    };

    vi.mocked(pluginUpdater.check).mockResolvedValueOnce(mockUpdate as any);

    render(
      <UpdaterProvider checkInterval={0}>
        <TestConsumer />
      </UpdaterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PENDING');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(downloadAndInstall).toHaveBeenCalled();
      expect(pluginProcess.relaunch).toHaveBeenCalled();
      expect(screen.getByTestId('status').textContent).toBe('DONE');
    });
  });

  it('handles errors during download and sets status to ERROR', async () => {
    const downloadAndInstall = vi.fn().mockRejectedValueOnce(new Error('Signature verification failed'));

    const mockUpdate = {
      version: '10.2.44',
      date: new Date().toISOString(),
      body: 'Release notes',
      downloadAndInstall,
    };

    vi.mocked(pluginUpdater.check).mockResolvedValueOnce(mockUpdate as any);

    render(
      <UpdaterProvider checkInterval={0}>
        <TestConsumer />
      </UpdaterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PENDING');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ERROR');
      expect(pluginProcess.relaunch).not.toHaveBeenCalled();
    });
  });

  it('auto-processes update when enableAutoUpdate is true', async () => {
    usePosStore.setState({
      settings: {
        enableAutoUpdate: true,
      } as any,
    });

    const downloadAndInstall = vi.fn().mockResolvedValueOnce(undefined);
    const mockUpdate = {
      version: '10.2.44',
      date: new Date().toISOString(),
      body: 'Auto update release',
      downloadAndInstall,
    };

    vi.mocked(pluginUpdater.check).mockResolvedValueOnce(mockUpdate as any);

    render(
      <UpdaterProvider checkInterval={0}>
        <TestConsumer />
      </UpdaterProvider>
    );

    await waitFor(() => {
      expect(downloadAndInstall).toHaveBeenCalled();
      expect(pluginProcess.relaunch).toHaveBeenCalled();
      expect(screen.getByTestId('status').textContent).toBe('DONE');
    });
  });
});
