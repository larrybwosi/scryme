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

    if (clientId && clientSecret) {
      try {
        this.client = new OpenPanel({
          clientId,
          clientSecret,
          apiUrl: host || undefined,
        });
        this.logger.log("OpenPanel SDK initialized successfully");
      } catch (error) {
        this.logger.error("Failed to initialize OpenPanel SDK", error);
      }
    } else {
      this.logger.log("OpenPanel credentials missing, tracking disabled");
    }
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
