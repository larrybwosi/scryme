"use client";

import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2, RotateCw } from "lucide-react";

export function PageLoading({
  variant = "list",
  label = "Loading",
  rows,
}: {
  variant?: "list" | "detail" | "grid";
  label?: string;
  rows?: number;
}) {
  if (variant === "detail") {
    return (
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6"
        role="status"
        aria-label={label}
      >
        <div className="h-4 w-48 animate-pulse rounded-sm bg-surface-container" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-3 rounded-md border border-outline-variant bg-surface-container-low p-5 xl:col-span-8">
            <div className="h-6 w-2/3 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-3 w-full animate-pulse rounded-sm bg-surface-container" />
            <div className="h-3 w-5/6 animate-pulse rounded-sm bg-surface-container" />
            <div className="mt-4 h-24 w-full animate-pulse rounded-sm bg-surface-container" />
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-outline-variant bg-surface-container-low p-5 xl:col-span-4">
            <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-8 w-full animate-pulse rounded-sm bg-surface-container" />
            <div className="h-8 w-full animate-pulse rounded-sm bg-surface-container" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
        role="status"
        aria-label={label}
      >
        {Array.from({ length: rows ?? 4 }, (_, index) => (
          <div
            key={index}
            className="flex h-44 animate-pulse flex-col justify-between rounded-md border border-outline-variant bg-surface-container-low p-4"
          >
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 rounded-sm bg-surface-container-high" />
              <div className="h-3 w-40 rounded-sm bg-surface-container" />
            </div>
            <div className="h-2 w-full rounded-sm bg-surface-container" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-low"
      role="status"
      aria-label={label}
    >
      <div className="border-b border-outline-variant bg-surface-container-high/40 px-4 py-3">
        <div className="h-3 w-32 animate-pulse rounded-sm bg-surface-container-highest" />
      </div>
      <div className="divide-y divide-outline-variant/40">
        {Array.from({ length: rows ?? 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 w-4 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-container" />
            <div className="h-3 flex-1 animate-pulse rounded-sm bg-surface-container" />
            <div className="h-5 w-20 animate-pulse rounded-sm bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-outline">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
      <p className="max-w-md font-body-sm text-body-sm text-outline">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function PageError({
  title = "Something went wrong",
  message,
  onRetry,
  backHref,
  backLabel = "Back to my tasks",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-error/30 bg-error/5 px-6 py-12 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-error/10 text-error">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
      <p className="max-w-md font-body-sm text-body-sm text-on-surface-variant">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary-container px-3 font-headline-sm text-body-sm text-on-primary-container transition-colors hover:bg-primary-container/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
            Try again
          </button>
        )}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex h-8 items-center rounded-sm border border-outline-variant px-3 font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 font-body-sm text-[11px] text-error">
      {message}
    </p>
  );
}

export function SavingBadge({ saving }: { saving: boolean }) {
  if (!saving) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-badge text-label-badge text-outline">
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      Saving
    </span>
  );
}
