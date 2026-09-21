export function sanitizeApiUrl(url: string | null | undefined): string {
  if (!url) {
    return 'https://api.scryme.tech';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://api.scryme.tech';
  }

  return trimmed.replace(/\/api\/v3\/?$/, '').replace(/\/+$/, '');
}
