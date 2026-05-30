import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from '../pos.controller';
import { PosService } from '../pos.service';
import { PosSaleService } from '../pos-sale.service';
import { V2ApiContext } from '@repo/shared/server';

describe('PosController', () => {
  let controller: PosController;
  let posSaleService: PosSaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        {
          provide: PosService,
          useValue: {},
        },
        {
          provide: PosSaleService,
          useValue: {
            handleSale: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
    posSaleService = module.get<PosSaleService>(PosSaleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processSale', () => {
    it('should call handleSale on PosSaleService', async () => {
      const mockCtx: any = { organizationId: 'org_1' };
      const mockBody = { cartItems: [] };

      vi.mocked(posSaleService.handleSale).mockResolvedValue({ success: true } as any);

      const result = await controller.processSale(mockCtx, mockBody, 'true');

      expect(result).toEqual({ success: true });
      expect(posSaleService.handleSale).toHaveBeenCalledWith(mockCtx, mockBody, true);
    });
  });
});
