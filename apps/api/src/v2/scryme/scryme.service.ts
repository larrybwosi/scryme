import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeChatApiClient } from "@repo/chat";
import * as crypto from "crypto";
import { makeApprovalDecisionCore } from "@repo/shared/actions";
import { ScrymeApprovalService } from "./scryme-approval.service";
import { BookingAssignmentStatus, BookingEventSource, BookingStatus } from "@repo/db";
import { BookingService } from "@/v3/modules/services/application/services/booking.service";

@Injectable()
export class ScrymeService {
  private readonly logger = new Logger(ScrymeService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeApprovalService: ScrymeApprovalService,
    private readonly bookingService: BookingService,
  ) {}

  async getConfiguration(organizationId: string) {
    return this.prisma.client.scrymeConfiguration.findUnique({
      where: { organizationId },
    });
  }

  async provisionWorkspace(
    organizationId: string,
    name: string,
    slug: string,
    ownerEmail?: string,
  ) {
    const workspaceSlug = `org-${slug}`.toLowerCase();

    this.logger.log(
      `Provisioning Scryme workspace for org ${organizationId}: ${workspaceSlug}`,
    );

    try {
      let finalOwnerEmail = ownerEmail;
      if (!finalOwnerEmail) {
        // Find the first member/admin in the organization to act as owner
        const firstMember = await this.prisma.client.member.findFirst({
          where: { organizationId },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        });
        finalOwnerEmail = firstMember?.user?.email;
      }
      if (!finalOwnerEmail) {
        finalOwnerEmail = "admin@scryme.tech";
      }

      let workspace;
      try {
        workspace = await this.scrymeClient.createWorkspace(
          name,
          workspaceSlug,
          finalOwnerEmail,
        );
      } catch (error: any) {
        if (error.response?.status === 409) {
          this.logger.log(
            `Workspace ${workspaceSlug} already exists, fetching...`,
          );
          workspace = await this.scrymeClient.getWorkspace(workspaceSlug);
        } else {
          throw error;
        }
      }

      const config = await this.prisma.client.scrymeConfiguration.upsert({
        where: { organizationId },
        update: {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          isActive: true,
        },
        create: {
          organizationId,
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          isActive: true,
        },
      });

      // Register the workspace-specific webhook in V3 API for interactive actions
      const publicUrl =
        process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
      if (publicUrl) {
        const webhookUrl = `${publicUrl.replace(/\/$/, "")}/v2/scryme/webhook`;
        try {
          await this.scrymeClient.registerWorkspaceWebhook(
            workspace.slug,
            webhookUrl,
          );
          this.logger.log(
            `Registered V3 workspace webhook for ${workspace.slug}: ${webhookUrl}`,
          );
        } catch (webhookErr: any) {
          this.logger.error(
            `Failed to register V3 workspace webhook: ${webhookErr.message}`,
          );
        }
      }

      // Background sync users for enterprise robust mapping
      this.syncUsers(organizationId).catch(err =>
        this.logger.error(`Initial user sync failed: ${err.message}`),
      );

      // Provision default channels
      this.setupDefaultChannels(organizationId).catch(err =>
        this.logger.error(`Failed to setup default channels: ${err.message}`),
      );

      return config;
    } catch (error: any) {
      this.logger.error(
        `Failed to provision Scryme workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async setupDefaultChannels(organizationId: string) {
    const config = await this.getConfiguration(organizationId);
    if (!config?.workspaceSlug || !config.isActive) return;

    const defaultChannels = [
      { name: "Notifications", slug: "notifications" },
      { name: "Approvals", slug: "approvals" },
    ];

    for (const ch of defaultChannels) {
      try {
        await this.scrymeClient.createChannel(
          config.workspaceSlug,
          ch.name,
          ch.slug,
        );
      } catch (error: any) {
        if (error.response?.status !== 409) {
          this.logger.error(
            `Failed to create default channel ${ch.slug}: ${error.message}`,
          );
        }
      }
    }
  }

  async provisionChannelForEntity(
    organizationId: string,
    entityType: "department" | "location",
    entityId: string,
    preFetchedConfig?: any,
  ) {
    // ⚡ Bolt Optimization: Use optional pre-fetched config to avoid redundant N+1 configuration lookups.
    const config = preFetchedConfig || await this.getConfiguration(organizationId);
    if (!config?.workspaceSlug || !config.isActive) return;

    let entity;
    if (entityType === "department") {
      // SECURITY (Sentinel): Use findFirst with organizationId to prevent cross-tenant IDOR
      entity = await this.prisma.client.department.findFirst({
        where: { id: entityId, organizationId },
      });
    } else {
      // SECURITY (Sentinel): Use findFirst with organizationId to prevent cross-tenant IDOR
      entity = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: entityId, organizationId },
      });
    }

    if (!entity || (entity as any).scrymeChannelId) return;

    const prefix = entityType === "department" ? "dept" : "loc";
    const channelSlug = `${prefix}-${entity.name.toLowerCase().replace(/\s+/g, "-")}`;

    try {
      const channel = await this.scrymeClient.createChannel(
        config.workspaceSlug,
        entity.name,
        channelSlug,
      );

      if (entityType === "department") {
        await this.prisma.client.department.update({
          where: { id: entityId },
          data: { scrymeChannelId: channel.id },
        });
      } else {
        await this.prisma.client.inventoryLocation.update({
          where: { id: entityId },
          data: { scrymeChannelId: channel.id },
        });
      }

      return channel;
    } catch (error: any) {
      if (error.response?.status === 409) {
        this.logger.warn(
          `Channel ${channelSlug} already exists for ${entityType} ${entityId}`,
        );
        // We could potentially try to find the channel ID by slug here if we had a getChannelBySlug method
      } else {
        this.logger.error(
          `Failed to provision channel for ${entityType} ${entityId}: ${error.message}`,
        );
      }
    }
  }

  async syncAllChannels(organizationId: string) {
    // ⚡ Bolt Optimization: Pre-fetch configuration once to hoist non-changing lookups outside loops
    const config = await this.getConfiguration(organizationId);
    if (!config?.workspaceSlug || !config.isActive) return;

    // ⚡ Bolt Optimization: Replace broad model fetches with targeted select blocks
    // to reduce database payload, memory usage, and Prisma object hydration overhead.
    const departments = await this.prisma.client.department.findMany({
      where: { organizationId, scrymeChannelId: null },
      select: { id: true },
    });

    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId, scrymeChannelId: null },
      select: { id: true },
    });

    this.logger.log(
      `Syncing channels for ${departments.length} departments and ${locations.length} locations`,
    );

    // ⚡ Bolt Optimization: Process channel synchronization tasks in parallelized batches of 10
    // to avoid socket/DB starvation or rate-limits while drastically reducing sync duration.
    const BATCH_SIZE = 10;

    for (let i = 0; i < departments.length; i += BATCH_SIZE) {
      const batch = departments.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((dept) =>
          this.provisionChannelForEntity(
            organizationId,
            "department",
            dept.id,
            config,
          ),
        ),
      );
    }

    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
      const batch = locations.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((loc) =>
          this.provisionChannelForEntity(
            organizationId,
            "location",
            loc.id,
            config,
          ),
        ),
      );
    }
  }

  async syncUsers(organizationId: string, force = false) {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.workspaceSlug || !config.isActive) return;

    // Enterprise: Throttle automatic syncs to once every 24 hours
    if (!force && config.lastSyncAt) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (config.lastSyncAt > twentyFourHoursAgo) {
        this.logger.debug(
          `Skipping automatic Scryme user sync for org ${organizationId}: recently synced`,
        );
        return;
      }
    }

    // ⚡ Bolt Optimization: Replace broad 'include' with targeted 'select' projection
    // to retrieve only required fields (userId, email), reducing payload and memory footprint.
    const members = await this.prisma.client.member.findMany({
      where: { organizationId },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Syncing ${members.length} users for Scryme workspace ${config.workspaceSlug}`,
    );

    // ⚡ Bolt Optimization: Process user synchronization in parallelized batches of 10
    // to avoid rate limits and socket starvation while reducing the latency profile from O(N) down to O(1).
    const BATCH_SIZE = 10;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (member) => {
          try {
            const scrymeUser = await this.scrymeClient.findUserByEmail(
              config.workspaceSlug,
              member.user.email,
            );

            if (scrymeUser) {
              await this.prisma.client.user.update({
                where: { id: member.userId },
                data: { scrymeUserId: scrymeUser.id },
              });
            }
          } catch (error: any) {
            this.logger.warn(
              `Failed to sync user ${member.user.email}: ${error.message}`,
            );
          }
        }),
      );
    }

    // Record last sync
    await this.prisma.client.scrymeConfiguration.update({
      where: { organizationId },
      data: { lastSyncAt: new Date() },
    });
  }

  async handleWebhook(signature: string, payload: any) {
    // Verify Signature
    const secret = process.env.SCRYME_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    if (secret) {
      if (!signature) {
        this.logger.warn(
          "Missing Scryme webhook signature while secret is configured",
        );
        throw new BadRequestException("Missing signature");
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      // Use SHA-256 pre-hashing to ensure both buffers have identical length,
      // preventing timing attacks and leakage of the secret signature length.
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedSignature)
        .digest();
      const actualHash = crypto
        .createHash("sha256")
        .update(signature || "")
        .digest();

      if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
        this.logger.warn("Invalid Scryme webhook signature");
        throw new BadRequestException("Invalid signature");
      }
    } else if (isProduction) {
      this.logger.error(
        "SCRYME_WEBHOOK_SECRET is not configured in production. Webhooks are disabled for security.",
      );
      throw new BadRequestException("Webhooks disabled: configuration missing");
    } else {
      this.logger.warn(
        "SCRYME_WEBHOOK_SECRET is not configured. Webhook signature verification is skipped (Development mode only).",
      );
    }

    this.logger.log(`Received Scryme webhook: ${payload.event}`);

    if (payload.event === "message.action") {
      const { workspaceSlug, action, message, user } = payload.data;

      // Find the organization associated with this workspace
      const config = await (
        this.prisma.client as any
      ).scrymeConfiguration.findFirst({
        where: { workspaceSlug },
        include: { organization: true },
      });

      if (!config) {
        this.logger.warn(
          `No organization found for Scryme workspace: ${workspaceSlug}`,
        );
        return { status: "ignored" };
      }

      if (action.id.startsWith("booking_")) {
        const [actionType, bookingId, revisionValue] = action.id.split(":");
        const revision = Number(revisionValue);
        if (!bookingId || !Number.isInteger(revision)) {
          throw new BadRequestException("Invalid booking action payload");
        }
        const actor = await this.prisma.client.member.findFirst({
          where: {
            organizationId: config.organizationId,
            isActive: true,
            user: { email: user.email },
          },
          select: { id: true },
        });
        if (!actor) throw new BadRequestException("Scryme user is not an active organization member");

        let result: any;
        if (actionType === "booking_accept" || actionType === "booking_decline") {
          result = await this.bookingService.respondToAssignment(
            config.organizationId,
            bookingId,
            actor.id,
            actionType === "booking_accept"
              ? BookingAssignmentStatus.ACCEPTED
              : BookingAssignmentStatus.DECLINED,
            revision,
            "Response submitted via Scryme Chat",
            BookingEventSource.SCRYME,
          );
        } else if (actionType === "booking_start") {
          result = await this.bookingService.updateBookingStatus(
            config.organizationId,
            bookingId,
            BookingStatus.IN_PROGRESS,
            revision,
            actor.id,
            BookingEventSource.SCRYME,
          );
        } else if (actionType === "booking_complete") {
          const booking = await this.prisma.client.serviceBooking.findFirst({
            where: { id: bookingId, organizationId: config.organizationId, revision },
          });
          if (!booking) throw new BadRequestException("Booking action is stale or invalid");
          result = await this.bookingService.completeBooking(
            config.organizationId,
            bookingId,
            actor.id,
            {},
          );
        } else if (actionType === "booking_view") {
          return {
            status: "success",
            url: `${process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001"}/staff/shifts?booking=${bookingId}`,
          };
        } else {
          throw new BadRequestException("Unsupported booking action");
        }

        await this.scrymeClient.updateMessage(
          workspaceSlug,
          message.channelSlug || message.channelId,
          message.id,
          {
            content: `${message.content}\n\n*Updated by ${user.name || user.email}*`,
            actions: [],
          },
        );
        return { status: "success", bookingId: result.id };
      }

      // Handle Permission Request interactive actions
      if (
        action.id.startsWith("approve_perm:") ||
        action.id.startsWith("decline_perm:")
      ) {
        const parts = action.id.split(":");
        const actionType = parts[0];

        if (actionType === "approve_perm") {
          // Format: approve_perm:ROLE:memberId
          const roleToGrant = parts[1] as any;
          const targetMemberId = parts[2];

          // SECURITY (Sentinel): Use findFirst scoped to organizationId to prevent cross-tenant IDOR
          const targetMember = await this.prisma.client.member.findFirst({
            where: { id: targetMemberId, organizationId: config.organizationId },
          });

          if (!targetMember) {
            this.logger.warn(
              `Target member ${targetMemberId} not found or unauthorized for org ${config.organizationId}`,
            );
            throw new BadRequestException("Target member not found or unauthorized");
          }

          // Grant access: update member role and set membershipStatus to ACTIVE & isActive to true
          await this.prisma.client.member.update({
            where: { id: targetMember.id },
            data: {
              role: roleToGrant,
              membershipStatus: "ACTIVE",
              isActive: true,
            },
          });

          // Update message in Scryme Chat to remove actions and display approval note
          await this.scrymeClient.updateMessage(
            workspaceSlug,
            message.channelSlug || message.channelId,
            message.id,
            {
              content: `${message.content}\n\n✅ *Permission request APPROVED by ${user.name || user.email} (Role upgraded to ${roleToGrant}). Access granted!*`,
              actions: [],
            },
          );

          return {
            status: "success",
            message: `Permission request approved. Member ${targetMember.id} role set to ${roleToGrant}`,
          };
        } else if (actionType === "decline_perm") {
          const targetMemberId = parts[1];

          // SECURITY (Sentinel): Verify member belongs to org
          const targetMember = await this.prisma.client.member.findFirst({
            where: { id: targetMemberId, organizationId: config.organizationId },
          });

          if (!targetMember) {
            throw new BadRequestException("Target member not found or unauthorized");
          }

          await this.scrymeClient.updateMessage(
            workspaceSlug,
            message.channelSlug || message.channelId,
            message.id,
            {
              content: `${message.content}\n\n❌ *Permission request DECLINED by ${user.name || user.email}*`,
              actions: [],
            },
          );

          return { status: "success", message: "Permission request declined" };
        }
      }

      if (
        action.id.startsWith("approve:") ||
        action.id.startsWith("decline:") ||
        action.id.startsWith("request_info:")
      ) {
        const decisionId = action.value;
        const [actionType] = action.id.split(":");

        // SECURITY (Sentinel): Using findFirst instead of findUnique because we must scope the lookup
        // to the authorized tenant (config.organizationId) to prevent IDOR / cross-tenant approvals.
        const decision = await this.prisma.client.approvalDecision.findFirst({
          where: {
            id: decisionId,
            approvalRequest: { organizationId: config.organizationId },
          },
          include: {
            approvalRequest: true,
            approver: { include: { user: true } },
          },
        });

        if (decision && decision.approver.user.email === user.email) {
          const status =
            actionType === "approve"
              ? "APPROVED"
              : actionType === "decline"
                ? "REJECTED"
                : "REQUEST_INFO";

          const result = await makeApprovalDecisionCore(
            decision.approvalRequest.organizationId,
            decision.approverId,
            {
              requestId: decision.approvalRequestId,
              status: status as any,
              comments: "Action taken via Scryme Chat",
            },
          );

          const { request, finalStatus, nextStep, originalStep } = result;

          // Process side effects (notifications) directly via service to avoid insecure/buggy internal fetch
          try {
            // Update Scryme messages for the step
            await this.scrymeApprovalService.updateStepMessages(
              request.organizationId,
              request.id,
              decision.approverId,
              originalStep,
            );

            // If moved to next step, notify new approvers
            if (nextStep > originalStep) {
              await this.scrymeApprovalService.notifyApprovers(
                request.organizationId,
                request.id,
              );
            }

            // If final decision or info requested, notify requester
            if (
              (finalStatus === "APPROVED" ||
                finalStatus === "REJECTED" ||
                finalStatus === "REQUEST_INFO") &&
              nextStep === originalStep
            ) {
              await this.scrymeApprovalService.notifyRequester(
                request.organizationId,
                request.id,
              );
            }
          } catch (err: any) {
            this.logger.error(
              `Failed to process Scryme side effects: ${err.message}`,
            );
          }

          return { status: "success", message: `Action ${status} processed` };
        } else if (decision) {
          this.logger.warn(
            `Approver mismatch: ${user.email} attempted to approve decision ${decisionId} belonging to ${decision.approver.user.email}`,
          );
          throw new BadRequestException("Approver email mismatch");
        } else {
          this.logger.warn(
            `Decision ${decisionId} not found or unauthorized for workspace: ${workspaceSlug}`,
          );
          throw new BadRequestException("Decision not found or unauthorized");
        }
      }

      // Enterprise: Handle generic HITL (Human-in-the-loop) actions
      if (action.id.startsWith("wm_resume:")) {
        const resumeToken = action.value;
        const [_, jobId] = action.id.split(":");

        this.logger.log(`Resuming automation execution ${jobId} via Scryme action`);

        const execution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
          where: { id: jobId, organizationId: config.organizationId },
        });

        if (execution) {
          await (this.prisma.client as any).workflowEngineExecution.update({
            where: { id: execution.id },
            data: {
              status: "RUNNING",
              result: {
                ...(execution.result as any),
                resumedBy: user,
                resumedAt: new Date(),
                actionValue: action.value,
              },
            },
          });
        }

        // Send confirmation back to Scryme
        await this.scrymeClient.updateMessage(
          workspaceSlug,
          message.channelSlug || message.channelId,
          message.id,
          {
            content: `${message.content}\n\n✅ *Action processed by ${user.name}*`,
            actions: [],
          },
        );

        return { status: "success", message: "Automation job resumed" };
      }

      // Trigger workflow execution for unknown actions
      const scriptPath =
        process.env.SCRYME_ACTION_WORKFLOW_PATH ||
        "f/dealio/scryme_action_handler";

      const secureRandomSuffix = crypto.randomBytes(4).toString("hex");
      await (this.prisma.client as any).workflowEngineExecution.create({
        data: {
          organizationId: config.organizationId,
          definitionId: scriptPath,
          triggerEvent: "SCRYME_ACTION",
          correlationId: message.id,
          status: "PENDING",
          result: {
            action,
            message,
            user,
            workspaceSlug,
          },
        },
      });

      this.logger.log(
        `Queued execution for Scryme action: ${action.id} in workspace ${workspaceSlug}`,
      );
      return { status: "success" };
    }

    return { status: "received" };
  }

  async registerWebhook(baseUrl: string) {
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/v2/scryme/webhook`;
    this.logger.log(`Registering Scryme global webhook: ${webhookUrl}`);
    try {
      await this.scrymeClient.registerGlobalWebhook(webhookUrl);
    } catch (error: any) {
      this.logger.error(`Failed to register Scryme webhook: ${error.message}`);
    }
  }
}
