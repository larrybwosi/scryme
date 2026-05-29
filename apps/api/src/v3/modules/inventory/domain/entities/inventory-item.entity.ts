export class InventoryItem {
  constructor(
    public readonly id: string,
    public readonly variantId: string,
    public readonly locationId: string,
    public readonly quantity: number,
    public readonly organizationId: string,
    public readonly lastUpdated: Date,
  ) {}
}
