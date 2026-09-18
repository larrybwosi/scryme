/**
 * Sanitizes the API URL to ensure trailing slashes and legacy version paths are stripped
 */
export const sanitizeApiUrl = (url: string): string => {
  if (!url) return url;

  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  return trimmed.replace(/\/api\/(v2|v3)\/?$/, '').replace(/\/+$/, '');
};
