import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { OpenPanel } from "@openpanel/sdk";
import { env } from "@repo/env";

@Injectable()
export class OpenPanelService implements OnModuleInit {
  private readonly logger = new Logger(OpenPanelService.name);
  private client: OpenPanel | null = null;

  onModuleInit() {
    const clientId = env.OPENPANEL_CLIENT_ID;
    const clientSecret = env.OPENPANEL_CLIENT_SECRET;
    const host = env.OPENPANEL_HOST;

    const isValidClientId =
      clientId &&
      !clientId.includes("PLACEHOLDER") &&
      clientId !== "your-openpanel-client-id";

    if (isValidClientId) {
      try {
        const validSecret =
          clientSecret &&
          !clientSecret.includes("PLACEHOLDER") &&
          clientSecret !== "your-openpanel-client-secret"
            ? clientSecret
            : undefined;

        const validHost =
          host &&
          !host.includes("PLACEHOLDER")
            ? host
            : undefined;

        this.client = new OpenPanel({
          clientId,
          clientSecret: validSecret,
          apiUrl: validHost,
        });
        this.logger.log("OpenPanel SDK initialized successfully");
      } catch (error) {
        this.logger.error("Failed to initialize OpenPanel SDK", error);
      }
    } else {
      this.logger.log("OpenPanel credentials missing or unconfigured, backend tracking disabled");
    }
  }

  async trackEvent(event: string, profileId?: string, properties?: Record<string, unknown>) {
    await this.track({ event, profileId, properties });
  }

  async track(payload: { profileId?: string; event: string; properties?: Record<string, unknown> }) {
    if (!this.client) return;
    try {
      await this.client.track(payload.event, {
        profileId: payload.profileId,
        ...payload.properties,
      });
    } catch (error) {
      this.logger.error(`Failed to track event: ${payload.event}`, error);
    }
  }

  async identify(payload: { profileId: string; [key: string]: unknown }) {
    if (!this.client) return;
    try {
      await this.client.identify(payload);
    } catch (error) {
      this.logger.error(`Failed to identify profile: ${payload.profileId}`, error);
    }
  }

  async alias(payload: { profileId: string; alias: string }) {
    if (!this.client) return;
    try {
      await this.client.alias(payload);
    } catch (error) {
      this.logger.error("Failed to alias profile", error);
    }
  }
}
