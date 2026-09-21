export const API_ENDPOINT_DEFAULT =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3002' : 'https://api.scryme.tech');

export const getApiEndpoint = () => {
  if (typeof window === 'undefined') return API_ENDPOINT_DEFAULT;
  try {
    const customUrl = localStorage.getItem('bakery_api_url');
    if (customUrl) return customUrl;
  } catch (e) {
    // Fallback if localStorage access fails
  }
  return API_ENDPOINT_DEFAULT;
};
