'use client';

import { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { UpdateDialog } from '@/components/common/update-dialog';
import { isTauri } from '@/lib/sdk';

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
  snoozeUpdate: () => void;
  skipVersion: () => void;
}

const STORAGE_KEYS = {
  SKIPPED_VERSION: 'bakery_updater:skippedVersion',
  SNOOZED_UNTIL: 'bakery_updater:snoozedUntil',
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

const UpdaterContext = createContext<UpdaterContextType | undefined>(undefined);

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

interface UpdaterProviderProps {
  children: ReactNode;
  checkInterval?: number;
  deprecatedAfterDays?: number;
  snoozeDuration?: number;
}

export const UpdaterProvider = ({
  children,
  checkInterval = 3_600_000,
  deprecatedAfterDays = 14,
  snoozeDuration = 86_400_000,
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

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const closeModal = useCallback(() => {
    if (isCritical) return;
    setIsModalOpen(false);
  }, [isCritical]);

  const snoozeUpdate = useCallback(() => {
    if (isCritical) return;
    setSnoozedUntil(Date.now() + snoozeDuration);
    setIsModalOpen(false);
  }, [isCritical, snoozeDuration]);

  const skipVersion = useCallback(() => {
    if (isCritical) return;
    if (availableVersion) setSkippedVersion(availableVersion);
    setIsModalOpen(false);
    setIsUpdateAvailable(false);
    setStatus('IDLE');
  }, [isCritical, availableVersion]);

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

        clearSnooze();
        setStatus('DONE');
        await triggerRelaunch();
      } catch (e: any) {
        setError(e.message ?? 'Failed to update');
        setStatus('ERROR');
        setIsModalOpen(true);
      }
    },
    [isCritical, triggerRelaunch]
  );

  const startInstall = useCallback(async () => {
    if (!update) return;
    await processUpdate(update);
  }, [update, processUpdate]);

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

  const checkForUpdates = useCallback(async () => {
    if (!isTauri()) {
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

      if (getSkippedVersion() === version) {
        setStatus('IDLE');
        return;
      }

      const snoozedUntil = getSnoozedUntil();
      const isSnoozed = snoozedUntil > Date.now();

      let notes = updateResult.body ?? null;
      if (!notes) {
        notes = await fetchReleaseNotes(version);
      }

      let critical = !!notes?.includes('[CRITICAL]');
      if (!critical && updateResult.date) {
        const diffDays = Math.ceil(Math.abs(Date.now() - new Date(updateResult.date).getTime()) / 86_400_000);
        if (diffDays > deprecatedAfterDays) critical = true;
      }

      setUpdate(updateResult);
      setAvailableVersion(version);
      setIsUpdateAvailable(true);
      setReleaseNotes(notes ?? '');
      setReleaseDate(updateResult.date ?? null);
      setIsCritical(critical);

      setStatus('PENDING');

      if (critical) {
        clearSnooze();
        setIsModalOpen(true);
        return;
      }

      if (isSnoozed) {
        return;
      }

      setIsModalOpen(true);
    } catch (e: any) {
      setError(e.message);
      setStatus('ERROR');
    }
  }, [deprecatedAfterDays]);

  useEffect(() => {
    checkForUpdates();
    if (checkInterval <= 0) return;
    const id = setInterval(checkForUpdates, checkInterval);
    return () => clearInterval(id);
  }, [checkForUpdates, checkInterval]);

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

export function useUpdater(): UpdaterContextType {
  const ctx = useContext(UpdaterContext);
  if (!ctx) {
    throw new Error('useUpdater must be used within an <UpdaterProvider>.');
  }
  return ctx;
}
