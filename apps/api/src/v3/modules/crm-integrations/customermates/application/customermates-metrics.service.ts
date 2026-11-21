import { Injectable, Logger } from "@nestjs/common";
import { OpenPanelService } from "@/common/openpanel/openpanel.service";
import { CUSTOMERMATES_FAILURE_COUNTER } from "@repo/customermates";

@Injectable()
export class CustomermatesMetricsService {
  private readonly logger = new Logger(CustomermatesMetricsService.name);

  constructor(private readonly openPanel: OpenPanelService) {}

  async recordFailure(
    organizationId: string,
    eventType: string,
    details: { integrationId?: string; eventId?: string; error?: string } = {},
  ) {
    this.logger.error(
      `${CUSTOMERMATES_FAILURE_COUNTER} organization=${organizationId} event=${eventType} eventId=${details.eventId || "none"} error=${details.error || "unknown"}`,
    );
    await this.openPanel.trackEvent(CUSTOMERMATES_FAILURE_COUNTER, organizationId, {
      organizationId,
      eventType,
      integrationId: details.integrationId,
      eventId: details.eventId,
    });
  }
}
