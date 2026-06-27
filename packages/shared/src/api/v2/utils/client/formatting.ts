// Client-safe formatting utilities
export const formatVariantDisplayName = (
  productName: string,
  variantName: string,
): string => {
  const lowerVariantName = variantName.toLowerCase().trim();

  if (
    lowerVariantName === "default" ||
    lowerVariantName === "default variant"
  ) {
    return productName;
  }

  return `${productName} - ${variantName}`;
};
