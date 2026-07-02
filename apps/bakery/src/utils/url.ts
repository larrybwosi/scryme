/**
 * Sanitizes the API URL to ensure it contains /api/v2
 */
export const sanitizeApiUrl = (url: string): string => {
  if (!url) return url;

  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // If it already contains /api/v2, just trim trailing slashes
  if (trimmed.includes('/api/v2')) {
    return trimmed.replace(/\/+$/, '');
  }

  // Otherwise, append /api/v2 to the base URL (after trimming trailing slashes)
  return `${trimmed.replace(/\/+$/, '')}/api/v2`;
};
