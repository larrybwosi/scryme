import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ScrymeChatApiClient,
  createApprovalMessage,
  createReportMessage,
  createFormMessage,
  createTaskCardMessage,
  CustomMessageSchema,
} from "../index";
import { chat } from "../client";

vi.mock("../client", () => ({
  chat: {
    workspace: {
      channels: {
        list: vi.fn(),
      },
    },
    channel: {
      message: {
        create: vi.fn(),
      },
    },
    message: {
      update: vi.fn(),
    },
  },
}));

describe("ScrymeChatApiClient - Custom Messages", () => {
  let client: ScrymeChatApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ScrymeChatApiClient();
  });

  it("should re-export custom message builders and validate schemas", () => {
    const approval = createApprovalMessage({
      title: "Budget Approval",
      fields: [{ label: "Department", value: "Engineering" }],
      callbackId: "budget_123",
    });

    expect(approval.type).toBe("APPROVAL");
    expect(approval.context.title).toBe("Budget Approval");
    const result = CustomMessageSchema.safeParse(approval);
    expect(result.success).toBe(true);

    const report = createReportMessage({
      title: "Sales Report",
      reportId: "rep-001",
      summary: "Q3 Summary",
      metrics: [{ label: "Revenue", value: "$50k" }],
    });
    expect(report.type).toBe("REPORT");

    const form = createFormMessage({
      title: "Feedback Form",
      submitCallbackId: "form_001",
      fields: [{ id: "input_1", label: "Comments" }],
    });
    expect(form.type).toBe("FORM");

    const task = createTaskCardMessage({
      title: "Deploy App",
      status: "In Progress",
      callbackId: "task_001",
    });
    expect(task.type).toBe("TASK_CARD");
  });

  it("should include customMessage in metadata when sending a message", async () => {
    const mockChannelId = "channel_123";
    vi.mocked(chat.workspace.channels.list).mockResolvedValue([
      { id: mockChannelId, name: "General", slug: "general", type: "public", workspaceId: "ws_1", isPrivate: false, createdAt: "", updatedAt: "" },
    ]);
    vi.mocked(chat.channel.message.create).mockResolvedValue({ id: "msg_123" } as any);

    const customMsg = createApprovalMessage({
      title: "PTO Request",
      fields: [{ label: "Days", value: "3" }],
      callbackId: "pto_001",
    });

    await client.sendMessage("acme-hq", "general", {
      content: "Please review PTO request",
      customMessage: customMsg,
    });

    expect(chat.channel.message.create).toHaveBeenCalledWith(mockChannelId, {
      content: "Please review PTO request",
      attachments: undefined,
      actions: undefined,
      threadId: undefined,
      metadata: {
        customMessage: customMsg,
      },
    });
  });

  it("should merge existing metadata with customMessage when sending a message", async () => {
    const mockChannelId = "channel_123";
    vi.mocked(chat.workspace.channels.list).mockResolvedValue([
      { id: mockChannelId, name: "General", slug: "general", type: "public", workspaceId: "ws_1", isPrivate: false, createdAt: "", updatedAt: "" },
    ]);
    vi.mocked(chat.channel.message.create).mockResolvedValue({ id: "msg_123" } as any);

    const customMsg = createApprovalMessage({
      title: "PTO Request",
      fields: [{ label: "Days", value: "3" }],
      callbackId: "pto_001",
    });

    await client.sendMessage("acme-hq", "general", {
      content: "Please review PTO request",
      metadata: { source: "crm_workflow" },
      customMessage: customMsg,
    });

    expect(chat.channel.message.create).toHaveBeenCalledWith(mockChannelId, {
      content: "Please review PTO request",
      attachments: undefined,
      actions: undefined,
      threadId: undefined,
      metadata: {
        source: "crm_workflow",
        customMessage: customMsg,
      },
    });
  });

  it("should include customMessage in metadata when updating a message", async () => {
    const mockChannelId = "channel_123";
    vi.mocked(chat.workspace.channels.list).mockResolvedValue([
      { id: mockChannelId, name: "General", slug: "general", type: "public", workspaceId: "ws_1", isPrivate: false, createdAt: "", updatedAt: "" },
    ]);
    vi.mocked(chat.message.update).mockResolvedValue({ id: "msg_123" } as any);

    const customMsg = createTaskCardMessage({
      title: "Fix bug",
      status: "Done",
      callbackId: "bug_001",
    });

    await client.updateMessage("acme-hq", "general", "msg_123", {
      content: "Task status updated",
      customMessage: customMsg,
    });

    expect(chat.message.update).toHaveBeenCalledWith(mockChannelId, "msg_123", {
      content: "Task status updated",
      actions: undefined,
      attachments: undefined,
      metadata: {
        customMessage: customMsg,
      },
    });
  });
});
