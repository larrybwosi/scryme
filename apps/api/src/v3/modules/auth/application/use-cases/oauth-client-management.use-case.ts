import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "@repo/db";
import { randomBytes } from "crypto";
import { CreateOAuthClientDtoInput, UpdateOAuthClientDtoInput } from "../dto/oauth-client.schema";

@Injectable()
export class OAuthClientManagementUseCase {
  async createClient(userId: string | undefined, dto: CreateOAuthClientDtoInput) {
    const clientId = `scryme_${randomBytes(16).toString("hex")}`;
    const clientSecret = dto.public ? undefined : `sec_${randomBytes(32).toString("hex")}`;

    const metadata = {
      scopes: dto.scopes || ["user.profile", "user.email"],
      corsOrigins: dto.corsOrigins || [],
    };

    const client = await db.oAuthClient.create({
      data: {
        clientId,
        clientSecret,
        name: dto.name,
        icon: dto.icon,
        uri: dto.uri,
        tos: dto.tos,
        policy: dto.policy,
        redirectUris: dto.redirectUris,
        public: dto.public ?? false,
        skipConsent: dto.skipConsent ?? false,
        grantTypes: ["authorization_code", "refresh_token", "client_credentials"],
        responseTypes: ["code"],
        userId: userId ?? null,
        metadata: metadata as any,
      },
    });

    return {
      ...client,
      clientSecret: clientSecret || undefined,
      scopes: metadata.scopes,
      corsOrigins: metadata.corsOrigins,
    };
  }

  async listClients(userId?: string) {
    const clients = await db.oAuthClient.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return clients.map((c) => {
      const meta = (c.metadata as any) || {};
      return {
        ...c,
        clientSecret: undefined,
        scopes: meta.scopes || ["user.profile", "user.email"],
        corsOrigins: meta.corsOrigins || [],
      };
    });
  }

  async getClientById(id: string, userId?: string) {
    const client = await db.oAuthClient.findFirst({
      where: {
        OR: [{ id }, { clientId: id }],
        ...(userId ? { userId } : {}),
      },
    });

    if (!client) {
      throw new NotFoundException(`OAuth Client with ID '${id}' not found`);
    }

    const meta = (client.metadata as any) || {};

    return {
      ...client,
      clientSecret: undefined,
      scopes: meta.scopes || ["user.profile", "user.email"],
      corsOrigins: meta.corsOrigins || [],
    };
  }

  async updateClient(id: string, userId: string | undefined, dto: UpdateOAuthClientDtoInput) {
    const existing = await this.getClientById(id, userId);

    const existingMeta = (existing.metadata as any) || {};
    const updatedMeta = {
      ...existingMeta,
      ...(dto.scopes ? { scopes: dto.scopes } : {}),
      ...(dto.corsOrigins ? { corsOrigins: dto.corsOrigins } : {}),
    };

    const updated = await db.oAuthClient.update({
      where: { id: existing.id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.redirectUris ? { redirectUris: dto.redirectUris } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.uri !== undefined ? { uri: dto.uri } : {}),
        ...(dto.tos !== undefined ? { tos: dto.tos } : {}),
        ...(dto.policy !== undefined ? { policy: dto.policy } : {}),
        ...(dto.public !== undefined ? { public: dto.public } : {}),
        ...(dto.skipConsent !== undefined ? { skipConsent: dto.skipConsent } : {}),
        metadata: updatedMeta as any,
      },
    });

    return {
      ...updated,
      clientSecret: undefined,
      scopes: updatedMeta.scopes || ["user.profile", "user.email"],
      corsOrigins: updatedMeta.corsOrigins || [],
    };
  }

  async deleteClient(id: string, userId?: string) {
    const existing = await this.getClientById(id, userId);

    await db.oAuthClient.delete({
      where: { id: existing.id },
    });

    return { success: true, message: "OAuth client deleted successfully" };
  }
}
