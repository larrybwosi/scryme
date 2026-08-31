import Handlebars from "handlebars";
import { db, NotificationDispatch } from "@repo/db";
import axios from "axios";
import { ScrymeChatApiClient } from "@repo/chat";
import { isSafeUrl } from "./security";

// Register helpers for report construction
Handlebars.registerHelper("table", function (data: any[], options: any) {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  let markdown = "| " + headers.join(" | ") + " |\n";
  markdown += "| " + headers.map(() => "---").join(" | ") + " |\n";

  data.forEach((row: any) => {
    markdown += "| " + headers.map((h: any) => row[h]).join(" | ") + " |\n";
  });

  return new Handlebars.SafeString(markdown);
});

export interface NotifyOptions {
  organizationId: string;
  templateName: string;
  data: any;
  recipients?: {
    userIds?: string[];
    memberIds?: string[];
    roles?: string[];
    departmentIds?: string[];
  };
  channels?: string[];
}

export class NotificationEngine {
  async notify(options: NotifyOptions): Promise<NotificationDispatch> {
    const {
      organizationId,
      templateName,
      data,
      recipients,
    } = options;

    let { channels = ["WEBHOOK"] } = options;

    // Performance optimization: Parallelize independent database queries for Scryme config and notification template
    const [scrymeConfig, template] = await Promise.all([
      db.scrymeConfiguration.findUnique({
        where: { organizationId },
      }),
      db.notificationTemplate.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: templateName,
          },
        },
      }),
    ]);

    if (scrymeConfig?.isActive && !channels.includes("SCRYME")) {
      channels = ["SCRYME", ...channels];
    }

    if (!template) {
      throw new Error(
        `Template ${templateName} not found for organization ${organizationId}`,
      );
    }

    // 2. Resolve Recipients
    const resolvedUserIds = await this.resolveRecipients(
      organizationId,
      recipients,
    );

    // 3. Construct Content
    const compiledTemplate = Handlebars.compile(template.content);
    const finalContent = compiledTemplate(data);
    const compiledSubject = template.subject
      ? Handlebars.compile(template.subject)(data)
      : undefined;

    // 4. Create Dispatch record
    const dispatch = await db.notificationDispatch.create({
      data: {
        organizationId,
        templateId: template.id,
        status: "PENDING",
        recipientIds: resolvedUserIds,
        recipientRoles: recipients?.roles || [],
        recipientDepts: recipients?.departmentIds || [],
        data: data,
        finalContent,
        finalSubject: compiledSubject,
        channels,
      },
    });

    // 5. Execute Deliveries
    await this.deliver(dispatch.id);

    return dispatch;
  }

  private async resolveRecipients(
    organizationId: string,
    recipients?: NotifyOptions["recipients"],
  ): Promise<string[]> {
    const userIds = new Set<string>(recipients?.userIds || []);

    // Performance optimization: Execute independent member and department queries concurrently
    const [membersById, membersByRole, deptMembers] = await Promise.all([
      recipients?.memberIds?.length
        ? db.member.findMany({
            where: { id: { in: recipients.memberIds }, organizationId },
            select: { userId: true },
          })
        : Promise.resolve([]),
      recipients?.roles?.length
        ? db.member.findMany({
            where: {
              organizationId,
              role: { in: recipients.roles as any },
            },
            select: { userId: true },
          })
        : Promise.resolve([]),
      recipients?.departmentIds?.length
        ? db.departmentMember.findMany({
            where: { departmentId: { in: recipients.departmentIds } },
            include: { member: { select: { userId: true } } },
          })
        : Promise.resolve([]),
    ]);

    membersById.forEach((m: any) => userIds.add(m.userId));
    membersByRole.forEach((m: any) => userIds.add(m.userId));
    deptMembers.forEach((dm: any) => userIds.add(dm.member.userId));

    return Array.from(userIds);
  }

  async deliver(dispatchId: string) {
    const dispatch = await db.notificationDispatch.findUnique({
      where: { id: dispatchId },
      include: { organization: true },
    });

    if (!dispatch || dispatch.status !== "PENDING") return;

    await db.notificationDispatch.update({
      where: { id: dispatchId },
      data: { status: "QUEUED" },
    });

    try {
      // Performance optimization: Execute multi-channel notification deliveries concurrently
      const channelPromises = dispatch.channels.map(async (channel: string) => {
        try {
          if (channel === "WEBHOOK") {
            await this.deliverWebhook(dispatch);
          } else if (channel === "SCRYME") {
            await this.deliverScryme(dispatch);
          } else if (channel === "DISCORD") {
            await this.deliverDiscord(dispatch);
          } else if (channel === "EMAIL") {
            await this.deliverEmail(dispatch);
          }
        } catch (err: any) {
          console.error(`Failed to deliver to ${channel}: ${err.message}`);
          throw err;
        }
      });

      const results = await Promise.allSettled(channelPromises);
      const failures = results.filter((r) => r.status === "rejected");

      // If all channels failed, mark dispatch as FAILED
      if (failures.length === dispatch.channels.length && dispatch.channels.length > 0) {
        const firstError = (failures[0] as PromiseRejectedResult).reason;
        throw new Error(firstError?.message || "All notification channels failed");
      }

      await db.notificationDispatch.update({
        where: { id: dispatchId },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error: any) {
      await db.notificationDispatch.update({
        where: { id: dispatchId },
        data: { status: "FAILED", error: error.message },
      });
    }
  }

  private async deliverWebhook(dispatch: any) {
    const config = await db.notificationChannelConfig.findUnique({
      where: {
        organizationId_channel: {
          organizationId: dispatch.organizationId,
          channel: "WEBHOOK",
        },
      },
    });

    const url = dispatch.webhookUrl || (config?.config as any)?.url;

    if (!url) {
      console.warn(
        `No webhook URL configured for organization ${dispatch.organizationId}`,
      );
      return;
    }

    // @security Validate URL to prevent SSRF
    if (!(await isSafeUrl(url))) {
      throw new Error(`Insecure webhook URL blocked: ${url}`);
    }

    await axios.post(
      url,
      {
        id: dispatch.id,
        template: dispatch.templateId,
        subject: dispatch.finalSubject,
        content: dispatch.finalContent,
        data: dispatch.data,
        recipients: dispatch.recipientIds,
        timestamp: new Date().toISOString(),
      },
      {
        timeout: 10000,
        maxContentLength: 1024 * 1024, // 1MB limit for response
      },
    );
  }

  private async deliverDiscord(dispatch: any) {
    const config = await db.notificationChannelConfig.findUnique({
      where: {
        organizationId_channel: {
          organizationId: dispatch.organizationId,
          channel: "DISCORD",
        },
      },
    });

    if (!config || !config.isActive) {
      console.warn(
        `Discord not configured or inactive for organization ${dispatch.organizationId}`,
      );
      return;
    }

    const { botToken, channelId } = config.config as any;

    if (!botToken || !channelId) {
      console.warn(
        `Discord botToken or channelId missing for organization ${dispatch.organizationId}`,
      );
      return;
    }

    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    // @security Validate URL to prevent SSRF
    if (!(await isSafeUrl(url))) {
      throw new Error(`Insecure Discord URL blocked: ${url}`);
    }

    let embeds = [];
    try {
      // Try to parse finalContent as JSON for complex embeds
      const parsed = JSON.parse(dispatch.finalContent);
      embeds = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Fallback to simple embed if not JSON
      embeds = [
        {
          title: dispatch.finalSubject || "Notification",
          description: dispatch.finalContent,
          color: 0x5865f2, // Discord Blurple
          timestamp: new Date().toISOString(),
        },
      ];
    }

    await axios.post(
      url,
      {
        embeds,
      },
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
        maxContentLength: 1024 * 1024, // 1MB limit for response
      },
    );
  }

  private async deliverEmail(dispatch: any) {
    // Dynamically import mailer to avoid circular dependencies or heavy bundle in frontend if this was used there
    const { sendEmail } = await import("./lib/services/mailer.ts" as any);

    const recipients = await db.user.findMany({
      where: { id: { in: dispatch.recipientIds } },
      select: { email: true },
    });

    const emails = recipients
      .map((r: any) => r.email)
      .filter(Boolean) as string[];

    if (emails.length === 0) return;

    await sendEmail({
      to: emails,
      subject: dispatch.finalSubject || "Notification",
      html: dispatch.finalContent,
    });
  }

  private async deliverScryme(dispatch: any) {
    const config = await db.scrymeConfiguration.findUnique({
      where: { organizationId: dispatch.organizationId },
    });

    if (!config || !config.isActive || !config.workspaceSlug) {
      console.warn(
        `Scryme Chat not configured or inactive for organization ${dispatch.organizationId}`,
      );
      return;
    }

    const scrymeClient = new ScrymeChatApiClient();

    // Determine channel - default to 'notifications' if not provided in data
    const channelSlug = dispatch.data?.scrymeChannel || "notifications";

    let message: any = {
      content: dispatch.finalContent,
    };

    // If template provides actions in data
    if (dispatch.data?.scrymeActions) {
      message.actions = dispatch.data.scrymeActions;
    }

    await scrymeClient.sendMessage(
      config.workspaceSlug,
      channelSlug,
      message,
    );
  }
}

export const notificationEngine = new NotificationEngine();
export { isSafeUrl } from "./security";
export { sendSystemNotification } from "./system";
