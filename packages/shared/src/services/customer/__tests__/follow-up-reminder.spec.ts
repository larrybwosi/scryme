import { describe, it, expect, beforeEach, vi } from "vitest";
import { FollowUpReminderService } from "../follow-up-reminder.service";

// Mock the dependencies
const mockPrisma = {
  crmFollowUp: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

const mockSendMessage = vi.fn().mockResolvedValue({ id: "msg-123" });

vi.mock("@repo/chat", () => {
  return {
    ScrymeChatApiClient: class {
      sendMessage = mockSendMessage;
    },
  };
});

describe("FollowUpReminderService", () => {
  let service: FollowUpReminderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FollowUpReminderService(mockPrisma as any);
  });

  it("should process reminders and escalations concurrently and return counts", async () => {
    const mockFollowUpReminder = {
      id: "followup-1",
      title: "Upcoming Call",
      type: "CALL",
      dueDate: new Date(),
      status: "PENDING",
      reminderSent: false,
      organization: {
        scrymeConfiguration: {
          workspaceSlug: "test-workspace",
          isActive: true,
        },
      },
      record: {
        customer: {
          id: "cust-1",
          name: "John Doe",
        },
      },
      location: {
        scrymeChannelId: "branch-channel",
      },
    };

    const mockFollowUpEscalation = {
      id: "followup-2",
      title: "Overdue Meeting",
      type: "MEETING",
      dueDate: new Date(Date.now() - 3600000), // 1 hour ago
      priority: "HIGH",
      status: "PENDING",
      escalationSent: false,
      organization: {
        scrymeConfiguration: {
          workspaceSlug: "test-workspace",
          isActive: true,
        },
      },
      record: {
        customer: {
          id: "cust-2",
          name: "Jane Smith",
        },
      },
      location: null,
    };

    mockPrisma.crmFollowUp.findMany
      .mockResolvedValueOnce([mockFollowUpReminder]) // First call for reminders
      .mockResolvedValueOnce([mockFollowUpEscalation]); // Second call for escalations

    mockPrisma.crmFollowUp.update.mockResolvedValue({});

    const result = await service.processReminders();

    expect(result).toEqual({
      remindersSent: 1,
      escalationsSent: 1,
    });

    // Verify notifications were sent via Scryme client
    expect(mockSendMessage).toHaveBeenCalledTimes(3); // 2 for reminder (branch and admins) + 1 for escalation (admins)
    expect(mockPrisma.crmFollowUp.update).toHaveBeenCalledTimes(2);

    // Verify updates were executed correctly
    expect(mockPrisma.crmFollowUp.update).toHaveBeenCalledWith({
      where: { id: "followup-1" },
      data: { reminderSent: true },
    });

    expect(mockPrisma.crmFollowUp.update).toHaveBeenCalledWith({
      where: { id: "followup-2" },
      data: {
        escalationSent: true,
        status: "OVERDUE",
      },
    });
  });

  it("should isolate errors and continue processing other follow-ups", async () => {
    const mockFollowUp1 = {
      id: "followup-err-1",
      dueDate: new Date(),
      organization: {
        scrymeConfiguration: {
          workspaceSlug: "test-workspace",
          isActive: true,
        },
      },
      record: {},
    };

    const mockFollowUp2 = {
      id: "followup-ok-2",
      dueDate: new Date(),
      organization: {
        scrymeConfiguration: {
          workspaceSlug: "test-workspace",
          isActive: true,
        },
      },
      record: {},
    };

    mockPrisma.crmFollowUp.findMany
      .mockResolvedValueOnce([mockFollowUp1, mockFollowUp2]) // Reminders
      .mockResolvedValueOnce([]); // No escalations

    // Mock update to fail on the first follow-up, but succeed on the second
    mockPrisma.crmFollowUp.update
      .mockRejectedValueOnce(new Error("Database error on update"))
      .mockResolvedValueOnce({});

    const result = await service.processReminders();

    // The function returns overall counts based on findMany output lengths
    expect(result).toEqual({
      remindersSent: 2,
      escalationsSent: 0,
    });

    // Both should attempt to send notifications, and both should try updating DB
    expect(mockPrisma.crmFollowUp.update).toHaveBeenCalledTimes(2);
  });
});
