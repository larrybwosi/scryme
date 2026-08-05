export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly organizationId: string,
    public readonly categoryId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly sku?: string,
    public readonly slug?: string | null,
    public readonly imageUrls?: string[],
    public readonly category?: { id: string; name: string },
    public readonly variants?: Array<{
      id: string;
      name: string;
      sku: string;
      retailPrice: number | null;
    }>,
    public readonly customFields?: any,
  ) {}
}
