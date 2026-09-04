import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { createDeviceSetupTokenCore } from "@repo/shared/lib";
import { provisionDeviceV3 } from "@repo/shared/lib";

export interface PosPairingSession {
  sessionId: string;
  pairingCode: string;
  status: "PENDING" | "AUTHORIZED" | "EXPIRED";
  createdAt: Date;
  expiresAt: Date;
  payload?: any;
}

@Injectable()
export class PosPairingService {
  private sessions = new Map<string, PosPairingSession>();

  /**
   * Cleans up expired pairing sessions older than 15 minutes.
   */
  private cleanupExpired() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt.getTime() > 15 * 60 * 1000) {
        this.sessions.delete(id);
      }
    }
  }

  /**
   * Creates a new short-lived pairing session.
   */
  createSession(): PosPairingSession {
    this.cleanupExpired();
    const sessionId = `pair_${crypto.randomBytes(12).toString("hex")}`;
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes TTL

    const session: PosPairingSession = {
      sessionId,
      pairingCode,
      status: "PENDING",
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Finds a session by either sessionId or 6-digit pairingCode.
   */
  findSession(identifier: string): PosPairingSession | undefined {
    this.cleanupExpired();
    // Direct lookup by sessionId
    let session = this.sessions.get(identifier);
    if (session) return session;

    // Search by pairingCode
    for (const s of this.sessions.values()) {
      if (s.pairingCode === identifier) {
        return s;
      }
    }
    return undefined;
  }

  /**
   * Retrieves the current status of a pairing session by sessionId or pairingCode.
   */
  getSession(identifier: string): PosPairingSession {
    const session = this.findSession(identifier);
    if (!session) {
      throw new NotFoundException("Pairing session not found");
    }

    if (session.status === "PENDING" && new Date() > session.expiresAt) {
      session.status = "EXPIRED";
    }

    return session;
  }

  /**
   * Authorizes a pending pairing session from the Android app or Admin user.
   * Can accept either sessionId or pairingCode.
   */
  async authorizeSession(
    identifier: string,
    organizationId: string,
    memberId: string,
    prisma: any,
    options?: {
      locationId?: string;
      deviceName?: string;
      deviceType?: any;
    }
  ) {
    const session = this.getSession(identifier);

    if (session.status === "EXPIRED" || new Date() > session.expiresAt) {
      session.status = "EXPIRED";
      throw new BadRequestException("Pairing session has expired. Please refresh the QR code on POS.");
    }

    if (session.status === "AUTHORIZED" && session.payload) {
      return session.payload;
    }

    // Determine target location
    let targetLocationId = options?.locationId;
    if (!targetLocationId) {
      const defaultLoc = await (prisma.client || prisma).inventoryLocation.findFirst({
        where: { organizationId, isActive: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
      if (!defaultLoc) {
        throw new BadRequestException("No active location found for organization");
      }
      targetLocationId = defaultLoc.id;
    }

    // Generate a single-use setup token for this organization & location
    const setupTokenObj = await createDeviceSetupTokenCore(prisma, {
      organizationId,
      createdById: memberId,
      locationId: targetLocationId,
      deviceName: options?.deviceName || "POS Terminal",
      deviceType: options?.deviceType || "MAIN_HUB",
      permissions: ["*"],
    });

    // Provision the device
    const provisionResult = await provisionDeviceV3(prisma, setupTokenObj.token);

    session.payload = provisionResult;
    session.status = "AUTHORIZED";

    return provisionResult;
  }
}
