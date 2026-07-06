import { Test, TestingModule } from "@nestjs/testing";
import { ScrymeNotificationService } from "../scryme-notification.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as scrymeLib from "@repo/scryme";

// Mock the ScrymeChatApiClient
vi.mock("@repo/scryme", () => {
  const mockSendMessage = vi.fn().mockResolvedValue({ id: "msg_123" });
  class MockApiClient {
    sendMessage = mockSendMessage;
  }
  return {
    ScrymeChatApiClient: MockApiClient,
  };
});

describe("ScrymeNotificationService", () => {
  let service: ScrymeNotificationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrymeNotificationService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              transaction: {
                findUnique: vi.fn(),
              },
              inventoryLocation: {
                findUnique: vi.fn(),
              },
              scrymeMessage: {
                create: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<ScrymeNotificationService>(ScrymeNotificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should send notification to default channel and B2B branch channel", async () => {
    const orgId = "org_123";
    const orderId = "order_123";
    const workspaceSlug = "org-dealio";

    const mockOrder = {
      id: orderId,
      number: "ORD-001",
      finalTotal: 1000,
      currencyCode: "KES",
      businessAccount: {
        id: "ba_123",
        defaultLocationId: "loc_123",
      },
      items: [{ productName: "Item 1", quantity: 2, unitPrice: 500 }],
      organization: {
        scrymeConfiguration: {
          isActive: true,
          workspaceSlug,
        },
      },
    };

    const mockLocation = {
      id: "loc_123",
      scrymeChannelId: "branch-channel",
    };

    (prisma.client.transaction.findUnique as any).mockResolvedValue(mockOrder);
    (prisma.client.inventoryLocation.findUnique as any).mockResolvedValue(mockLocation);

    // Call the method
    await service.notifyOrderCreated(orgId, orderId);

    // Get the mock client instance
    const mockClientInstance = (service as any).scrymeClient;

    // Verify sendMessage was called for both channels
    expect(mockClientInstance.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockClientInstance.sendMessage).toHaveBeenCalledWith(workspaceSlug, "notifications", expect.anything());
    expect(mockClientInstance.sendMessage).toHaveBeenCalledWith(workspaceSlug, "branch-channel", expect.anything());

    // Verify CRM link
    const lastCall = mockClientInstance.sendMessage.mock.calls[0];
    const messageContent = lastCall[2].content;
    const actions = lastCall[2].actions;

    expect(messageContent).toContain("ORD-001");
    expect(messageContent).toContain("KES 1000");
    expect(actions[0].value).toContain("/orders/order_123");
  });
});
