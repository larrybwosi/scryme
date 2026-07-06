import { getPortalSDK } from "./portal-sdk";

export async function getB2BProducts(orgSlug: string, query?: string) {
  const sdk = await getPortalSDK();
  const response = await sdk.b2b.getCatalog(orgSlug);

  const products = response || [];

  if (query) {
    const q = query.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  return products;
}
