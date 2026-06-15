import {describe, it, expect, beforeEach, vi} from "vitest";
import {UpdateCustomerUseCase} from "../update-customer.use-case";
import {PrismaService} from "@/prisma/prisma.service";

describe("UpdateCustomerUseCase", () => {
  let useCase: UpdateCustomerUseCase;
  let prisma: PrismaService;
  let customerRepository: any;

  beforeEach(() => {
    prisma = {
      client: {
        customer: {
          findFirst: vi.fn(),
          update: vi.fn(),
        },
      },
    } as any;

    useCase = new UpdateCustomerUseCase(prisma);
  });

  it("should update a customer successfully", async () => {
    const orgId = "org-123";
    const custId = "cust-123";
    const dto = {name: "John Updated"};

    vi.mocked(prisma.client.customer.findFirst).mockResolvedValue({
      id: custId,
      organizationId: orgId,
    } as any);
    vi.mocked(prisma.client.customer.update).mockResolvedValue({
      id: custId,
      name: "John Updated",
      email: "john@example.com",
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute(orgId, custId, dto);

    expect(result.name).toBe("John Updated");
    expect(prisma.client.customer.update).toHaveBeenCalledWith({
      where: {id: custId},
      data: expect.objectContaining({name: "John Updated"}),
    });
  });
});
