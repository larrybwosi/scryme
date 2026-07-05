import { getSDK } from '@repo/sdk';
import { invoke } from '@tauri-apps/api/core';
import { sanitizeApiUrl } from '@/utils/url';
import { tauriInvoke } from './tauri-bridge';


// Check if running in Tauri
export const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined)
  );
};

export const isOfflineMode = () => {
  return typeof window !== 'undefined' && (localStorage.getItem('bakery_local_mode') === 'true' || !window.navigator.onLine);
};

// Initialize SDK with proper baseURL and global error handler
const sdk = getSDK({
  baseURL: isTauri()
    ? sanitizeApiUrl(
        (typeof window !== 'undefined' ? localStorage.getItem('bakery_api_url') : null) ||
          import.meta.env.VITE_API_URL ||
          'https://api.scryme.app/api/v2'
      )
    : '/api/v2',
  onUnauthorized: () => {
    // Trigger a window event that the AuthGuard can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bakery-unauthorized'));
    }
  },
});

// If in Tauri, override the client methods to use the Rust backend proxy
if (isTauri()) {
  const originalClient = { ...sdk.client };

  sdk.client.get = async <T = any>(url: string, config?: any) => {
    // If it's a full URL or we're not using the proxy for some reason, fallback
    if (url.startsWith('http') || config?.useProxy === false) {
      return originalClient.get(url, config);
    }

    // Convert params to query string if present
    let path = url;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        path += (path.includes('?') ? '&' : '?') + qs;
      }
    }

    return tauriInvoke<T>('authenticated_api_request', {
      method: 'GET',
      path,
    });
  };

  sdk.client.post = async <T = any>(url: string, data?: any, config?: any) => {
    if (url.startsWith('http') || config?.useProxy === false) {
      return originalClient.post(url, data, config);
    }
    return tauriInvoke<T>('authenticated_api_request', {
      method: 'POST',
      path: url,
      body: data,
    });
  };

  sdk.client.put = async <T = any>(url: string, data?: any, config?: any) => {
    if (url.startsWith('http') || config?.useProxy === false) {
      return originalClient.put(url, data, config);
    }
    return tauriInvoke<T>('authenticated_api_request', {
      method: 'PUT',
      path: url,
      body: data,
    });
  };

  sdk.client.patch = async <T = any>(url: string, data?: any, config?: any) => {
    if (url.startsWith('http') || config?.useProxy === false) {
      return originalClient.patch(url, data, config);
    }
    return tauriInvoke<T>('authenticated_api_request', {
      method: 'PATCH',
      path: url,
      body: data,
    });
  };

  sdk.client.delete = async <T = any>(url: string, config?: any) => {
    if (url.startsWith('http') || config?.useProxy === false) {
      return originalClient.delete(url, config);
    }
    return tauriInvoke<T>('authenticated_api_request', {
      method: 'DELETE',
      path: url,
    });
  };
}

console.log(
  "SDK initialized with baseURL:",
  localStorage.getItem("bakery_api_url"),
);


// Load persistent member token if available
if (typeof window !== 'undefined' && !isTauri()) {
  const memberToken = localStorage.getItem('bakery_member_token');
  if (memberToken) {
    sdk.setMemberToken(memberToken);
  }
}

// If in Tauri, attempt to load the provisioned API Key from keyring and settings
if (isTauri()) {
  // Sync member token to Rust if it's in localStorage (for migration/persistence)
  const memberToken = localStorage.getItem('bakery_member_token');
  const memberId = localStorage.getItem('bakery_member_id');
  const savedUser = localStorage.getItem('bakery_user');

  if (memberToken && memberId) {
    tauriInvoke('sync_member_token_command', { token: memberToken, memberId }).catch(console.error);
    if (savedUser) {
      try {
        tauriInvoke('restore_member_session', { member: JSON.parse(savedUser) }).catch(console.error);
      } catch (e) {
        console.error('Failed to restore member session', e);
      }
    }
  }

  // Load settings to check for custom API URL
  invoke<any>('get_settings', { organizationId: 'local-org' })
    .then((settings) => {
      if (settings?.apiEndpointUrl) {
        const sanitizedUrl = sanitizeApiUrl(settings.apiEndpointUrl);
        localStorage.setItem('bakery_api_url', sanitizedUrl);
        if (sdk.client.getBaseURL() !== sanitizedUrl) {
           sdk.client.setBaseURL(sanitizedUrl);
        }
        // Update Rust backend too
        tauriInvoke('update_bakery_api_url', { apiUrl: sanitizedUrl }).catch(console.error);
      }
    })
    .catch(err => console.error('Failed to load settings for API URL', err));

  if (!isOfflineMode()) {
    invoke<any>('get_device_config')
    .then((config) => {
      if (config?.deviceKey) {
        sdk.setApiKey(config.deviceKey);
      } else {
        // Fallback to old method if needed
        return invoke<string | null>('get_provisioned_api_key');
      }
    })
    .then((apiKey) => {
      if (typeof apiKey === 'string') {
        sdk.setApiKey(apiKey);
      }
    })
    .catch((err) => {
      console.error('Failed to load provisioned API Key', err);
    });
  }
}

export default sdk;
