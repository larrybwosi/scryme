"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  return (
    <header className="fixed top-0 left-60 right-0 h-12 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 z-40 flex items-center justify-between px-space-md">
      {/* Workspace Breadcrumb Context */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
          <Link href="/projects" className="hover:text-on-surface transition-colors cursor-pointer">
            Scryme
          </Link>
          <span className="text-outline-variant">/</span>
          <Link
            href="/projects/prj-204"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface hover:border-outline transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span className="font-medium text-body-sm text-on-surface">Nexus 2.0 Redesign</span>
            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
          </Link>
        </div>
      </div>

      {/* Right Action Rail */}
      <div className="flex items-center gap-space-md">
        {/* Live Active Timer Pill */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/40">
          <span
            className={`w-2 h-2 rounded-full ${isTimerRunning ? "bg-primary-container animate-pulse" : "bg-outline"}`}
          ></span>
          <span className="font-label-code text-label-code text-primary">01:42:15</span>
          <button
            className="text-outline hover:text-error transition-colors flex items-center"
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            title={isTimerRunning ? "Stop Timer" : "Start Timer"}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isTimerRunning ? "stop_circle" : "play_circle"}
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

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}
