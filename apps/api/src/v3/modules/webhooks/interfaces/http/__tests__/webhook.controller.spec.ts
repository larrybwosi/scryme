import { Test, TestingModule } from "@nestjs/testing";
import { WebhookController } from "../webhook.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { Reflector } from "@nestjs/core";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PERMISSIONS_KEY } from "@/v3/common/decorators/permissions.decorator";

describe("WebhookController Security and Metadata", () => {
  let controller: WebhookController;
  let reflector: Reflector;

  const mockPrisma = {
    client: {
      webhookSubscription: {
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };

  const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        Reflector,
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should have webhooks:write permission on create", () => {
    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      WebhookController.prototype.create,
    );
    expect(permissions).toEqual(["webhooks:write"]);
  });

  it("should have webhooks:read permission on list", () => {
    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      WebhookController.prototype.list,
    );
    expect(permissions).toEqual(["webhooks:read"]);
  });

  it("should have webhooks:write permission on delete", () => {
    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      WebhookController.prototype.delete,
    );
    expect(permissions).toEqual(["webhooks:write"]);
  });
});
