"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DialogAlign = "center" | "top" | "right";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  align?: DialogAlign;
  showCloseButton?: boolean;
  ariaLabel?: string;
}

const dialogStack: string[] = [];

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.offsetParent !== null ||
      element.getClientRects().length > 0 ||
      element === document.activeElement,
  );
}

function restoreFocus(element: HTMLElement | null) {
  if (typeof document === "undefined") return;

  if (element && document.contains(element)) {
    element.focus();
    return;
  }

  const fallback =
    document.querySelector<HTMLElement>("[data-route-heading]") ||
    document.querySelector<HTMLElement>("[data-command-trigger]");
  fallback?.focus();
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  align = "center",
  showCloseButton = true,
  ariaLabel,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    dialogStack.push(id);

    const panel = panelRef.current;
    const initial = panel ? focusableElements(panel)[0] : null;
    (initial || panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== id) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const focusable = focusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const index = dialogStack.lastIndexOf(id);
      if (index >= 0) dialogStack.splice(index, 1);
      restoreFocus(triggerRef.current);
    };
  }, [open, id]);

  const handleOverlayMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  if (!mounted || !open) return null;

  const alignment =
    align === "top"
      ? "items-start justify-center pt-[12vh]"
      : align === "right"
        ? "items-start justify-end pt-14 pr-4"
        : "items-center justify-center";

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex bg-surface-container-lowest/80 p-4 backdrop-blur-xs ${alignment}`}
      onMouseDown={handleOverlayMouseDown}
      data-dialog-overlay="true"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? `dialog-title-${id}` : undefined}
        aria-describedby={description ? `dialog-description-${id}` : undefined}
        tabIndex={-1}
        data-project-dialog="true"
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-md border border-outline-variant bg-surface-container-low shadow-2xl outline-none ${className || "max-w-lg"}`}
      >
        {(title || showCloseButton) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
            <div>
              {title && (
                <h2
                  id={`dialog-title-${id}`}
                  className="font-headline-sm text-headline-sm font-semibold text-on-surface"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={`dialog-description-${id}`}
                  className="mt-1 font-body-sm text-body-sm text-outline"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-outline-variant px-5 py-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
