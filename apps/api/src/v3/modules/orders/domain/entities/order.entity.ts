export class Order {
  constructor(
    public readonly id: string,
    public readonly number: string,
    public readonly customerId: string | null,
    public status: string,
    public readonly totalAmount: number,
    public readonly organizationId: string,
    public readonly locationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly items: any[] = []
  ) {}
}
