"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  Menu,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  User,
} from "lucide-react";
import { env } from "@repo/env";
import { getResolvedAuthUrl } from "@/lib/urls";
import { useSession, signOut } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/lib/hooks/use-projects";
import { useTimerStore } from "@/lib/timer-store";
import { NotificationPanel } from "@/components/NotificationPanel";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/CommandPalette";
import { FOCUS_RING } from "@/lib/navigation";

interface HeaderProps {
  collapsed: boolean;
  onOpenMenu: () => void;
}

export function Header({ collapsed, onOpenMenu }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { data: session } = useSession();
  const { data: workspace } = useWorkspaceContext();
  const { state: timerState, startTimer, pauseTimer } = useTimerStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Best effort sign out.
    }
    const authUrl = getResolvedAuthUrl(env.NEXT_PUBLIC_AUTH_URL, env.NODE_ENV);
    window.location.href = `${authUrl}/sign-in`;
  };

  const orgName =
    workspace?.orgName || workspace?.orgSlug || (workspace ? "Workspace" : "Scryme Workspace");
  const user = session?.user;

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header
      className={`fixed right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-outline-variant/60 bg-surface/90 px-space-md backdrop-blur-md transition-[left] duration-200 motion-reduce:transition-none ${
        collapsed ? "lg:left-14" : "lg:left-60"
      } left-0`}
    >
      <div className="flex min-w-0 items-center gap-space-md">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className={`flex h-8 w-8 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface lg:hidden ${FOCUS_RING}`}
        >
          <Menu className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 font-body-sm text-body-sm text-outline">
          <Link
            href="/projects"
            className={`max-w-40 truncate font-medium text-on-surface transition-colors hover:text-primary ${FOCUS_RING}`}
          >
            {orgName}
          </Link>
          <span className="text-outline-variant" aria-hidden>
            /
          </span>
          <Link
            href="/projects"
            className={`flex items-center gap-1.5 rounded-sm border border-outline-variant/60 bg-surface-container px-1.5 py-0.5 text-on-surface transition-colors hover:border-outline ${FOCUS_RING}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container" aria-hidden />
            <span className="font-medium text-body-sm">Projects Hub</span>
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          data-command-trigger="true"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          aria-label="Open command palette"
          title="Search pages and actions (Command K)"
          className={`hidden h-8 items-center gap-1.5 rounded-sm border border-outline-variant bg-surface-container-low px-2 font-body-sm text-body-sm text-outline transition-colors hover:border-outline hover:text-on-surface sm:flex ${FOCUS_RING}`}
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <kbd className="font-label-kbd text-label-kbd">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1.5 rounded-sm border border-outline-variant/60 bg-surface-container px-2 py-1">
          <Link
            href="/time-tracking"
            className={`flex items-center gap-1.5 transition-colors hover:text-primary ${FOCUS_RING}`}
            title={
              timerState.activeTaskTitle
                ? `Working on: ${timerState.activeTaskTitle}`
                : "Open Time Tracking"
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${isMounted && timerState.isRunning ? "animate-pulse bg-primary-container" : "bg-outline"}`}
              aria-hidden
            />
            <span className="font-label-code text-label-code text-primary">
              {isMounted ? formatTimer(timerState.elapsedSeconds) : "00:00:00"}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (timerState.isRunning) {
                pauseTimer();
              } else {
                startTimer();
              }
            }}
            title={timerState.isRunning ? "Pause timer" : "Resume timer"}
            aria-label={timerState.isRunning ? "Pause timer" : "Resume timer"}
            className={`ml-1 flex items-center text-outline transition-colors hover:text-on-surface ${FOCUS_RING}`}
          >
            {timerState.isRunning ? (
              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>

        <NotificationPanel />

        <Link
          href="/new?type=TASK"
          className={`flex h-8 items-center gap-1 rounded-sm bg-primary-container px-space-sm font-headline-sm text-body-sm text-on-primary-container shadow-sm transition-colors hover:bg-primary-container/90 ${FOCUS_RING}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">New Task</span>
          <kbd className="ml-1 hidden font-label-kbd text-label-kbd text-on-primary-container/70 md:inline">
            C
          </kbd>
        </Link>

        <div className="h-4 w-px bg-outline-variant/60" aria-hidden />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((value) => !value)}
            aria-label="Open user menu"
            aria-expanded={isProfileOpen}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-90 ${FOCUS_RING}`}
            title={user?.name || "User profile"}
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-on-primary" aria-hidden />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-outline-variant bg-surface-container-high py-1 shadow-xl">
              <div className="border-b border-outline-variant/60 px-3 py-2">
                <p className="truncate font-body-sm text-body-sm font-medium text-on-surface">
                  {user?.name || "Authenticated User"}
                </p>
                <p className="truncate text-[11px] text-outline">
                  {user?.email || "user@scryme.tech"}
                </p>
              </div>
              <Link
                href="/projects"
                onClick={() => setIsProfileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container ${FOCUS_RING}`}
              >
                <Search className="h-4 w-4 text-outline" aria-hidden />
                <span>Projects</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-body-sm text-body-sm text-error transition-colors hover:bg-surface-container ${FOCUS_RING}`}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
