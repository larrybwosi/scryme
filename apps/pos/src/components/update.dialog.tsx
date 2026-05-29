'use client';

import { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { ShieldAlert, Sparkles, X, Download, ArrowRight, ScrollText, AlertTriangle, Zap, BellOff } from 'lucide-react';

// ─── Markdown Overrides ───────────────────────────────────────────────────────

const markdownOptions = {
  overrides: {
    h1: {
      component: ({ children, ...props }: any) => (
        <h1
          {...props}
          className="mt-5 first:mt-0 text-[13px] font-semibold tracking-[0.04em] uppercase text-zinc-800 dark:text-zinc-100"
        >
          {children}
        </h1>
      ),
    },
    h2: {
      component: ({ children, ...props }: any) => (
        <h2
          {...props}
          className="mt-4 first:mt-0 text-[13px] font-semibold tracking-[0.03em] uppercase text-zinc-700 dark:text-zinc-200"
        >
          {children}
        </h2>
      ),
    },
    h3: {
      component: ({ children, ...props }: any) => (
        <h3
          {...props}
          className="mt-3 first:mt-0 text-[12px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
        >
          {children}
        </h3>
      ),
    },
    p: {
      component: ({ children, ...props }: any) => (
        <p {...props} className="mt-2 first:mt-0 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {children}
        </p>
      ),
    },
    ul: {
      component: ({ children, ...props }: any) => (
        <ul {...props} className="mt-2 space-y-1.5 pl-4">
          {children}
        </ul>
      ),
    },
    li: {
      component: ({ children, ...props }: any) => (
        <li
          {...props}
          className="relative text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 before:absolute before:-left-4 before:top-[0.45em] before:h-1 before:w-1 before:rounded-full before:bg-zinc-300 dark:before:bg-zinc-600"
        >
          {children}
        </li>
      ),
    },
    a: {
      component: ({ children, ...props }: any) => (
        <a
          {...props}
          className="text-blue-500 underline underline-offset-2 hover:text-blue-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    },
    code: {
      component: ({ children, ...props }: any) => (
        <code
          {...props}
          className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {children}
        </code>
      ),
    },
    blockquote: {
      component: ({ children, ...props }: any) => (
        <blockquote
          {...props}
          className="mt-3 border-l border-zinc-200 pl-4 italic text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
        >
          {children}
        </blockquote>
      ),
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Snooze: remind me later (24 h). */
  onClose: () => void;
  /** Skip: never prompt for this version again. */
  onSkip: () => void;
  onConfirm: () => Promise<void>;
  releaseNotes: string | null;
  isCritical: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UpdateDialog({
  open,
  onOpenChange,
  onClose,
  onSkip,
  onConfirm,
  releaseNotes,
  isCritical,
}: UpdateDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
    } else {
      const t = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!isMounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isCritical) return;
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .ud-root { font-family: 'DM Sans', sans-serif; }

        @keyframes ud-backdrop-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ud-backdrop-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes ud-panel-in  {
          from { opacity: 0; transform: translateY(12px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ud-panel-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(8px) scale(0.99); }
        }
        @keyframes ud-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes ud-pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes ud-spin { to { transform: rotate(360deg); } }

        .ud-backdrop-enter { animation: ud-backdrop-in  0.25s ease forwards; }
        .ud-backdrop-exit  { animation: ud-backdrop-out 0.3s  ease forwards; }
        .ud-panel-enter    { animation: ud-panel-in  0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        .ud-panel-exit     { animation: ud-panel-out 0.25s ease forwards; }

        .ud-critical-glow {
          box-shadow:
            0 0 0 1px rgba(239,68,68,0.15),
            0 20px 60px -12px rgba(239,68,68,0.18),
            0 8px 24px -4px rgba(0,0,0,0.14);
        }
        .ud-standard-glow {
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.06),
            0 20px 60px -12px rgba(0,0,0,0.2),
            0 8px 24px -4px rgba(0,0,0,0.1);
        }
        .dark .ud-standard-glow {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06),
            0 20px 60px -12px rgba(0,0,0,0.5),
            0 8px 24px -4px rgba(0,0,0,0.3);
        }

        .ud-scroll::-webkit-scrollbar { width: 4px; }
        .ud-scroll::-webkit-scrollbar-track { background: transparent; }
        .ud-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .dark .ud-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }

        .ud-critical-badge {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }
        .dark .ud-critical-badge {
          background: linear-gradient(135deg, rgba(127,29,29,0.4) 0%, rgba(153,27,27,0.2) 100%);
        }

        .ud-icon-pulse { animation: ud-pulse-ring 2.4s ease-in-out infinite; }

        .ud-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: ud-spin 0.7s linear infinite;
          display: inline-block;
        }
        .ud-spinner-dark {
          border-color: rgba(0,0,0,0.15);
          border-top-color: #18181b;
        }

        .ud-btn-primary {
          position: relative;
          overflow: hidden;
          transition: transform 0.12s ease, opacity 0.12s ease;
        }
        .ud-btn-primary:hover  { transform: translateY(-1px); }
        .ud-btn-primary:active { transform: translateY(0); opacity: 0.9; }
        .ud-btn-primary:disabled { transform: none; }

        .ud-btn-ghost { transition: background 0.15s ease, color 0.15s ease; }
      `}</style>

      <div className="ud-root fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-0">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 ${open ? 'ud-backdrop-enter' : 'ud-backdrop-exit'}`}
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={`
            relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950
            ${isCritical ? 'ud-critical-glow' : 'ud-standard-glow'}
            ${open ? 'ud-panel-enter' : 'ud-panel-exit'}
          `}
        >
          {/* Critical shimmer accent */}
          {isCritical && (
            <div
              className="absolute inset-x-0 top-0 h-[2px] z-10"
              style={{
                background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
                backgroundSize: '200% 100%',
                animation: 'ud-shimmer 2.5s linear infinite',
              }}
            />
          )}

          {!isCritical && (
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent dark:via-zinc-700/60" />
          )}

          {/* ── HEADER ── */}
          <div className="relative px-6 pt-6 pb-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="relative mt-0.5 shrink-0">
                {isCritical && (
                  <div className="ud-icon-pulse absolute inset-0 rounded-xl bg-red-400/20 dark:bg-red-500/15" />
                )}
                <div
                  className={`
                    relative flex h-11 w-11 items-center justify-center rounded-xl
                    ${
                      isCritical
                        ? 'ud-critical-badge text-red-600 dark:text-red-400'
                        : 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    }
                  `}
                >
                  {isCritical ? <ShieldAlert className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
                    {isCritical ? 'Critical Update Required' : 'Update Available'}
                  </h2>
                  {isCritical && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:bg-red-950/60 dark:text-red-400">
                      <Zap className="h-2.5 w-2.5" /> Required
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {isCritical
                    ? 'This release contains essential security patches and critical stability fixes. Installation is required to continue.'
                    : 'A new version is ready with improvements and bug fixes. Review the changes below.'}
                </p>
              </div>

              {/* X button — snoozes (remind later) */}
              {!isCritical && (
                <button
                  onClick={onClose}
                  title="Remind me later"
                  className="ud-btn-ghost -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700"
                  aria-label="Remind me later"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

          {/* ── RELEASE NOTES ── */}
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center gap-2">
              <ScrollText className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                Release Notes
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/60">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-zinc-50 dark:from-zinc-900/60" />
              <div className="ud-scroll h-[240px] overflow-y-auto p-4 pb-6">
                {releaseNotes ? (
                  <Markdown options={markdownOptions}>{releaseNotes}</Markdown>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2.5 text-zinc-300 dark:text-zinc-700">
                    <AlertTriangle className="h-7 w-7" />
                    <p className="text-[13px] text-zinc-400 dark:text-zinc-500">No release notes for this version.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

          {/* ── FOOTER ── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            {/* Left side: skip option for non-critical */}
            <div className="flex items-center gap-1">
              {!isCritical ? (
                <>
                  <button
                    onClick={onSkip}
                    title="Don't remind me about this version"
                    className="ud-btn-ghost inline-flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-700"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    Skip this version
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 font-mono">⚠ mandatory</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* "Later" snoozes for 24 h */}
              {!isCritical && (
                <button
                  onClick={onClose}
                  className="ud-btn-ghost h-9 rounded-lg px-4 text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-700"
                >
                  Later
                </button>
              )}

              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`
                  ud-btn-primary h-9 rounded-lg px-5 text-[13px] font-semibold
                  inline-flex items-center gap-2
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    isCritical
                      ? 'bg-red-500 text-white hover:bg-red-500/90 focus-visible:ring-red-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 focus-visible:ring-zinc-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <span className={`ud-spinner ${!isCritical ? 'dark:ud-spinner-dark' : ''}`} />
                    {isCritical ? 'Installing…' : 'Downloading…'}
                  </>
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
        </div>
      </div>
    </>
  );
}
