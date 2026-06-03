'use client';

// import { any } from 'next/image';

const SANITY_CDN_HOSTNAME = 'cdn.sanity.io';

export default function sanityLoader({ src, width, quality }: any): string {
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    // console.error(`[sanityLoader] Invalid image URL: "${src}"`);
    return src;
  }

  if (url.hostname !== SANITY_CDN_HOSTNAME) {
    console.warn(`[sanityLoader] Unexpected hostname "${url.hostname}". Expected "${SANITY_CDN_HOSTNAME}".`);
    return src;
  }

  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  url.searchParams.set('w', width.toString());

  if (quality) {
    url.searchParams.set('q', quality.toString());
  }

  return url.href;
}
