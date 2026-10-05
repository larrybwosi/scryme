import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging, MulticastMessage } from "firebase-admin/messaging";
import { PrismaService } from "@/prisma/prisma.service";

export interface FcmNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FirebaseMessagingService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseMessagingService.name);
  private firebaseApp: App | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.firebaseApp = existingApps[0] || null;
        this.logger.log("Reusing existing Firebase Admin App instance");
        return;
      }

      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined;

      if (serviceAccountJson) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          this.firebaseApp = initializeApp({
            credential: cert(credentials),
          });
          this.logger.log("Firebase Admin initialized successfully using FIREBASE_SERVICE_ACCOUNT_JSON");
          return;
        } catch (e: any) {
          this.logger.warn(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${e.message}`);
        }
      }

      if (projectId && clientEmail && privateKey) {
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log("Firebase Admin initialized successfully using individual env vars");
        return;
      }

      this.logger.warn(
        "Firebase credentials not provided or incomplete (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). FCM push notifications will be skipped gracefully."
      );
    } catch (error: any) {
      this.logger.warn(`Failed to initialize Firebase Admin SDK: ${error.message}. FCM push notifications disabled.`);
    }
  }

  public isInitialized(): boolean {
    return this.firebaseApp !== null;
  }

  /**
   * Send FCM push notification to specific registration tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: FcmNotificationPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      this.logger.debug("Firebase not initialized. Skipping FCM dispatch.");
      return { successCount: 0, failureCount: 0 };
    }

    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    if (uniqueTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const messaging: Messaging = getMessaging(this.firebaseApp);
      const message: MulticastMessage = {
        tokens: uniqueTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "schedule_updates",
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      this.logger.log(
        `FCM multicast message sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${uniqueTokens.length} tokens`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Error sending FCM message: ${error.message}`);
      return { successCount: 0, failureCount: uniqueTokens.length };
    }
  }

  /**
   * Send FCM push notification to devices associated with specific member(s)
   */
  async sendToMembers(
    memberIds: string | string[],
    payload: FcmNotificationPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    const ids = Array.isArray(memberIds) ? memberIds : [memberIds];
    if (ids.length === 0) return { successCount: 0, failureCount: 0 };

    try {
      // Retrieve registered devices associated with these member IDs
      const devices = await this.prisma.client.deviceRegistry.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          metadata: true,
        },
      });

      const tokens: string[] = [];
      for (const dev of devices) {
        const meta = (dev.metadata as Record<string, any>) || {};
        const registeredMemberId = meta.registeredByMemberId || meta.updatedByMemberId;
        if (meta.pushToken && (ids.includes(registeredMemberId) || ids.includes(meta.memberId))) {
          tokens.push(meta.pushToken);
        }
      }

      if (tokens.length === 0) {
        this.logger.debug(`No FCM push tokens found for member(s): ${ids.join(", ")}`);
        return { successCount: 0, failureCount: 0 };
      }

      return this.sendToTokens(tokens, payload);
    } catch (error: any) {
      this.logger.error(`Failed to send FCM push to members ${ids.join(", ")}: ${error.message}`);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send FCM push notification to all registered active mobile devices in an organization
   */
  async sendToOrganization(
    organizationId: string,
    payload: FcmNotificationPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const devices = await this.prisma.client.deviceRegistry.findMany({
        where: {
          organizationId,
          status: "ACTIVE",
        },
        select: {
          metadata: true,
        },
      });

      const tokens: string[] = [];
      for (const dev of devices) {
        const meta = (dev.metadata as Record<string, any>) || {};
        if (meta.pushToken && typeof meta.pushToken === "string") {
          tokens.push(meta.pushToken);
        }
      }

      if (tokens.length === 0) {
        this.logger.debug(`No FCM push tokens found for organization ${organizationId}`);
        return { successCount: 0, failureCount: 0 };
      }

      return this.sendToTokens(tokens, payload);
    } catch (error: any) {
      this.logger.error(`Failed to send FCM push to organization ${organizationId}: ${error.message}`);
      return { successCount: 0, failureCount: 0 };
    }
  }
}
