import { StateStorage } from 'zustand/middleware';
import { LazyStore } from '@tauri-apps/plugin-store';

// 1. Initialize the store instance
// This creates a file named 'scanner-config.json' in the AppData directory
const tauriStore = new LazyStore('scanner-config.json');

// 2. Create the adapter
export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Zustand stores values as strings (even objects are stringified)
    // We try to get the item from the store
    const value = await tauriStore.get<string>(name);
    return value || null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Set the value
    await tauriStore.set(name, value);
    // Important: You must manually save to disk!
    await tauriStore.save();
  },

  removeItem: async (name: string): Promise<void> => {
    await tauriStore.delete(name);
    await tauriStore.save();
  },
};
