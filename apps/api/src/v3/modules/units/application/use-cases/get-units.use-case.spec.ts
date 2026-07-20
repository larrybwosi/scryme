import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { GetUnitsUseCase } from "./get-units.use-case";
import { SystemUnit, OrganizationUnit } from "../../domain/entities/unit.entity";
import { UnitType, IndustryCategory } from "@repo/db";

describe("GetUnitsUseCase", () => {
  let useCase: GetUnitsUseCase;
  let unitsRepository: any;

  beforeEach(async () => {
    unitsRepository = {
      findManySystemUnits: vi.fn(),
      findManyOrganizationUnits: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUnitsUseCase,
        {
          provide: "IUnitsRepository",
          useValue: unitsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUnitsUseCase>(GetUnitsUseCase);
  });

  it("should return system units and organization units on execute", async () => {
    const orgId = "org-1";
    const systemUnits = [
      new SystemUnit(
        "1",
        "Kilogram",
        "kg",
        UnitType.MASS,
        IndustryCategory.UNIVERSAL,
        true,
        true,
        true,
        new Date(),
        new Date(),
      ),
    ];
    const organizationUnits = [
      new OrganizationUnit(
        "2",
        orgId,
        "Custom Bag",
        "bag",
        UnitType.COUNT,
        IndustryCategory.FOOD_SERVICE,
        true,
        new Date(),
        new Date(),
      ),
    ];

    unitsRepository.findManySystemUnits.mockResolvedValue(systemUnits);
    unitsRepository.findManyOrganizationUnits.mockResolvedValue(organizationUnits);

    const result = await useCase.execute(orgId);

    expect(result.systemUnits).toEqual(systemUnits);
    expect(result.organizationUnits).toEqual(organizationUnits);
    expect(result.syncTimestamp).toBeDefined();
    expect(unitsRepository.findManySystemUnits).toHaveBeenCalledWith(undefined);
    expect(unitsRepository.findManyOrganizationUnits).toHaveBeenCalledWith(orgId, undefined);
  });

  it("should support delta synchronization with lastSync", async () => {
    const orgId = "org-1";
    const lastSync = "2026-07-20T00:00:00.000Z";
    const expectedLastSyncDate = new Date(lastSync);

    unitsRepository.findManySystemUnits.mockResolvedValue([]);
    unitsRepository.findManyOrganizationUnits.mockResolvedValue([]);

    await useCase.execute(orgId, lastSync);

    expect(unitsRepository.findManySystemUnits).toHaveBeenCalledWith(expectedLastSyncDate);
    expect(unitsRepository.findManyOrganizationUnits).toHaveBeenCalledWith(orgId, expectedLastSyncDate);
  });
});
