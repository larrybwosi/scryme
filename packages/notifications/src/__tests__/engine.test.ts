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
    scrymeConfiguration: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ status: 200 }),
  },
}));

vi.mock('@repo/chat', () => ({
  ScrymeChatApiClient: class {
    sendMessage = vi.fn().mockResolvedValue(true);
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

  it('should resolve recipients concurrently across memberIds, roles, and departmentIds', async () => {
    const template = {
      id: 'template-id',
      content: 'Hello {{name}}',
      subject: 'Subject',
    };

    (db.notificationTemplate.findUnique as any).mockResolvedValue(template);
    (db.notificationDispatch.create as any).mockResolvedValue({ id: 'dispatch-id' });
    (db.member.findMany as any)
      .mockResolvedValueOnce([{ userId: 'user-m1' }]) // for memberIds
      .mockResolvedValueOnce([{ userId: 'user-r1' }]); // for roles
    (db.departmentMember.findMany as any).mockResolvedValue([
      { member: { userId: 'user-d1' } },
    ]);

    await notificationEngine.notify({
      organizationId: 'org-1',
      templateName: 'test-template',
      data: { name: 'Alice' },
      recipients: {
        userIds: ['user-u1'],
        memberIds: ['m1'],
        roles: ['ADMIN'],
        departmentIds: ['d1'],
      },
    });

    const createCall = (db.notificationDispatch.create as any).mock.calls[0][0];
    expect(createCall.data.recipientIds).toEqual(
      expect.arrayContaining(['user-u1', 'user-m1', 'user-r1', 'user-d1']),
    );
  });

  it('should deliver messages concurrently across configured channels', async () => {
    const dispatchData = {
      id: 'dispatch-1',
      organizationId: 'org-1',
      templateId: 'tpl-1',
      status: 'PENDING',
      channels: ['WEBHOOK', 'SCRYME'],
      webhookUrl: 'https://webhook.site/test',
      finalSubject: 'Test Subject',
      finalContent: 'Test Content',
      recipientIds: ['user-1'],
      data: {},
    };

    (db.notificationDispatch.findUnique as any).mockResolvedValue(dispatchData);
    (db.notificationDispatch.update as any).mockResolvedValue({});
    (db.scrymeConfiguration.findUnique as any).mockResolvedValue({
      organizationId: 'org-1',
      isActive: true,
      workspaceSlug: 'test-workspace',
    });

    await notificationEngine.deliver('dispatch-1');

    expect(db.notificationDispatch.update).toHaveBeenCalledWith({
      where: { id: 'dispatch-1' },
      data: { status: 'QUEUED' },
    });
    expect(db.notificationDispatch.update).toHaveBeenCalledWith({
      where: { id: 'dispatch-1' },
      data: { status: 'SENT', sentAt: expect.any(Date) },
    });
  });
});
