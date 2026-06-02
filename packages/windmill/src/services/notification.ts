import Handlebars from "handlebars";
import { db } from "@repo/db";
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
  async notify(options: NotifyOptions) {
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
      console.warn(`Template ${templateName} not found for org ${organizationId}`);
      return;
    }

    // 2. Render content
    const subject = Handlebars.compile(template.subject)(data);
    const body = Handlebars.compile(template.body)(data);

    // 3. Dispatch to channels
    // ... logic to send via email, sms, push, webhook
  }
}

export const notificationEngine = new NotificationEngine();
