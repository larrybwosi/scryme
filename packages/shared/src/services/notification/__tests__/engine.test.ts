import { notificationEngine } from '../index';
import { db } from '@repo/db';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@repo/db', () => ({
  db: {
    notificationTemplate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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
    create: vi.fn().mockReturnValue({
      post: vi.fn().mockResolvedValue({ status: 200 }),
      get: vi.fn().mockResolvedValue({ status: 200, data: {} }),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    }),
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
  it("should auto-upsert missing template if not found in db", async () => {
    (db.notificationTemplate.findUnique as any).mockResolvedValue(null);
    (db.notificationTemplate.upsert as any).mockResolvedValue({
      id: "default-template-id",
      content: "Your delivery verification code for order #{{orderNumber}} is {{otp}}.",
      subject: "Delivery OTP for Order #{{orderNumber}}",
    });
    (db.notificationDispatch.create as any).mockResolvedValue({ id: "dispatch-id" });

    await notificationEngine.notify({
      organizationId: "org-id",
      templateName: "DELIVERY_OTP",
      data: {
        otp: "123456",
        orderNumber: "ORD-001",
      },
    });

    expect(db.notificationTemplate.upsert).toHaveBeenCalledWith({
      where: {
        organizationId_name: {
          organizationId: "org-id",
          name: "DELIVERY_OTP",
        },
      },
      update: {},
      create: {
        organizationId: "org-id",
        name: "DELIVERY_OTP",
        subject: "Delivery OTP for Order #{{orderNumber}}",
        content: "Your delivery verification code for order #{{orderNumber}} is {{otp}}.",
      },
    });

    const createCall = (db.notificationDispatch.create as any).mock.calls[0][0];
    expect(createCall.data.finalSubject).toBe("Delivery OTP for Order #ORD-001");
    expect(createCall.data.finalContent).toBe("Your delivery verification code for order #ORD-001 is 123456.");
  });
});