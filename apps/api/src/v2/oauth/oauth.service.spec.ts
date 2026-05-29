import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as middleware from '@/lib/api/v2/middleware';

vi.mock('@/lib/api/v2/middleware', () => ({
  issueV2Token: vi.fn(),
}));

describe('OAuthService', () => {
  let service: OAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OAuthService],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueToken', () => {
    it('should throw BadRequestException for unsupported grant type', async () => {
      await expect(
        service.issueToken({ grant_type: 'password' }, 'application/json')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing client_id', async () => {
      await expect(
        service.issueToken({ grant_type: 'client_credentials', client_secret: 'sec' }, 'application/json')
      ).rejects.toThrow(BadRequestException);
    });

    it('should return token from issueV2Token on success', async () => {
      const mockResponse = { access_token: 'valid-token' };
      (middleware.issueV2Token as any).mockResolvedValue(mockResponse);

      const result = await service.issueToken(
        { grant_type: 'client_credentials', client_id: 'id', client_secret: 'sec' },
        'application/json'
      );

      expect(result).toEqual(mockResponse);
      expect(middleware.issueV2Token).toHaveBeenCalledWith('id', 'sec');
    });

    it('should throw UnauthorizedException if issueV2Token returns null', async () => {
      (middleware.issueV2Token as any).mockResolvedValue(null);

      await expect(
        service.issueToken(
          { grant_type: 'client_credentials', client_id: 'id', client_secret: 'sec' },
          'application/json'
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
