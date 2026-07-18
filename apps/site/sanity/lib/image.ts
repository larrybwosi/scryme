import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: any) => {
  if (!source) {
    const fallback = "https://images.unsplash.com/photo-1551434678-e076c223a692";
    return {
      width: () => ({ height: () => ({ url: () => fallback }), url: () => fallback }),
      height: () => ({ width: () => ({ url: () => fallback }), url: () => fallback }),
      url: () => fallback,
    };
  }

  // If source is a direct URL string
  if (typeof source === 'string') {
    return {
      width: () => ({ height: () => ({ url: () => source }), url: () => source }),
      height: () => ({ width: () => ({ url: () => source }), url: () => source }),
      url: () => source,
    };
  }

  // If source has a direct url property
  if (source && typeof source === 'object' && 'url' in source && source.url) {
    return {
      width: () => ({ height: () => ({ url: () => source.url }), url: () => source.url }),
      height: () => ({ width: () => ({ url: () => source.url }), url: () => source.url }),
      url: () => source.url,
    };
  }

  // Standard builder behavior
  try {
    return builder.image(source)
  } catch (err) {
    const fallback = "https://images.unsplash.com/photo-1551434678-e076c223a692";
    return {
      width: () => ({ height: () => ({ url: () => fallback }), url: () => fallback }),
      height: () => ({ width: () => ({ url: () => fallback }), url: () => fallback }),
      url: () => fallback,
    };
  }
}
