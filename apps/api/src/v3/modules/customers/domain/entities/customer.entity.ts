export class Customer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly organizationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly company: string | null = null,
    public readonly customerType: string | null = null,
    public readonly dateOfBirth: string | null = null,
    public readonly taxId: string | null = null,
  ) {}
}
