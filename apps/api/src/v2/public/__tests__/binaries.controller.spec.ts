import { Test, TestingModule } from "@nestjs/testing";
import { BinariesController } from "../binaries.controller";
import { NotFoundException, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import { FastifyReply } from "fastify";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("axios");
vi.mock("@repo/env", () => ({
  env: {
    GITHUB_OWNER: "test-owner",
    GITHUB_REPO: "test-repo",
    GITHUB_TOKEN: "test-token",
  },
}));

describe("BinariesController", () => {
  let controller: BinariesController;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BinariesController],
    }).compile();

    controller = module.get<BinariesController>(BinariesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should throw NotFoundException if no asset found for platform", async () => {
    (axios.get as any).mockResolvedValue({
      data: {
        assets: [{ name: "other.txt", browser_download_url: "url", size: 100 }],
      },
    });

    const res = {
      header: vi.fn(),
      send: vi.fn(),
    } as unknown as FastifyReply;

    await expect(controller.downloadBinary("windows", res)).rejects.toThrow(NotFoundException);
  });

  it("should proxy the binary download for windows using pipe", async () => {
    const mockRelease = {
      assets: [
        { name: "app.msi", browser_download_url: "http://download/app.msi", size: 1000 },
      ],
    };

    const mockStream = { pipe: vi.fn() };

    (axios.get as any).mockResolvedValueOnce({ data: mockRelease });
    (axios as any).mockResolvedValueOnce({
      headers: { "content-type": "application/octet-stream" },
      data: mockStream,
    });

    const res = {
      header: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    await controller.downloadBinary("windows", res);

    expect(res.header).toHaveBeenCalledWith("Content-Type", "application/octet-stream");
    expect(res.header).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="app.msi"');
    expect(res.header).toHaveBeenCalledWith("Content-Length", 1000);
    expect(mockStream.pipe).toHaveBeenCalledWith(res);
  });

  it("should use cache for subsequent requests", async () => {
    const mockRelease = {
      assets: [
        { name: "app.msi", browser_download_url: "http://download/app.msi", size: 1000 },
      ],
    };

    const mockStream = { pipe: vi.fn() };

    // Setup for 1st call (release info + download)
    (axios.get as any).mockResolvedValueOnce({ data: mockRelease });
    (axios as any).mockResolvedValueOnce({
      headers: { "content-type": "application/octet-stream" },
      data: mockStream,
    });

    // Setup for 2nd call (download only, as release info should be cached)
    (axios as any).mockResolvedValueOnce({
      headers: { "content-type": "application/octet-stream" },
      data: mockStream,
    });

    const res = {
      header: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    // First call
    await controller.downloadBinary("windows", res);
    // Second call
    await controller.downloadBinary("windows", res);

    // axios.get (for the release info) should only be called once
    expect(axios.get).toHaveBeenCalledTimes(1);
    // mockStream.pipe should be called twice (once for each request)
    expect(mockStream.pipe).toHaveBeenCalledTimes(2);
  });

  it("should throw InternalServerErrorException on axios error", async () => {
    (axios.get as any).mockRejectedValue(new Error("Network Error"));

    const res = {} as FastifyReply;

    await expect(controller.downloadBinary("windows", res)).rejects.toThrow(InternalServerErrorException);
  });
});
