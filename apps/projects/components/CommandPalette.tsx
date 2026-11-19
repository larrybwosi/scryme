"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ArrowRight,
  Command as CommandIcon,
  CornerDownLeft,
  Search,
} from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { CREATE_COMMANDS, NAV_GROUPS } from "@/lib/navigation";

export const OPEN_COMMAND_PALETTE_EVENT = "scryme:open-command-palette";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, button, a[href], summary, [contenteditable='true'], [contenteditable=''], [role='textbox'], [role='button'], [role='link'], [role='menuitem']",
    ),
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openPalette = () => setOpen(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      const withCommandModifier = event.metaKey || event.ctrlKey;

      if (withCommandModifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          setOpen(false);
          return;
        }
        if (document.querySelector("[data-project-dialog='true'], [data-drawer-open='true']")) {
          return;
        }
        setOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;
      if (open) return;
      if (document.querySelector("[data-project-dialog='true'], [data-drawer-open='true']")) return;

      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        router.push("/new?type=TASK");
      } else if (key === "p") {
        event.preventDefault();
        router.push("/new?type=PROJECT");
      }
    };

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, router]);

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      align="top"
      className="max-w-[640px]"
      showCloseButton={false}
      ariaLabel="Command palette"
    >
      <Command
        shouldFilter
        loop
        className="flex flex-col bg-surface-container-low text-on-surface"
      >
        <div className="flex items-center gap-2 border-b border-outline-variant px-4">
          <Search className="h-4 w-4 shrink-0 text-outline" aria-hidden />
          <Command.Input
            autoFocus
            placeholder="Search pages and actions"
            className="h-11 w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          />
          <kbd className="rounded-sm border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-kbd text-label-kbd text-outline">
            Esc
          </kbd>
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center font-body-sm text-body-sm text-outline">
            No matches
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-label-badge [&_[cmdk-group-heading]]:text-label-badge [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-outline"
          >
            {CREATE_COMMANDS.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.href}
                  value={`${item.command} ${item.label}`}
                  onSelect={() => runCommand(item.href)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 font-body-sm text-body-sm text-on-surface-variant data-[selected=true]:bg-surface-container data-[selected=true]:text-on-surface"
                >
                  <Icon className="h-4 w-4 text-outline" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  <kbd className="rounded-sm border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-kbd text-label-kbd text-outline">
                    {item.shortcut}
                  </kbd>
                </Command.Item>
              );
            })}
          </Command.Group>

          {NAV_GROUPS.map((group) => (
            <Command.Group
              key={group.id}
              heading={group.title}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-label-badge [&_[cmdk-group-heading]]:text-label-badge [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-outline"
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={`${item.command} ${item.label}`}
                    onSelect={() => runCommand(item.href)}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 font-body-sm text-body-sm text-on-surface-variant data-[selected=true]:bg-surface-container data-[selected=true]:text-on-surface"
                  >
                    <Icon className="h-4 w-4 text-outline" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-outline" aria-hidden />
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>

        <div className="flex items-center justify-between border-t border-outline-variant px-4 py-2 font-label-kbd text-label-kbd text-outline">
          <span className="flex items-center gap-1.5">
            <CommandIcon className="h-3.5 w-3.5" aria-hidden />
            Command K
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
            Open
          </span>
        </div>
      </Command>
    </Dialog>
  );
}
