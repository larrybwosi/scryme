import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ICustomerRepository } from "../../domain/repositories/customer-repository.interface";
import { GetCustomersUseCase } from "./get-customers.use-case";
import { Customer } from "../../domain/entities/customer.entity";

describe("GetCustomersUseCase", () => {
  let useCase: GetCustomersUseCase;
  let customerRepository: ICustomerRepository;

  beforeEach(() => {
    customerRepository = {
      findByOrganization: vi.fn() as any,
      findById: vi.fn() as any,
      save: vi.fn() as any,
    };
    useCase = new GetCustomersUseCase(customerRepository);
  });

  it("should return customers for a given organization", async () => {
    const orgId = "org-1";
    const customers = [
      new Customer(
        "1",
        "Cust 1",
        "cust1@example.com",
        null,
        orgId,
        new Date(),
        new Date(),
      ),
    ];
    const paginatedResponse = {
      data: customers,
      total: 1,
      limit: 20,
      offset: 0,
    };
    (customerRepository.findByOrganization as any).mockResolvedValue(
      paginatedResponse,
    );

    const result = await useCase.execute(orgId, { limit: 20, offset: 0 });

    expect(result).toEqual(paginatedResponse);
    expect(customerRepository.findByOrganization).toHaveBeenCalledWith(orgId, {
      limit: 20,
      offset: 0,
    });
  });
});
