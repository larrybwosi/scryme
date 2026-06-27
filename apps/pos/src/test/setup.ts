import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
// 1. Import Tauri v2's official testing mocks
import { mockWindows, clearMocks } from '@tauri-apps/api/mocks';

// 2. Initialize Tauri v2 Window (Replaces __TAURI_METADATA__)
mockWindows('main');

// 3. Initialize Tauri v2 IPC mock
// We use vi.mock for better integration with Vitest's mocking system
export const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
  convertFileSrc: vi.fn(path => path),
}));

// Provide a global mock implementation for specific commands if needed
mockInvoke.mockImplementation(async (cmd, _args) => {
  switch (cmd) {
    case 'get_system_printers':
      return [];
    case 'discover_network_printers':
      return [];
    case 'get_printer_config':
      return null;
    case 'get_device_config':
      return null;
    case 'get_unread_notification_count':
      return 0;
    case 'get_notification_history':
      return [];
    default:
      return undefined;
  }
});

// Prevent PostHog from attempting background IPC calls
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock matchMedia for UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock DOMMatrix for pdfjs-dist
global.DOMMatrix = class DOMMatrix {
  constructor() {}
  static fromFloat32Array() {
    return new DOMMatrix();
  }
  static fromFloat64Array() {
    return new DOMMatrix();
  }
} as any;

// Mock react-pdf since it fails in jsdom due to canvas requirements
vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => children,
  Page: () => null,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));

vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: any) => children,
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  StyleSheet: { create: (s: any) => s },
  Font: { register: vi.fn() },
  usePDF: () => [{ url: '' }, vi.fn()],
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  clearMocks(); // 4. Clear Tauri v2 mock state between tests
  vi.clearAllMocks();
});
