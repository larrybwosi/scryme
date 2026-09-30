import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiKeyManagementUseCase } from "../api-key-management.use-case";
import { NotFoundException } from "@nestjs/common";
import { db } from "@repo/db";

vi.mock("@repo/db", () => ({
  db: {
    apikey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("ApiKeyManagementUseCase", () => {
  let useCase: ApiKeyManagementUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ApiKeyManagementUseCase();
  });

  it("should create an API key", async () => {
    const mockCreated = {
      id: "key_123",
      name: "My Key",
      prefix: "sk_live_",
      start: "sk_live_1234",
      enabled: true,
      createdAt: new Date(),
      lastRequest: null,
    };

    vi.mocked(db.apikey.create).mockResolvedValue(mockCreated as any);

    const result = await useCase.createApiKey("user_123", { name: "My Key" });

    expect(db.apikey.create).toHaveBeenCalled();
    expect(result.id).toBe("key_123");
    expect(result.name).toBe("My Key");
  });

  it("should toggle API key status scoped by userId", async () => {
    const existingKey = {
      id: "key_123",
      name: "My Key",
      enabled: true,
    };

    vi.mocked(db.apikey.findFirst).mockResolvedValue(existingKey as any);
    vi.mocked(db.apikey.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.apikey.findFirstOrThrow).mockResolvedValue({
      ...existingKey,
      enabled: false,
    } as any);

    const result = await useCase.toggleApiKey("key_123", "user_123");

    expect(result.isActive).toBe(false);
    expect(db.apikey.updateMany).toHaveBeenCalledWith({
      where: { id: "key_123", userId: "user_123" },
      data: {
        enabled: false,
        updatedAt: expect.any(Date),
      },
    });
  });

  it("should delete API key scoped by userId", async () => {
    const existingKey = {
      id: "key_123",
      name: "My Key",
    };

    vi.mocked(db.apikey.findFirst).mockResolvedValue(existingKey as any);
    vi.mocked(db.apikey.deleteMany).mockResolvedValue({ count: 1 } as any);

    const result = await useCase.deleteApiKey("key_123", "user_123");

    expect(result.success).toBe(true);
    expect(db.apikey.deleteMany).toHaveBeenCalledWith({
      where: { id: "key_123", userId: "user_123" },
    });
  });

  it("should throw NotFoundException if API key is not found", async () => {
    vi.mocked(db.apikey.findFirst).mockResolvedValue(null);

    await expect(useCase.toggleApiKey("invalid_id", "user_123")).rejects.toThrow(
      NotFoundException,
    );
  });
});
