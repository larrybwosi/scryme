import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuthClientManagementUseCase } from "../oauth-client-management.use-case";
import { NotFoundException } from "@nestjs/common";
import { db } from "@repo/db";

vi.mock("@repo/db", () => ({
  db: {
    oAuthClient: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("OAuthClientManagementUseCase", () => {
  let useCase: OAuthClientManagementUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new OAuthClientManagementUseCase();
  });

  it("should create an OAuth client application with clientSecret and metadata", async () => {
    const mockCreated = {
      id: "client_1",
      clientId: "scryme_abc123",
      clientSecret: "sec_xyz456",
      name: "Test App",
      redirectUris: ["https://app.com/callback"],
      public: false,
      metadata: { scopes: ["user.profile"], corsOrigins: ["https://app.com"] },
    };

    vi.mocked(db.oAuthClient.create).mockResolvedValue(mockCreated as any);

    const result = await useCase.createClient("user_123", {
      name: "Test App",
      redirectUris: ["https://app.com/callback"],
      scopes: ["user.profile"],
      corsOrigins: ["https://app.com"],
    });

    expect(db.oAuthClient.create).toHaveBeenCalled();
    expect(result.name).toBe("Test App");
    expect(result.scopes).toEqual(["user.profile"]);
  });

  it("should list OAuth clients for a user", async () => {
    const mockClients = [
      {
        id: "client_1",
        clientId: "scryme_abc",
        clientSecret: "sec_secret",
        name: "Test App 1",
        metadata: { scopes: ["user.profile"] },
      },
    ];

    vi.mocked(db.oAuthClient.findMany).mockResolvedValue(mockClients as any);

    const result = await useCase.listClients("user_123");

    expect(db.oAuthClient.findMany).toHaveBeenCalledWith({
      where: { userId: "user_123" },
      orderBy: { createdAt: "desc" },
    });
    expect(result.length).toBe(1);
    expect(result[0].clientSecret).toBeUndefined();
  });

  it("should rotate secret for an OAuth client", async () => {
    const existingClient = {
      id: "client_1",
      clientId: "scryme_abc",
      name: "Test App 1",
      metadata: { scopes: ["user.profile"] },
    };

    vi.mocked(db.oAuthClient.findFirst).mockResolvedValue(existingClient as any);
    vi.mocked(db.oAuthClient.update).mockImplementation(async (args: any) => ({
      ...existingClient,
      clientSecret: args.data.clientSecret,
    }) as any);

    const result = await useCase.rotateSecret("client_1", "user_123");

    expect(result.clientSecret).toMatch(/^sec_/);
    expect(db.oAuthClient.update).toHaveBeenCalledWith({
      where: { id: "client_1" },
      data: {
        clientSecret: expect.stringMatching(/^sec_/),
      },
    });
  });

  it("should throw NotFoundException if OAuth client is not found", async () => {
    vi.mocked(db.oAuthClient.findFirst).mockResolvedValue(null);

    await expect(useCase.getClientById("invalid_id", "user_123")).rejects.toThrow(
      NotFoundException,
    );
  });
});
