export const formatVariantDisplayName = (
  productName: string,
  variantName: string,
): string => {
  const lowerVariantName = variantName.toLowerCase().trim();

  // Check if variant name is "default" or "default variant"
  if (
    lowerVariantName === "default" ||
    lowerVariantName === "default variant"
  ) {
    return productName;
  }

  // Otherwise use "Product Name - Variant Name" format
  return `${productName} - ${variantName}`;
};
