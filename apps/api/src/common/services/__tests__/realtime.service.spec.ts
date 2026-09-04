import { Test, TestingModule } from '@nestjs/testing';
import { ApiRealtimeService } from '../realtime.service';
import { RealtimeGateway } from '../../../v2/realtime/realtime.gateway';
import { V3RealtimeGateway } from '../../../v3/common/realtime/v3-realtime.gateway';
import { RealtimeRedisService } from '../../../v2/realtime/realtime-redis.service';
import { createDelta } from '@repo/shared/realtime';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/shared/realtime', () => ({
  createDelta: vi.fn(),
}));

describe('ApiRealtimeService', () => {
  let service: ApiRealtimeService;
  let v2Gateway: RealtimeGateway;
  let v3Gateway: V3RealtimeGateway;
  let redis: RealtimeRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiRealtimeService,
        {
          provide: RealtimeGateway,
          useValue: {
            server: {
              to: vi.fn().mockReturnThis(),
              emit: vi.fn(),
            },
          },
        },
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
    v2Gateway = module.get<RealtimeGateway>(RealtimeGateway);
    v3Gateway = module.get<V3RealtimeGateway>(V3RealtimeGateway);
    redis = module.get<RealtimeRedisService>(RealtimeRedisService);
  });

  it('should publish to Socket.io gateway', async () => {
    await service.publish('v2:test', 'test-event', { data: 123 });

    expect(redis.saveMessage).toHaveBeenCalledWith('v2:test', 'test-event', { data: 123 });
    expect(v2Gateway.server.to).toHaveBeenCalledWith('v2:test');
    expect(v2Gateway.server.emit).toHaveBeenCalledWith('test-event', { data: 123 });
  });

  it('should route v3 channels to v3Gateway in Socket.io', async () => {
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

    await service.publish('v2:test', 'update', newState, { delta: true });

    expect(redis.getLastState).toHaveBeenCalledWith('v2:test', 'update');
    expect(createDelta).toHaveBeenCalledWith(oldState, newState);
    expect(v2Gateway.server.emit).toHaveBeenCalledWith('update:delta', delta);
  });
});
