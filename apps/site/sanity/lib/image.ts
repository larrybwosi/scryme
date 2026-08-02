import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: any) => {
  const createMockBuilder = (urlStr: string): any => {
    const builderObj: any = {
      url: () => urlStr,
    };
    // Make it chainable for common methods
    const methods = ['width', 'height', 'format', 'fit', 'quality', 'auto', 'blur'];
    for (const m of methods) {
      builderObj[m] = () => builderObj;
    }
    return builderObj;
  };

  if (!source) {
    return createMockBuilder("https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&fm=webp");
  }

  // If source is a direct URL string
  if (typeof source === 'string') {
    let optimizedUrl = source;
    if (source.includes('unsplash.com') && !source.includes('fm=')) {
      optimizedUrl = source.includes('?') ? `${source}&fm=webp` : `${source}?fm=webp`;
    }
    return createMockBuilder(optimizedUrl);
  }

  // If source has a direct url property
  if (source && typeof source === 'object' && 'url' in source && source.url) {
    let optimizedUrl = source.url;
    if (source.url.includes('unsplash.com') && !source.url.includes('fm=')) {
      optimizedUrl = source.url.includes('?') ? `${source.url}&fm=webp` : `${source.url}?fm=webp`;
    }
    return createMockBuilder(optimizedUrl);
  }

  // Standard builder behavior
  try {
    return builder.image(source).format('webp')
  } catch (err) {
    return createMockBuilder("https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&fm=webp");
  }
}
