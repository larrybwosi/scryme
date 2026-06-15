import {Test, TestingModule} from "@nestjs/testing";
import {BakeryController} from "../bakery.controller";
import {BakeryService} from "../bakery.service";
import {PrismaService} from "@/prisma/prisma.service";
import {V2ApiContext} from "@repo/shared/server";

describe("BakeryController", () => {
  let controller: BakeryController;
  let service: BakeryService;

  const mockBakeryService = {
    getBakeryOverview: vi.fn(),
    getIngredients: vi.fn(),
    getIngredientRecords: vi.fn(),
    getRecipes: vi.fn(),
    getRecipe: vi.fn(),
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    duplicateRecipe: vi.fn(),
    generateRecipeAi: vi.fn(),
    getBatches: vi.fn(),
    getBatch: vi.fn(),
    getBatchTraceability: vi.fn(),
    createBatch: vi.fn(),
    updateBatch: vi.fn(),
    deleteBatch: vi.fn(),
    startBatch: vi.fn(),
    completeBatch: vi.fn(),
    cancelBatch: vi.fn(),
    duplicateBatch: vi.fn(),
    getTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    duplicateTemplate: vi.fn(),
    createBatchFromTemplate: vi.fn(),
    getCategories: vi.fn(),
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getBakers: vi.fn(),
    addBaker: vi.fn(),
    updateBaker: vi.fn(),
    removeBaker: vi.fn(),
    getPartners: vi.fn(),
    createPartner: vi.fn(),
    getPartner: vi.fn(),
    updatePartner: vi.fn(),
    adjustPartnerWallet: vi.fn(),
    dispatchDelivery: vi.fn(),
    reconcileDelivery: vi.fn(),
    getActiveDeliveries: vi.fn(),
    receiveIngredients: vi.fn(),
  };

  const mockCtx: V2ApiContext = {
    organizationId: "org-1",
    memberId: "mem-1",
    locationId: "loc-1",
    permissions: [],
    authType: "device",
    scopes: [],
    correlationId: "test-id",
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
    requestStartTime: Date.now(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BakeryController],
      providers: [
        {provide: BakeryService, useValue: mockBakeryService},
        {provide: PrismaService, useValue: {}},
      ],
    }).compile();

    controller = module.get<BakeryController>(BakeryController);
    service = module.get<BakeryService>(BakeryService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getOverview", () => {
    it("should call service.getBakeryOverview", async () => {
      await controller.getOverview(mockCtx);
      expect(service.getBakeryOverview).toHaveBeenCalledWith(mockCtx);
    });
  });

  describe("createRecipe", () => {
    it("should call service.createRecipe", async () => {
      const data = {name: "New Recipe"};
      await controller.createRecipe(mockCtx, data);
      expect(service.createRecipe).toHaveBeenCalledWith(mockCtx, data);
    });
  });

  describe("dispatchDelivery", () => {
    it("should call service.dispatchDelivery", async () => {
      const data = {transactionId: "tx-1", partnerId: "p-1"};
      await controller.dispatchDelivery(mockCtx, data);
      expect(service.dispatchDelivery).toHaveBeenCalledWith(mockCtx, data);
    });
  });
});
