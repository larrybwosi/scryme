import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeService } from '../realtime.service';
import { SocketIORealtimeProvider } from '../socketio.provider';

vi.mock('../socketio.provider', () => {
  return {
    SocketIORealtimeProvider: vi.fn().mockImplementation(() => ({
      publish: vi.fn().mockResolvedValue(undefined),
      getPresence: vi.fn().mockResolvedValue([]),
      enterPresence: vi.fn().mockResolvedValue(undefined),
      leavePresence: vi.fn().mockResolvedValue(undefined),
      getHistory: vi.fn().mockResolvedValue([]),
    })),
  };
});

describe('RealtimeService', () => {
  let service: RealtimeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RealtimeService();
  });

  it('should initialize with SocketIORealtimeProvider', () => {
    expect(SocketIORealtimeProvider).toHaveBeenCalled();
  });

  it('should delegate publish to provider', async () => {
    await service.publish('test-channel', 'test-event', { data: 'test' });
    const providerInstance = (service as any).provider;
    expect(providerInstance.publish).toHaveBeenCalledWith('test-channel', 'test-event', { data: 'test' });
  });

  it('should delegate getPresence to provider', async () => {
    await service.getPresence('test-channel');
    const providerInstance = (service as any).provider;
    expect(providerInstance.getPresence).toHaveBeenCalledWith('test-channel');
  });

  it('should delegate enterPresence to provider', async () => {
    await service.enterPresence('test-channel', 'client-1', { name: 'User 1' });
    const providerInstance = (service as any).provider;
    expect(providerInstance.enterPresence).toHaveBeenCalledWith('test-channel', 'client-1', { name: 'User 1' });
  });

  it('should delegate leavePresence to provider', async () => {
    await service.leavePresence('test-channel', 'client-1');
    const providerInstance = (service as any).provider;
    expect(providerInstance.leavePresence).toHaveBeenCalledWith('test-channel', 'client-1');
  });

  it('should delegate getHistory to provider', async () => {
    await service.getHistory('test-channel', 10);
    const providerInstance = (service as any).provider;
    expect(providerInstance.getHistory).toHaveBeenCalledWith('test-channel', 10);
  });
});
