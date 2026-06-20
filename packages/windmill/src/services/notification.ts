import Handlebars from "handlebars";
import { db, NotificationDispatch } from "@repo/db";
import axios from "axios";

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
      channels = ["WEBHOOK"],
    } = options;

    // 1. Fetch template
    const template = await db.notificationTemplate.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: templateName,
        },
      },
    });

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

    if (recipients?.memberIds?.length) {
      const members = await db.member.findMany({
        where: { id: { in: recipients.memberIds }, organizationId },
        select: { userId: true },
      });
      members.forEach((m: any) => userIds.add(m.userId));
    }

    if (recipients?.roles?.length) {
      const members = await db.member.findMany({
        where: {
          organizationId,
          role: { in: recipients.roles as any },
        },
        select: { userId: true },
      });
      members.forEach((m: any) => userIds.add(m.userId));
    }

    if (recipients?.departmentIds?.length) {
      const deptMembers = await db.departmentMember.findMany({
        where: { departmentId: { in: recipients.departmentIds } },
        include: { member: { select: { userId: true } } },
      });
      deptMembers.forEach((dm: any) => userIds.add(dm.member.userId));
    }

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
      for (const channel of dispatch.channels) {
        if (channel === "WEBHOOK" || channel === "DISCORD") {
          await this.deliverWebhook(dispatch);
        }
        if (channel === "DISCORD") {
          await this.deliverDiscord(dispatch);
        }
        if (channel === "EMAIL") {
          await this.deliverEmail(dispatch);
        }
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
      `https://discord.com/api/v10/channels/${channelId}/messages`,
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
    const { sendEmail } = await import("../lib/services/mailer.ts" as any);

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
}

export const notificationEngine = new NotificationEngine();
