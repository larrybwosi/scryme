import { Test, TestingModule } from '@nestjs/testing';
import { V3RealtimeGateway } from '../v3-realtime.gateway';
import { V3AuthService } from '../../../modules/auth/infrastructure/services/v3-auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RealtimeRedisService } from '../../../../v2/realtime/realtime-redis.service';
import { Socket } from 'socket.io';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('V3RealtimeGateway', () => {
  let gateway: V3RealtimeGateway;
  let redis: RealtimeRedisService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V3RealtimeGateway,
        {
          provide: V3AuthService,
          useValue: {
            verifyToken: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              transaction: {
                findUnique: vi.fn(),
              },
            },
          },
        },
        {
          provide: RealtimeRedisService,
          useValue: {
            saveMessage: vi.fn(),
            getHistory: vi.fn().mockResolvedValue([]),
            enterPresence: vi.fn(),
            leavePresence: vi.fn(),
            getPresence: vi.fn().mockResolvedValue([]),
            keys: vi.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    gateway = module.get<V3RealtimeGateway>(V3RealtimeGateway);
    redis = module.get<RealtimeRedisService>(RealtimeRedisService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway.server = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    } as any;
  });

  const mockContext = {
    organizationId: 'org-1',
    memberId: 'member-1',
  };

  it('should allow joining an authorized inventory channel', async () => {
    const client = {
      join: vi.fn(),
      v3Context: mockContext,
    } as any as Socket;

    const result = await gateway.handleJoinRoom(client, { channel: 'inventory:org-1' });

    expect(client.join).toHaveBeenCalledWith('inventory:org-1');
    expect(result).toEqual({ event: 'joined', data: 'inventory:org-1' });
  });

  it('should block joining an unauthorized inventory channel', async () => {
    const client = {
      join: vi.fn(),
      v3Context: mockContext,
    } as any as Socket;

    const result = await gateway.handleJoinRoom(client, { channel: 'inventory:org-2' });

    expect(client.join).not.toHaveBeenCalled();
    expect(result).toEqual({ event: 'error', message: 'Unauthorized' });
  });

  it('should allow publishing to an authorized order channel', async () => {
    const client = {
      v3Context: mockContext,
    } as any as Socket;

    vi.mocked(prisma.client.transaction.findUnique).mockResolvedValue({ organizationId: 'org-1' } as any);

    const data = { channel: 'order:order-1', event: 'status', data: { status: 'PAID' } };
    const result = await gateway.handlePublish(client, data);

    expect(redis.saveMessage).toHaveBeenCalledWith('order:order-1', 'status', { status: 'PAID' });
    expect(gateway.server.to).toHaveBeenCalledWith('order:order-1');
  });

  it('should block publishing to an unauthorized order channel', async () => {
    const client = {
      v3Context: mockContext,
    } as any as Socket;

    // Order belongs to org-2
    vi.mocked(prisma.client.transaction.findUnique).mockResolvedValue({ organizationId: 'org-2' } as any);

    const data = { channel: 'order:order-2', event: 'status', data: { status: 'PAID' } };
    const result = await gateway.handlePublish(client, data);

    expect(redis.saveMessage).not.toHaveBeenCalled();
    expect(result).toEqual({ event: 'error', message: 'Unauthorized' });
  });

  it('should block publishing to unknown channel patterns', async () => {
    const client = {
      v3Context: mockContext,
    } as any as Socket;

    const data = { channel: 'random-channel', event: 'exploit', data: {} };
    const result = await gateway.handlePublish(client, data);

    expect(redis.saveMessage).not.toHaveBeenCalled();
    expect(result).toEqual({ event: 'error', message: 'Unauthorized' });
  });
});
