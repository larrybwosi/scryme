export const API_ENDPOINT_DEFAULT = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3002' : 'https://dealioerp.vercel.app');

// Using a getter to ensure we always get the latest value from the store if possible
// but for static imports, we need a consistent way to handle this.
export const API_ENDPOINT = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('pos-auth-storage-v3') || '{}').state?.apiUrl || API_ENDPOINT_DEFAULT) : API_ENDPOINT_DEFAULT;
