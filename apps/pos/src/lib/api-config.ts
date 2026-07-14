export const API_ENDPOINT_DEFAULT = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3002' : 'https://api.scryme.tech');

export const getApiEndpoint = () => {
  if (typeof window === 'undefined') return API_ENDPOINT_DEFAULT;
  try {
    const storage = localStorage.getItem('pos-auth-storage-v2');
    if (storage) {
      const parsed = JSON.parse(storage);
      return parsed.state?.apiUrl || API_ENDPOINT_DEFAULT;
    }
  } catch (e) {
    // Fallback if parsing fails
  }
  return API_ENDPOINT_DEFAULT;
};
