import { Test, TestingModule } from '@nestjs/testing';
import { ApiRealtimeService } from '../realtime.service';
import { V3RealtimeGateway } from '../../../v3/common/realtime/v3-realtime.gateway';
import { RealtimeRedisService } from '../../../v3/common/realtime/realtime-redis.service';
import { createDelta } from '@repo/shared/realtime';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/shared/realtime', () => ({
  createDelta: vi.fn(),
}));

describe('ApiRealtimeService', () => {
  let service: ApiRealtimeService;
  let v3Gateway: V3RealtimeGateway;
  let redis: RealtimeRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiRealtimeService,
        {
          provide: V3RealtimeGateway,
          useValue: {
            server: {
              to: vi.fn().mockReturnThis(),
              emit: vi.fn(),
            },
          },
        },
        {
          provide: RealtimeRedisService,
          useValue: {
            saveMessage: vi.fn().mockResolvedValue(undefined),
            getLastState: vi.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<ApiRealtimeService>(ApiRealtimeService);
    v3Gateway = module.get<V3RealtimeGateway>(V3RealtimeGateway);
    redis = module.get<RealtimeRedisService>(RealtimeRedisService);
  });

  it('should publish to v3 Socket.io gateway', async () => {
    await service.publish('organization:org1:inventory', 'stock-update', { data: 123 });

    expect(redis.saveMessage).toHaveBeenCalledWith('organization:org1:inventory', 'stock-update', { data: 123 });
    expect(v3Gateway.server.to).toHaveBeenCalledWith('organization:org1:inventory');
    expect(v3Gateway.server.emit).toHaveBeenCalledWith('stock-update', { data: 123 });
  });

  it('should route channels cleanly to v3 gateway', async () => {
    await service.publish('v3:orders', 'test-event', { data: 123 });

    expect(v3Gateway.server.to).toHaveBeenCalledWith('v3:orders');
    expect(v3Gateway.server.emit).toHaveBeenCalledWith('test-event', { data: 123 });
  });

  it('should handle deltas when requested in Socket.io', async () => {
    const oldState = { count: 1 };
    const newState = { count: 2 };
    const delta = { count: 2 };

    vi.mocked(redis.getLastState).mockResolvedValue(oldState);
    vi.mocked(createDelta).mockReturnValue(delta);

    await service.publish('test-channel', 'update', newState, { delta: true });

    expect(redis.getLastState).toHaveBeenCalledWith('test-channel', 'update');
    expect(createDelta).toHaveBeenCalledWith(oldState, newState);
    expect(v3Gateway.server.emit).toHaveBeenCalledWith('update:delta', delta);
  });
});
