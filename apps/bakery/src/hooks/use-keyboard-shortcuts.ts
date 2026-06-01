'use client';

import { useEffect } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  [key: string]: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow escape even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Format key string: e.g., "ctrl+s", "alt+n", or just "n"
      let key = event.key.toLowerCase();
      if (event.shiftKey && key !== 'shift') key = 'shift+' + key;
      if (event.altKey && key !== 'alt') key = 'alt+' + key;
      if (event.ctrlKey && key !== 'control') key = 'ctrl+' + key;
      if (event.metaKey && key !== 'meta') key = 'meta+' + key;

      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key](event);
      } else if (shortcuts[event.key]) {
        // Fallback for exact key match if no modifier combo matched
        event.preventDefault();
        shortcuts[event.key](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
