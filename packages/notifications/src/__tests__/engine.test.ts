import { notificationEngine } from '../index';
import { db } from '@repo/db';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@repo/db', () => ({
  db: {
    notificationTemplate: {
      findUnique: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
    },
    departmentMember: {
      findMany: vi.fn(),
    },
    notificationDispatch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notificationChannelConfig: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ status: 200 }),
  },
}));

describe('NotificationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct report tables correctly using the handlebars helper', async () => {
    const template = {
      id: 'template-id',
      content: 'Report:\n{{table items}}',
      subject: 'Weekly Report',
    };

    (db.notificationTemplate.findUnique as any).mockResolvedValue(template);
    (db.notificationDispatch.create as any).mockResolvedValue({ id: 'dispatch-id' });

    await notificationEngine.notify({
      organizationId: 'org-id',
      templateName: 'test-template',
      data: {
        items: [
          { Name: 'Bread', Stock: 10 },
          { Name: 'Milk', Stock: 5 },
        ],
      },
    });

    const createCall = (db.notificationDispatch.create as any).mock.calls[0][0];
    expect(createCall.data.finalContent).toContain('| Name | Stock |');
    expect(createCall.data.finalContent).toContain('| Bread | 10 |');
  });
});
