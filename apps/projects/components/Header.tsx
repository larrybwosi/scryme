"use client";

import Link from "next/link";
import { useState } from "react";
import { env } from "@repo/env";
import { useSession, signOut } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/lib/hooks/use-projects";
import { useTimerStore } from "@/lib/timer-store";

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session } = useSession();
  const { data: workspace } = useWorkspaceContext();
  const { state: timerState, startTimer, pauseTimer } = useTimerStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Fallback
    }
    const isDev = env.NODE_ENV === "development";
    const defaultAuthUrl = isDev ? "http://localhost:4444" : "https://auth.scryme.tech";
    const authUrl = env.NEXT_PUBLIC_AUTH_URL || defaultAuthUrl;
    window.location.href = `${authUrl}/sign-in`;
  };

  const orgName = workspace?.orgName || session?.session?.activeOrganizationName || "Scryme Workspace";
  const user = session?.user;

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="fixed top-0 left-60 right-0 h-12 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 z-40 flex items-center justify-between px-space-md">
      {/* Workspace Breadcrumb Context */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
          <Link href="/projects" className="hover:text-on-surface transition-colors cursor-pointer font-medium text-on-surface">
            {orgName}
          </Link>
          <span className="text-outline-variant">/</span>
          <Link
            href="/projects"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface hover:border-outline transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span className="font-medium text-body-sm text-on-surface">Projects Hub</span>
            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
          </Link>
        </div>
      </div>

      {/* Right Action Rail */}
      <div className="flex items-center gap-space-md">
        {/* Live Active Timer Pill */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/40">
          <Link
            href="/time-tracking"
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
            title={timerState.activeTaskTitle ? `Working on: ${timerState.activeTaskTitle}` : "Open Time Tracking"}
          >
            <span
              className={`w-2 h-2 rounded-full ${timerState.isRunning ? "bg-primary-container animate-pulse" : "bg-outline"}`}
            ></span>
            <span className="font-label-code text-label-code text-primary">
              {formatTimer(timerState.elapsedSeconds)}
            </span>
          </Link>
          <button
            className="text-outline hover:text-error transition-colors flex items-center cursor-pointer ml-1"
            type="button"
            onClick={() => {
              if (timerState.isRunning) {
                pauseTimer();
              } else {
                startTimer();
              }
            }}
            title={timerState.isRunning ? "Pause Timer" : "Resume Timer"}
          >
            <span className="material-symbols-outlined text-[14px]">
              {timerState.isRunning ? "pause_circle" : "play_circle"}
            </span>
          </button>
        </div>

        {/* Notifications Button */}
        <button
          className="relative p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          type="button"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-container rounded-full"></span>
        </button>

        {/* Quick New Task Action */}
        <Link
          href="/new"
          className="h-7 px-space-sm bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg text-body-sm font-headline-sm flex items-center gap-1 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Task</span>
          <span className="font-label-kbd text-label-kbd text-on-primary-container/70 ml-1">C</span>
        </Link>

        <div className="h-4 w-px bg-outline-variant/40"></div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none"
            title={user?.name || "User profile"}
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name || "User"} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-surface-container-high border border-outline-variant/40 shadow-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-outline-variant/30">
                <p className="text-body-sm font-medium text-on-surface truncate">{user?.name || "Authenticated User"}</p>
                <p className="text-[11px] text-outline truncate">{user?.email || "user@scryme.tech"}</p>
              </div>
              <Link
                href="/team"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-outline">group</span>
                <span>Team & Squad</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-error hover:bg-surface-container transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
