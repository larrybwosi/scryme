'use client';

import { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { UpdateDialog } from '@/components/update.dialog';
import { usePosStore } from '@/store/store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UpdateStatus = 'IDLE' | 'CHECKING' | 'PENDING' | 'DOWNLOADING' | 'DONE' | 'ERROR';

export interface UpdaterContextType {
  isUpdateAvailable: boolean;
  isCritical: boolean;
  releaseNotes: string | null;
  releaseDate: string | null;
  availableVersion: string | null;
  status: UpdateStatus;
  downloadProgress: number;
  isModalOpen: boolean;
  error: string | null;
  openModal: () => void;
  closeModal: () => void;
  checkForUpdates: () => Promise<void>;
  startInstall: () => Promise<void>;
  /** Dismiss until the next session check cycle (24 h snooze). */
  snoozeUpdate: () => void;
  /** Never prompt for this specific version again. */
  skipVersion: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  SKIPPED_VERSION: 'updater:skippedVersion',
  SNOOZED_UNTIL: 'updater:snoozedUntil',
} as const;

function getSkippedVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION);
  } catch {
    return null;
  }
}

function setSkippedVersion(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SKIPPED_VERSION, version);
  } catch {
    /* ignore */
  }
}

function getSnoozedUntil(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.SNOOZED_UNTIL) ?? '0', 10);
  } catch {
    return 0;
  }
}

function setSnoozedUntil(ts: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SNOOZED_UNTIL, String(ts));
  } catch {
    /* ignore */
  }
}

function clearSnooze(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SNOOZED_UNTIL);
  } catch {
    /* ignore */
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UpdaterContext = createContext<UpdaterContextType | undefined>(undefined);

// ─── Progress Toast ───────────────────────────────────────────────────────────

const ProgressToast = ({ progress }: { progress: number }) => (
  <div className="fixed bottom-5 right-5 z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-2 flex items-center justify-between">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Downloading Update...</h4>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{progress}%</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
    </div>
    <p className="mt-2 text-xs text-gray-500">The application will restart automatically when finished.</p>
  </div>
);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface UpdaterProviderProps {
  children: ReactNode;
  /** How often to poll for updates in ms. Default: 1 hour. Pass 0 to disable. */
  checkInterval?: number;
  /** Mark an update critical when the release is older than this many days. Default: 14. */
  deprecatedAfterDays?: number;
  /** How long (ms) a "Later" snooze lasts. Default: 24 hours. */
  snoozeDuration?: number;
}

export const UpdaterProvider = ({
  children,
  checkInterval = 3_600_000,
  deprecatedAfterDays = 14,
  snoozeDuration = 86_400_000, // 24 h
}: UpdaterProviderProps) => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('IDLE');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Modal controls ──────────────────────────────────────────────────────────

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const closeModal = useCallback(() => {
    if (isCritical) return; // critical updates cannot be dismissed
    setIsModalOpen(false);
  }, [isCritical]);

  // ── Snooze: hide for snoozeDuration, re-prompt on next interval ─────────────

  const snoozeUpdate = useCallback(() => {
    if (isCritical) return;
    setSnoozedUntil(Date.now() + snoozeDuration);
    setIsModalOpen(false);
  }, [isCritical, snoozeDuration]);

  // ── Skip: never prompt for this specific version again ──────────────────────

  const skipVersion = useCallback(() => {
    if (isCritical) return;
    if (availableVersion) setSkippedVersion(availableVersion);
    setIsModalOpen(false);
    setIsUpdateAvailable(false);
    setStatus('IDLE');
  }, [isCritical, availableVersion]);

  // ── Install ─────────────────────────────────────────────────────────────────

  const triggerRelaunch = useCallback(async () => {
    clearSnooze();
    await relaunch();
  }, []);

  const processUpdate = useCallback(
    async (updateObj: Update) => {
      setStatus('DOWNLOADING');
      if (!isCritical) setIsModalOpen(false);
      setError(null);

      try {
        let downloadedBytes = 0;
        let totalBytes = 0;

        const enableAutoUpdate = usePosStore.getState().settings?.enableAutoUpdate ?? true;

        await updateObj.downloadAndInstall(progress => {
          switch (progress.event) {
            case 'Started':
              totalBytes = progress.data.contentLength ?? 0;
              break;
            case 'Progress':
              downloadedBytes += progress.data.chunkLength;
              if (totalBytes > 0) {
                setDownloadProgress(Math.round((downloadedBytes / totalBytes) * 100));
              }
              break;
            case 'Finished':
              setStatus('DONE');
              break;
          }
        });

        // Clear any snooze/skip state now that we've installed
        clearSnooze();
        if (enableAutoUpdate) {
          setStatus('DONE');
          setIsModalOpen(true);
        } else {
          await relaunch();
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to update');
        setStatus('ERROR');
        setIsModalOpen(true);
      }
    },
    [isCritical]
  );

  const startInstall = useCallback(async () => {
    if (!update) return;
    await processUpdate(update);
  }, [update, processUpdate]);

  // ── GitHub release notes fallback ──────────────────────────────────────────

  const fetchReleaseNotes = async (version: string): Promise<string | null> => {
    try {
      const tag = version.startsWith('v') ? version : `v${version}`;
      const res = await fetch(`https://api.github.com/repos/larrybwosi/scryme/releases/tags/${tag}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.body ?? null;
    } catch {
      return null;
    }
  };

  // ── Core check ─────────────────────────────────────────────────────────────

  const checkForUpdates = useCallback(async () => {
    if (import.meta.env.MODE === 'standalone') {
      setStatus('IDLE');
      return;
    }

    setStatus('CHECKING');
    setError(null);

    try {
      const updateResult: Update | null = await check();

      if (!updateResult) {
        setStatus('IDLE');
        return;
      }

      const version = updateResult.version;

      // 1. Skip: user permanently dismissed this version
      if (getSkippedVersion() === version) {
        setStatus('IDLE');
        return;
      }

      // 2. Snooze: user clicked "Later" — respect the snooze window
      //    UNLESS the update is critical (we'll evaluate that below first).
      const snoozedUntil = getSnoozedUntil();
      const isSnoozed = snoozedUntil > Date.now();

      // Collect metadata
      let notes = updateResult.body ?? null;
      if (!notes) {
        notes = await fetchReleaseNotes(version);
      }

      // Determine criticality before deciding whether to honour snooze
      let critical = !!notes?.includes('[CRITICAL]');
      if (!critical && updateResult.date) {
        const diffDays = Math.ceil(Math.abs(Date.now() - new Date(updateResult.date).getTime()) / 86_400_000);
        if (diffDays > deprecatedAfterDays) critical = true;
      }

      // Store update state regardless so consumers can inspect it
      setUpdate(updateResult);
      setAvailableVersion(version);
      setIsUpdateAvailable(true);
      setReleaseNotes(notes ?? '');
      setReleaseDate(updateResult.date ?? null);
      setIsCritical(critical);

      const enableAutoUpdate = usePosStore.getState().settings?.enableAutoUpdate ?? true;
      if (enableAutoUpdate) {
        await processUpdate(updateResult);
        return;
      }

      setStatus('PENDING');

      // 3. Critical updates bypass snooze entirely
      if (critical) {
        clearSnooze(); // reset snooze so next interval also prompts
        setIsModalOpen(true);
        return;
      }

      // 4. Non-critical + snoozed: don't open modal
      if (isSnoozed) {
        return;
      }

      setIsModalOpen(true);
    } catch (e: any) {
      setError(e.message);
      setStatus('ERROR');
    }
  }, [deprecatedAfterDays]);

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkForUpdates();
    if (checkInterval <= 0) return;
    const id = setInterval(checkForUpdates, checkInterval);
    return () => clearInterval(id);
  }, [checkForUpdates, checkInterval]);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: UpdaterContextType = {
    isUpdateAvailable,
    isCritical,
    releaseNotes,
    releaseDate,
    availableVersion,
    status,
    downloadProgress,
    isModalOpen,
    error,
    openModal,
    closeModal,
    checkForUpdates,
    startInstall,
    snoozeUpdate,
    skipVersion,
  };

  return (
    <UpdaterContext.Provider value={value}>
      {children}

      <UpdateDialog
        open={isModalOpen}
        onOpenChange={open => {
          if (!open) snoozeUpdate();
        }}
        onClose={snoozeUpdate}
        onSkip={skipVersion}
        onConfirm={status === 'DONE' ? triggerRelaunch : startInstall}
        releaseNotes={releaseNotes}
        isCritical={isCritical}
        status={status}
      />

      {status === 'DOWNLOADING' && <ProgressToast progress={downloadProgress} />}
    </UpdaterContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the updater from anywhere inside <UpdaterProvider>.
 *
 * @example
 * const { status, checkForUpdates, snoozeUpdate, skipVersion } = useUpdater();
 */
export function useUpdater(): UpdaterContextType {
  const ctx = useContext(UpdaterContext);
  if (!ctx) {
    throw new Error('useUpdater must be used within an <UpdaterProvider>.');
  }
  return ctx;
}
