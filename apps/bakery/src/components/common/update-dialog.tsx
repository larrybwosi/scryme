'use client';

import { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Download,
  ScrollText,
  AlertTriangle,
  X,
  Zap,
  BellOff,
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import type { UpdateStatus } from '@/lib/providers/UpdateProvider';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSkip?: () => void;
  onConfirm?: () => void;
  releaseNotes?: string | null;
  isCritical?: boolean;
  status?: UpdateStatus;
}

const markdownOptions = {
  forceBlock: true,
  overrides: {
    h1: { props: { className: 'text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-1.5' } },
    h2: { props: { className: 'text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 mb-1' } },
    h3: { props: { className: 'text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-2 mb-1' } },
    p: { props: { className: 'text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed' } },
    ul: { props: { className: 'list-disc pl-4 mb-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-1' } },
    li: { props: { className: 'leading-relaxed' } },
    code: {
      props: {
        className: 'rounded bg-zinc-200/60 dark:bg-zinc-800 px-1 py-0.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200',
      },
    },
  },
};

export function UpdateDialog({
  open,
  onClose,
  onSkip,
  onConfirm,
  releaseNotes,
  isCritical = false,
  status = 'PENDING',
}: UpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm?.();
    } finally {
      setIsLoading(false);
    }
  };

  const isDone = status === 'DONE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all">
        {isDone ? (
          /* ── READY TO RESTART VIEW ── */
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Update Ready to Install
            </h2>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              The update has been downloaded successfully. Restart the application now to complete the update.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              {!isCritical && (
                <button
                  onClick={onClose}
                  className="h-9 rounded-lg px-4 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
                >
                  Later
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="h-9 rounded-lg px-5 text-xs font-semibold inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isLoading ? (
                  <span>Restarting…</span>
                ) : (
                  <>
                    Restart Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── STANDARD UPDATE VIEW ── */
          <>
            {isCritical && (
              <div
                className="absolute inset-x-0 top-0 h-[2px] z-10"
                style={{
                  background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
                  backgroundSize: '200% 100%',
                }}
              />
            )}

            <div className="relative px-6 pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="relative mt-0.5 shrink-0">
                  <div
                    className={`
                      relative flex h-11 w-11 items-center justify-center rounded-xl
                      ${
                        isCritical
                          ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                          : 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      }
                    `}
                  >
                    {isCritical ? <ShieldAlert className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                      {isCritical ? 'Critical Update Required' : 'Update Available'}
                    </h2>
                    {isCritical && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:bg-red-950/60 dark:text-red-400">
                        <Zap className="h-2.5 w-2.5" /> Required
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {isCritical
                      ? 'This release contains essential stability and feature fixes. Installation is required.'
                      : 'A new version is ready with improvements and bug fixes.'}
                  </p>
                </div>

                {!isCritical && (
                  <button
                    onClick={onClose}
                    title="Remind me later"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <ScrollText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Release Notes
                </span>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/60">
                <div className="max-h-[200px] overflow-y-auto p-4">
                  {releaseNotes ? (
                    <Markdown options={markdownOptions}>{releaseNotes}</Markdown>
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center gap-2 text-zinc-400">
                      <AlertTriangle className="h-6 w-6" />
                      <p className="text-xs">No release notes for this version.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-1">
                {!isCritical ? (
                  <button
                    onClick={onSkip}
                    title="Don't remind me about this version"
                    className="inline-flex items-center gap-1.5 h-9 rounded-lg px-3 text-xs font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    Skip this version
                  </button>
                ) : (
                  <p className="text-[11px] text-zinc-400 font-mono">⚠ mandatory</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isCritical && (
                  <button
                    onClick={onClose}
                    className="h-9 rounded-lg px-4 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    Later
                  </button>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`
                    h-9 rounded-lg px-5 text-xs font-semibold
                    inline-flex items-center gap-2
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${
                      isCritical
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                    }
                  `}
                >
                  {isLoading ? (
                    <span>{isCritical ? 'Installing…' : 'Downloading…'}</span>
                  ) : isCritical ? (
                    <>
                      Install Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Download Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
