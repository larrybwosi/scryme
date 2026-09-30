import { getPOSImageUrl } from './image-helper';

const memoryImageCache = new Map<string, string>();

/**
 * Preloads and caches product images in memory for instant POS rendering.
 */
export async function cachePOSImage(url: string): Promise<string> {
  const resolvedUrl = getPOSImageUrl(url);
  if (!resolvedUrl) return '';

  if (memoryImageCache.has(resolvedUrl)) {
    return memoryImageCache.get(resolvedUrl)!;
  }

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) return resolvedUrl;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    memoryImageCache.set(resolvedUrl, objectUrl);
    return objectUrl;
  } catch {
    return resolvedUrl;
  }
}

/**
 * Returns cached image URL or resolved image URL.
 */
export function getCachedPOSImageUrl(url?: string | null): string {
  const resolvedUrl = getPOSImageUrl(url);
  if (!resolvedUrl) return '';
  return memoryImageCache.get(resolvedUrl) || resolvedUrl;
}
