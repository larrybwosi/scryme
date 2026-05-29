import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { usePosStore } from '@/store/store';

interface ShortcutOptions {
  onOpenShortcuts?: () => void;
  onToggleSidebar?: () => void;
  onCheckout?: () => void;
  onHoldOrder?: () => void;
  onClearCart?: () => void;
  onFocusSearch?: () => void;
}

export function useShortcuts(options: ShortcutOptions = {}) {
  const navigate = useNavigate();
  const resetOrder = usePosStore(state => state.resetOrder);
  const currentOrder = usePosStore(state => state.currentOrder);

  // Use a ref for options to avoid listener churn
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // ? or F1: Help / Shortcuts
      if (e.key === '?' || e.key === 'F1') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        optionsRef.current.onOpenShortcuts?.();
      }

      // Ctrl/Cmd + Enter or Ctrl/Cmd + P: Checkout
      if (modifier && (e.key === 'Enter' || e.key === 'p')) {
        if (currentOrder.items.length > 0) {
          e.preventDefault();
          optionsRef.current.onCheckout?.();
        }
      }

      // Ctrl/Cmd + S: Hold Order
      if (modifier && e.key === 's') {
        if (currentOrder.items.length > 0) {
          e.preventDefault();
          optionsRef.current.onHoldOrder?.();
        }
      }

      // Ctrl/Cmd + Shift + C: Clear Cart
      if (modifier && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        resetOrder();
        optionsRef.current.onClearCart?.();
      }

      // /: Focus search
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        optionsRef.current.onFocusSearch?.();
      }

      // Ctrl/Cmd + B: Toggle Sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault();
        optionsRef.current.onToggleSidebar?.();
      }

      // Navigation Shortcuts
      if (modifier) {
        switch (e.key) {
          case 'h': // History
            e.preventDefault();
            navigate('/history');
            break;
          case 'i': // Inventory / POS
            e.preventDefault();
            navigate('/');
            break;
          case ',': // Settings
            e.preventDefault();
            navigate('/settings');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, resetOrder, currentOrder.items.length]); // Minimal dependencies
}
