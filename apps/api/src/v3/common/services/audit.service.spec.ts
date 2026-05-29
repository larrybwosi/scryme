import { describe, it, expect, vi } from 'vitest';
import { AuditService, AuditLog } from './audit.service';

describe('AuditService', () => {
  it('should log audit entries', async () => {
    const service = new AuditService();
    const loggerSpy = vi.spyOn((service as any).logger, 'log');

    const entry: AuditLog = {
      timestamp: new Date().toISOString(),
      method: 'GET',
      url: '/test',
      duration: 10,
    };

    await service.log(entry);

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[Audit] GET /test'));
  });
});
