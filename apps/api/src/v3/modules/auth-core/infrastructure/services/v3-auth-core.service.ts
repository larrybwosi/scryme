import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { env } from "@repo/env";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { decrypt } from "@repo/shared/api/v2/utils/encryption";
import { timingSafeMatch } from "@repo/shared/api/v2/utils/crypto";
import { provisionDeviceV3 } from "@repo/shared/lib/provisioning/v3";

@Injectable()
export class V3AuthCoreService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionDevice(token: string) {
    try {
      return await provisionDeviceV3(this.prisma, token);
    } catch (err) {
      throw new UnauthorizedException(
        err instanceof Error ? err.message : "Provisioning failed",
      );
    }
  }

  async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prisma.client.v3ApiClient.findUnique({
      where: { clientId },
      include: { organization: true },
    });

    if (!client || !client.isActive)
      throw new UnauthorizedException("Invalid client");

    try {
      const decryptedSecret = decrypt(client.clientSecret);
      const isSecretValid = timingSafeMatch(clientSecret, decryptedSecret);
      if (!isSecretValid)
        throw new UnauthorizedException("Invalid client secret");
    } catch (error) {
      const isSecretValid = await bcrypt.compare(
        clientSecret,
        client.clientSecret,
      );
      if (!isSecretValid)
        throw new UnauthorizedException("Invalid client secret");
    }

    return client;
  }

  private getJwtSecret(): string {
    return env.JWT_SECRET;
  }

  async generateToken(client: any, member?: any) {
    const payload = this.prepareTokenPayload(client);

    if (member) {
      await this.enrichPayloadWithMember(payload, client.id, member.id);
    }

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: member ? "12h" : "1h",
      algorithm: "HS256",
    });
  }

  private prepareTokenPayload(client: any) {
    return {
      sub: client.id,
      clientId: client.clientId,
      organizationId: client.organizationId,
      orgSlug: client.organization.slug,
      scopes: client.scopes,
      type: "v3_client",
    } as any;
  }

  private async enrichPayloadWithMember(
    payload: any,
    clientId: string,
    memberId: string,
  ) {
    payload.memberId = memberId;
    payload.type = "v3_hybrid";
    const registry = await this.prisma.client.deviceRegistry.findFirst({
      where: { apiKeyId: clientId },
    });
    if (registry) {
      payload.locationId = registry.locationId;
      payload.deviceId = registry.id;
    }
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, this.getJwtSecret(), {
        algorithms: ["HS256"],
      }) as any;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
