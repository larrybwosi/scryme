import { tauriInvoke } from '@/lib/tauri-bridge';
import { isTauri } from '@/lib/sdk';

/**
 * Performs a "Factory Reset" of the bakery application.
 * This clears all local data, provisioned API keys, and reloads the app.
 */
export async function resetBakeryDevice() {
  try {
    // 1. Clear provisioned API key from system keyring if in Tauri
    if (isTauri()) {
      await tauriInvoke('clear_provisioned_api_key').catch((err) => {
        console.error('Failed to clear provisioned API key from keyring:', err);
      });
    }

    // 2. Clear all local storage
    localStorage.clear();

    // 3. Clear all session storage
    sessionStorage.clear();

    // 4. Force a full page reload to re-initialize the SDK and app state
    window.location.href = '/setup';
  } catch (error) {
    console.error('Error during device reset:', error);
    // Even if something fails, try to clear storage and redirect
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/setup';
  }
}
