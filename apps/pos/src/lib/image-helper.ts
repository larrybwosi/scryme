import { getApiEndpoint } from './api-config';
import { isTauri, convertFileSrc } from '@tauri-apps/api/core';

function checkIsTauri(): boolean {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return true;
  }
  try {
    return typeof isTauri === 'function' ? isTauri() : false;
  } catch {
    return false;
  }
}

/**
 * Resolves a product or variant image URL for POS display.
 * Handles relative API paths, http/https, blob/data, asset/tauri protocols, and Tauri local files.
 */
export function getPOSImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '';

  const trimmed = imageUrl.trim();
  if (!trimmed) return '';

  // Data URLs, Blob URLs, absolute HTTP/HTTPS URLs, or custom Tauri protocol URLs
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('asset:') ||
    trimmed.startsWith('tauri:')
  ) {
    return trimmed;
  }

  // Local disk filesystem paths in Tauri desktop app (e.g. cached product images)
  const isWindowsPath = /^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith('\\\\');
  const isCachedImage = trimmed.includes('product_images');
  const isUnixAbsolutePath =
    trimmed.startsWith('/') &&
    !trimmed.startsWith('/uploads/') &&
    !trimmed.startsWith('/storage/') &&
    !trimmed.startsWith('/api/') &&
    !trimmed.startsWith('/static/') &&
    !trimmed.startsWith('/public/') &&
    !trimmed.startsWith('/assets/') &&
    !trimmed.startsWith('/media/');

  if (checkIsTauri() && (isWindowsPath || isCachedImage || isUnixAbsolutePath)) {
    try {
      return convertFileSrc(trimmed);
    } catch {
      // Fall back to API host path resolution if conversion fails
    }
  }

  // Relative storage / upload / API paths from backend
  const apiEndpoint = getApiEndpoint().replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : '/' + trimmed;

  return apiEndpoint + cleanPath;
}
