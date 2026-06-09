import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthController } from './health.controller';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      client: {
        $queryRaw: vi.fn(),
      },
    };
    controller = new HealthController(prismaMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('getHealth', () => {
    it('should return healthy status when DB is connected', async () => {
      prismaMock.client.$queryRaw.mockResolvedValue([1]);
      const result = await controller.getHealth();
      expect(result.status).toBe('healthy');
    });

    it('should return raw error message when not in production', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const errorMessage = 'Connection refused';
      prismaMock.client.$queryRaw.mockRejectedValue(new Error(errorMessage));

      try {
        await controller.getHealth();
      } catch (error: any) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        expect(error.getResponse().error).toBe(errorMessage);
      }
    });

    it('should return masked error message when in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const errorMessage = 'Connection refused';
      prismaMock.client.$queryRaw.mockRejectedValue(new Error(errorMessage));

      try {
        await controller.getHealth();
      } catch (error: any) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        expect(error.getResponse().error).toBe('Internal server error');
      }
    });
  });

  describe('getEnhanced', () => {
    it('should return masked error message when in production and an unexpected error occurs', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      // Mock performance.now to return consistent values
      vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });

      // Force an unexpected error in getEnhanced by making checkDatabase throw something that isn't caught there
      // Wait, checkDatabase is private. I'll mock prisma.$queryRaw to throw, but getEnhanced catches it in a try-catch.
      // If dbCheck.status is 'unhealthy', getEnhanced throws ServiceUnavailableException(health).
      // The catch(error) block in getEnhanced will see this and "if (error instanceof ServiceUnavailableException) throw error;"

      // To reach the general catch block with process.env.NODE_ENV === 'production' masking:
      // I need checkDatabase or checkSystem to throw an Error that is NOT caught inside the inner try block.
      // But they are called inside the try block.

      // Let's mock checkSystem (it's private, but I can mock process.memoryUsage)
      vi.spyOn(process, 'memoryUsage').mockImplementation(() => {
        throw new Error('Unexpected memory error');
      });

      try {
        await controller.getEnhanced();
      } catch (error: any) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = error.getResponse();
        expect(response.error).toBe('Internal server error');
      }
    });
  });
});
