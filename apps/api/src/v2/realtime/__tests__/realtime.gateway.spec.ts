import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway } from '../realtime.gateway';
import { RealtimeRedisService } from '../realtime-redis.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Socket } from 'socket.io';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let redis: RealtimeRedisService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: PrismaService,
          useValue: {
            client: {
              inventoryLocation: {
                findFirst: vi.fn(),
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

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    redis = module.get<RealtimeRedisService>(RealtimeRedisService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway.server = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    } as any;
  });

  it('should handle join room', async () => {
    const client = {
      join: vi.fn(),
      emit: vi.fn(),
      id: 'client-1',
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;

    const result = await gateway.handleJoinRoom(client, { channel: 'organization:org-1:events' });

    expect(client.join).toHaveBeenCalledWith('organization:org-1:events');
    expect(result).toEqual({ event: 'joined', data: 'organization:org-1:events' });
  });

  it('should handle join room with rewind', async () => {
    const history = [
      { event: 'msg', data: { id: 1 } },
      { event: 'msg', data: { id: 2 } },
    ];
    vi.mocked(redis.getHistory).mockResolvedValue(history);

    const client = {
      join: vi.fn(),
      emit: vi.fn(),
      id: 'client-1',
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;

    await gateway.handleJoinRoom(client, { channel: 'organization:org-1:events', options: { rewind: 1 } });

    expect(client.emit).toHaveBeenCalledWith('msg', { id: 2 });
    expect(client.emit).not.toHaveBeenCalledWith('msg', { id: 1 });
  });

  it('should handle presence enter', async () => {
    const client = {
      id: 'client-1',
      handshake: { auth: {} },
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;
    const members = [{ clientId: 'client-1', timestamp: Date.now() }];
    vi.mocked(redis.getPresence).mockResolvedValue(members);

    const result = await gateway.handlePresenceEnter(client, { channel: 'organization:org-1:events', metadata: { name: 'Jules' } });

    expect(redis.enterPresence).toHaveBeenCalledWith('organization:org-1:events', 'client-1', { name: 'Jules' });
    expect(gateway.server.to).toHaveBeenCalledWith('organization:org-1:events');
    expect(gateway.server.emit).toHaveBeenCalledWith('presence:update', { channel: 'organization:org-1:events', members });
    expect(result).toEqual({ event: 'presence:entered', members });
  });

  it('should handle publish', async () => {
    const client = {
      id: 'client-1',
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;
    const data = { channel: 'organization:org-1:events', event: 'test-event', data: { foo: 'bar' } };

    await gateway.handlePublish(client, data);

    expect(redis.saveMessage).toHaveBeenCalledWith('organization:org-1:events', 'test-event', { foo: 'bar' });
    expect(gateway.server.to).toHaveBeenCalledWith('organization:org-1:events');
    expect(gateway.server.emit).toHaveBeenCalledWith('test-event', { foo: 'bar' });
  });

  it('should allow access to pos channel if location belongs to org', async () => {
    const client = {
      join: vi.fn(),
      id: 'client-1',
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;

    vi.mocked(prisma.client.inventoryLocation.findFirst).mockResolvedValue({ id: 'loc-1' } as any);

    const result = await gateway.handleJoinRoom(client, { channel: 'pos:loc-1:sales' });

    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { id: 'loc-1', organizationId: 'org-1' },
      select: { id: true },
    });
    expect(client.join).toHaveBeenCalledWith('pos:loc-1:sales');
    expect(result).toEqual({ event: 'joined', data: 'pos:loc-1:sales' });
  });

  it('should deny access to pos channel if location does not belong to org', async () => {
    const client = {
      join: vi.fn(),
      id: 'client-1',
      v2Context: { organizationId: 'org-1' },
    } as any as Socket;

    vi.mocked(prisma.client.inventoryLocation.findFirst).mockResolvedValue(null);

    const result = await gateway.handleJoinRoom(client, { channel: 'pos:loc-2:sales' });

    expect(client.join).not.toHaveBeenCalled();
    expect(result).toEqual({ event: 'error', message: 'Unauthorized' });
  });
});
