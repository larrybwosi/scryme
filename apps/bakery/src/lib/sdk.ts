import { getSDK } from "@repo/sdk/src/index";
import { invoke } from "@tauri-apps/api/core";

// Check if running in Tauri
export const isTauri = () => {
  return (
    typeof window !== "undefined" &&
    ((window as any).__TAURI_INTERNALS__ !== undefined ||
      (window as any).__TAURI__ !== undefined)
  );
};

export const isOfflineMode = () => {
  return (
    typeof window !== "undefined" &&
    (localStorage.getItem("bakery_local_mode") === "true" ||
      !window.navigator.onLine)
  );
};

// Initialize SDK with proper baseURL and global error handler
const sdk = getSDK({
  baseURL: isTauri()
    ? localStorage.getItem("bakery_api_url") ||
      import.meta.env.VITE_API_URL ||
      "https://api.scryme.app/api/v2"
    : "/api/v2",
  onUnauthorized: () => {
    // Trigger a window event that the AuthGuard can listen to
    window.dispatchEvent(new CustomEvent("bakery-unauthorized"));
  },
});

// Load persistent member token if available
if (typeof window !== "undefined") {
  const memberToken = localStorage.getItem("bakery_member_token");
  if (memberToken) {
    sdk.setMemberToken(memberToken);
  }
}

// If in Tauri, attempt to load the provisioned API Key from keyring and settings
if (isTauri()) {
  // Load settings to check for custom API URL
  invoke<any>("get_settings", { organizationId: "local-org" })
    .then((settings) => {
      if (settings?.apiEndpointUrl) {
        localStorage.setItem("bakery_api_url", settings.apiEndpointUrl);
        if (sdk.client.getBaseURL() !== settings.apiEndpointUrl) {
          sdk.client.setBaseURL(settings.apiEndpointUrl);
        }
      }
    })
    .catch((err) => console.error("Failed to load settings for API URL", err));

  if (!isOfflineMode()) {
    invoke<string | null>("get_provisioned_api_key")
      .then((apiKey) => {
        if (apiKey) {
          sdk.setApiKey(apiKey);
        }
      })
      .catch((err) => {
        console.error("Failed to load provisioned API Key from keyring", err);
      });
  }
}

export default sdk;
