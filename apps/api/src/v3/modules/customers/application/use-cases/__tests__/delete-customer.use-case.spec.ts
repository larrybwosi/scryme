import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeleteCustomerUseCase } from "../delete-customer.use-case";
import { NotFoundException } from "@nestjs/common";

describe("DeleteCustomerUseCase", () => {
  let useCase: DeleteCustomerUseCase;
  let mockPrisma: any;

  const mockOrgId = "org-123";
  const mockCustomerId = "customer-123";

  beforeEach(() => {
    mockPrisma = {
      client: {
        customer: {
          findFirst: vi.fn(),
          deleteMany: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    };

    useCase = new DeleteCustomerUseCase(mockPrisma as any);
  });

  it("should throw NotFoundException if customer does not exist or belongs to another organization", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(mockOrgId, mockCustomerId)).rejects.toThrow(
      NotFoundException,
    );

    expect(mockPrisma.client.customer.findFirst).toHaveBeenCalledWith({
      where: { id: mockCustomerId, organizationId: mockOrgId },
      select: { id: true },
    });
    expect(mockPrisma.client.customer.deleteMany).not.toHaveBeenCalled();
  });

  it("should successfully delete customer using deleteMany scoped to organizationId", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue({ id: mockCustomerId });
    mockPrisma.client.customer.deleteMany.mockResolvedValue({ count: 1 });

    const result = await useCase.execute(mockOrgId, mockCustomerId);

    expect(mockPrisma.client.customer.deleteMany).toHaveBeenCalledWith({
      where: { id: mockCustomerId, organizationId: mockOrgId },
    });
    expect(result).toEqual({
      success: true,
      message: "Customer deleted successfully",
    });
  });

  it("should fallback to updateMany (soft delete/deactivation) scoped to organizationId if hard delete fails", async () => {
    mockPrisma.client.customer.findFirst.mockResolvedValue({ id: mockCustomerId });
    mockPrisma.client.customer.deleteMany.mockRejectedValue(
      new Error("Foreign key constraint failed"),
    );
    mockPrisma.client.customer.updateMany.mockResolvedValue({ count: 1 });

    const result = await useCase.execute(mockOrgId, mockCustomerId);

    expect(mockPrisma.client.customer.updateMany).toHaveBeenCalledWith({
      where: { id: mockCustomerId, organizationId: mockOrgId },
      data: { isActive: false },
    });
    expect(result).toEqual({
      success: true,
      message: "Customer deactivated successfully",
    });
  });
});
