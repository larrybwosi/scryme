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
 * Handles relative API paths, http/https, blob/data URLs, and Tauri local files.
 */
export function getPOSImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '';

  const trimmed = imageUrl.trim();
  if (!trimmed) return '';

  // Data URLs, Blob URLs, or absolute HTTP/HTTPS URLs
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  const apiEndpoint = getApiEndpoint().replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : '/' + trimmed;

  // Relative storage / upload paths from backend API
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/') ||
    trimmed.startsWith('/api/') ||
    trimmed.startsWith('/storage/') ||
    trimmed.startsWith('storage/')
  ) {
    return apiEndpoint + cleanPath;
  }

  // Absolute local disk path in Tauri desktop app
  if (checkIsTauri()) {
    try {
      return convertFileSrc(trimmed);
    } catch {
      // Fallback
    }
  }

  // Fallback relative path against API host
  return apiEndpoint + cleanPath;
}
