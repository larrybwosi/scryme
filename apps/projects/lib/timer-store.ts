"use client";

import { useCallback, useEffect, useState } from "react";
import { reconcileTimerState, StoredTimerState } from "./metrics";

const STORAGE_KEY = "scryme_projects_timer_state_v1";

export type PersistedTimerState = StoredTimerState;

function defaultState(now: number = Date.now()): PersistedTimerState {
  return {
    isRunning: false,
    elapsedSeconds: 0,
    lastTickTimestamp: now,
    activeTaskId: "",
    activeTaskTitle: "",
    activeTaskKey: "",
    note: "",
  };
}

let memoryState: PersistedTimerState = defaultState();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch {
    // Storage unavailable or quota exceeded
  }
}

function adopt(next: PersistedTimerState) {
  memoryState = next;
  persist();
  notify();
}

export function getTimerState(): PersistedTimerState {
  return memoryState;
}

export function setTimerState(
  updater: Partial<PersistedTimerState> | ((prev: PersistedTimerState) => PersistedTimerState),
) {
  const next = typeof updater === "function" ? updater(memoryState) : { ...memoryState, ...updater };
  adopt(next);
}

function hydrateFromStoredValue(raw: string | null) {
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    adopt(reconcileTimerState(parsed, Date.now()));
  } catch {
    // A corrupt stored value falls back to a fresh timer.
  }
}

// Initialize from storage on client load and keep wall clock time authoritative.
if (typeof window !== "undefined") {
  try {
    hydrateFromStoredValue(localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage unavailable, keep the in memory default.
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      hydrateFromStoredValue(event.newValue);
    }
  });

  const recoverAfterBackground = () => {
    if (document.visibilityState === "visible" && memoryState.isRunning) {
      adopt(reconcileTimerState(memoryState, Date.now()));
    }
  };

  document.addEventListener("visibilitychange", recoverAfterBackground);
  window.addEventListener("focus", recoverAfterBackground);

  setInterval(() => {
    if (!memoryState.isRunning) return;
    adopt(reconcileTimerState(memoryState, Date.now()));
  }, 1000);
}

export function useTimerStore() {
  const [state, setState] = useState<PersistedTimerState>(memoryState);

  useEffect(() => {
    const handler = () => {
      setState({ ...memoryState });
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const startTimer = useCallback((task?: { id: string; title: string; taskKey?: string }) => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      lastTickTimestamp: Date.now(),
      activeTaskId: task?.id || prev.activeTaskId,
      activeTaskTitle: task?.title || prev.activeTaskTitle,
      activeTaskKey: task?.taskKey || prev.activeTaskKey,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState({ isRunning: false, lastTickTimestamp: Date.now() });
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      elapsedSeconds: 0,
      note: "",
      lastTickTimestamp: Date.now(),
    }));
  }, []);

  const setActiveTask = useCallback((task: { id: string; title: string; taskKey?: string }) => {
    setTimerState({
      activeTaskId: task.id,
      activeTaskTitle: task.title,
      activeTaskKey: task.taskKey || "",
    });
  }, []);

  const setNote = useCallback((note: string) => {
    setTimerState({ note });
  }, []);

  return {
    state,
    startTimer,
    pauseTimer,
    resetTimer,
    setActiveTask,
    setNote,
  };
}
