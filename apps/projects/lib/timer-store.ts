"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "scryme_projects_timer_state_v1";

export interface PersistedTimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  lastTickTimestamp: number;
  activeTaskId: string;
  activeTaskTitle: string;
  activeTaskKey: string;
  note: string;
}

const defaultState: PersistedTimerState = {
  isRunning: false,
  elapsedSeconds: 0,
  lastTickTimestamp: Date.now(),
  activeTaskId: "",
  activeTaskTitle: "",
  activeTaskKey: "",
  note: "",
};

let memoryState: PersistedTimerState = { ...defaultState };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getTimerState(): PersistedTimerState {
  return memoryState;
}

export function setTimerState(updater: Partial<PersistedTimerState> | ((prev: PersistedTimerState) => PersistedTimerState)) {
  const next = typeof updater === "function" ? updater(memoryState) : { ...memoryState, ...updater };
  memoryState = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
  notify();
}

// Initialize from storage on client load
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        let elapsed = Number(parsed.elapsedSeconds) || 0;
        if (parsed.isRunning && parsed.lastTickTimestamp) {
          const deltaSec = Math.floor((Date.now() - parsed.lastTickTimestamp) / 1000);
          if (deltaSec > 0) {
            elapsed += deltaSec;
          }
        }
        memoryState = {
          ...defaultState,
          ...parsed,
          elapsedSeconds: elapsed,
          lastTickTimestamp: Date.now(),
        };
      }
    }
  } catch {
    // Fallback to default
  }

  // Cross-tab sync via storage events
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        memoryState = JSON.parse(e.newValue);
        notify();
      } catch {
        // Ignored
      }
    }
  });

  // Global tick timer
  setInterval(() => {
    if (memoryState.isRunning) {
      memoryState.elapsedSeconds += 1;
      memoryState.lastTickTimestamp = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      } catch {
        // Ignored
      }
      notify();
    }
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
    setTimerState({ isRunning: false, elapsedSeconds: 0, note: "", lastTickTimestamp: Date.now() });
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
