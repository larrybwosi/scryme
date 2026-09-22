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
    m2m: {
      workspace: {
        provision: vi.fn(),
      },
      member: {
        import: vi.fn(),
      },
    },
    workspace: {
      channels: {
        list: vi.fn(),
      },
    },
    channel: {
      message: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  },
}));

describe("ScrymeChatApiClient", () => {
  let client: ScrymeChatApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ScrymeChatApiClient();
  });

  describe("Custom Messages", () => {
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

      expect(chat.channel.message.create).toHaveBeenCalledWith("acme-hq", mockChannelId, {
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

      expect(chat.channel.message.create).toHaveBeenCalledWith("acme-hq", mockChannelId, {
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
      vi.mocked(chat.channel.message.update).mockResolvedValue({ id: "msg_123" } as any);

      const customMsg = createTaskCardMessage({
        title: "Fix bug",
        status: "Done",
        callbackId: "bug_001",
      });

      await client.updateMessage("acme-hq", "general", "msg_123", {
        content: "Task status updated",
        customMessage: customMsg,
      });

      expect(chat.channel.message.update).toHaveBeenCalledWith("acme-hq", mockChannelId, "msg_123", {
        content: "Task status updated",
        actions: undefined,
        attachments: undefined,
        metadata: {
          customMessage: customMsg,
        },
      });
    });
  });

  describe("M2M Provisioning & Member Import Helpers", () => {
    it("should provision workspace using m2m endpoint with full options", async () => {
      vi.mocked((chat.m2m as any).workspace.provision).mockResolvedValue({
        data: {
          workspace: { id: "ws_acme", name: "Acme Corp", slug: "acme-corp" },
        },
      });

      const result = await client.createWorkspace("Acme Corp", "acme-corp", {
        ownerEmail: "owner@acme.com",
        channels: ["system-alerts", "approvals"],
        initialMembers: [{ email: "admin@acme.com", role: "admin" }],
      });

      expect((chat.m2m as any).workspace.provision).toHaveBeenCalledWith({
        name: "Acme Corp",
        slug: "acme-corp",
        ownerEmail: "owner@acme.com",
        ownerName: undefined,
        ownerAvatar: undefined,
        industry: undefined,
        description: undefined,
        channels: ["system-alerts", "approvals"],
        initialMembers: [{ email: "admin@acme.com", role: "admin" }],
      });

      expect(result).toEqual({
        id: "ws_acme",
        name: "Acme Corp",
        slug: "acme-corp",
      });
    });

    it("should bulk import workspace members using m2m endpoint", async () => {
      vi.mocked((chat.m2m as any).member.import).mockResolvedValue({
        success: true,
        data: { importedCount: 2 },
      });

      const members = [
        { email: "alice@acme.com", name: "Alice", role: "admin" as const },
        { email: "bob@acme.com", name: "Bob", role: "member" as const },
      ];

      const res = await client.importWorkspaceMembers("acme-corp", members);

      expect((chat.m2m as any).member.import).toHaveBeenCalledWith("acme-corp", {
        members,
      });
      expect(res).toEqual({
        success: true,
        data: { importedCount: 2 },
      });
    });
  });
});
